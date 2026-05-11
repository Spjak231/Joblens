const path = require('path');
const Round = require('../models/Round');
const OnCampusDrive = require('../models/OnCampusDrive');
const Application = require('../models/Application');
const Student = require('../models/Student');
const AuditLog = require('../models/AuditLog');
const { parseRollNumbers } = require('../utils/excelParser');
const { sendBulkEmails } = require('../services/email.service');
const { ApiResponse, ApiError } = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
// Helper — given a list of roll numbers, return a Map of roll → Student doc
const rollToStudentMap = async (rollNumbers) => {
  const students = await Student.find({ rollNumber: { $in: rollNumbers } })
    .select('_id rollNumber collegeEmail name');
  const map = new Map();
  students.forEach((s) => map.set(s.rollNumber, s));
  return map;
};
// POST /api/rounds  — Create a new round for an on-campus drive
exports.createRound = asyncHandler(async (req, res, next) => {
  const { driveId, roundName, venue, date, description } = req.body;
  if (!driveId || !roundName)
    return next(new ApiError(400, 'driveId and roundName are required'));
  const drive = await OnCampusDrive.findById(driveId);
  if (!drive) return next(new ApiError(404, 'On-campus drive not found'));
  if (drive.isFrozen) return next(new ApiError(403, 'Drive is frozen — cannot add more rounds'));
  const roundNumber = (drive.rounds?.length || 0) + 1;
  const round = await Round.create({
    drive: driveId,
    roundNumber,
    roundName: roundName.trim(),
    venue: venue || '',
    date: date ? new Date(date) : undefined,
    description: description || '',
  });
  // Push round reference to drive
  drive.rounds.push(round._id);
  await drive.save();
  await AuditLog.create({
    user: req.user._id, action: 'ROUND_CREATED',
    entity: 'Round', entityId: round._id,
    details: { driveId, companyName: drive.companyName, roundNumber, roundName }, ip: req.ip,
  });
  res.status(201).json(
    new ApiResponse(201, round, `Round ${roundNumber} (${roundName}) created for ${drive.companyName}`)
  );
});
// PATCH /api/rounds/:id  — Update venue / date / description of a round
exports.updateRound = asyncHandler(async (req, res, next) => {
  const round = await Round.findById(req.params.id).populate('drive', 'isFrozen companyName');
  if (!round) return next(new ApiError(404, 'Round not found'));
  if (round.drive?.isFrozen) return next(new ApiError(403, 'Drive is frozen — round details cannot be changed'));
  const { roundName, venue, date, description } = req.body;
  if (roundName) round.roundName = roundName.trim();
  if (venue) round.venue = venue;
  if (date) round.date = new Date(date);
  if (description) round.description = description;
  await round.save();
  await AuditLog.create({
    user: req.user._id, action: 'ROUND_UPDATED',
    entity: 'Round', entityId: round._id,
    details: { roundNumber: round.roundNumber, changes: req.body }, ip: req.ip,
  });
  res.status(200).json(new ApiResponse(200, round, 'Round updated successfully'));
});
// GET /api/rounds/drive/:driveId  — All rounds for a drive, ordered by roundNumber
exports.getRoundsByDrive = asyncHandler(async (req, res, next) => {
  const rounds = await Round.find({ drive: req.params.driveId }).sort({ roundNumber: 1 });
  res.status(200).json(new ApiResponse(200, rounds));
});
// PATCH /api/rounds/:id/eligible-list
// Upload Excel → parse roll numbers → update Application statuses → send emails
// Logic:
//  Round 1: registered → shortlisted (if in list) | not_shortlisted (if not in list)
//  Round N>1: in_progress students in list → add eligible roundStatus entry
exports.uploadEligibleList = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new ApiError(400, 'Excel file (.xlsx/.xls) is required'));
  const round = await Round.findById(req.params.id).populate('drive');
  if (!round) return next(new ApiError(404, 'Round not found'));
  if (round.drive.isFrozen) return next(new ApiError(403, 'Drive is frozen'));
  // Parse roll numbers from the uploaded Excel
  let rollNumbers;
  try {
    rollNumbers = parseRollNumbers(path.resolve(req.file.path));
  } catch (err) {
    return next(new ApiError(400, `Excel parsing failed: ${err.message}`));
  }
  // Save to round doc
  round.eligibleList = {
    fileUrl: `/uploads/round-results/${req.file.filename}`,
    rollNumbers,
    uploadedAt: new Date(),
  };
  await round.save();
  // Fetch all applications for this drive
  const allApps = await Application.find({ drive: round.drive._id })
    .populate('student', 'rollNumber collegeEmail name _id');
  const eligibleEmails = [];
  const bulkOps = [];
  for (const app of allApps) {
    const student = app.student;
    if (!student) continue;
    const inList = rollNumbers.includes(student.rollNumber);
    if (round.roundNumber === 1) {
      // ── Round 1 eligible list ───────────────────────────────────────────────
      if (inList) {
        bulkOps.push({
          updateOne: {
            filter: { _id: app._id },
            update: {
              $set: { overallStatus: 'shortlisted' },
              $push: {
                roundStatuses: {
                  round: round._id,
                  roundNumber: round.roundNumber,
                  roundName: round.roundName,
                  status: 'eligible',
                },
              },
            },
          },
        });
        eligibleEmails.push(student.collegeEmail);
      } else {
        // Not in Round 1 eligible list → permanently not_shortlisted
        bulkOps.push({
          updateOne: {
            filter: { _id: app._id },
            update: {
              $set: {
                overallStatus: 'not_shortlisted',
                eliminatedAtRound: round.roundNumber,
              },
            },
          },
        });
        // Increment rejected stats
        await Student.findByIdAndUpdate(student._id, { $inc: { 'stats.drivesRejected': 1 } });
      }
    } else {
      // ── Subsequent round eligible list ─────────────────────────────────
      // Only add entry for students who are still in_progress
      if (inList && app.overallStatus === 'in_progress') {
        bulkOps.push({
          updateOne: {
            filter: { _id: app._id },
            update: {
              $push: {
                roundStatuses: {
                  round: round._id,
                  roundNumber: round.roundNumber,
                  roundName: round.roundName,
                  status: 'eligible',
                },
              },
            },
          },
        });
        eligibleEmails.push(student.collegeEmail);
      }
    }
  }
  if (bulkOps.length) await Application.bulkWrite(bulkOps);
  // Send eligible emails (non-blocking; guard prevents re-send on re-upload)
  if (eligibleEmails.length && !round.eligibleEmailSent) {
    sendBulkEmails({
      to: eligibleEmails,
      subject: `[${round.drive.companyName}] Eligible for ${round.roundName} — Important`,
      text: `Dear Student,\n\nCongratulations! You have been shortlisted for ${round.roundName} at ${round.drive.companyName}.\n\nDetails:\n  Venue: ${round.venue || 'To be announced'}\n  Date:  ${round.date ? round.date.toDateString() : 'To be announced'}\n  Info:  ${round.description || 'Check the placement portal for updates.'}\n\nBest of luck!\n— Placement Cell`,
    });
    round.eligibleEmailSent = true;
    await round.save();
  }
  await AuditLog.create({
    user: req.user._id, action: 'ELIGIBLE_LIST_UPLOADED',
    entity: 'Round', entityId: round._id,
    details: { roundName: round.roundName, count: rollNumbers.length, emailsSent: eligibleEmails.length },
    ip: req.ip,
  });
  res.status(200).json(
    new ApiResponse(200, {
      parsedRollNumbers: rollNumbers,
      parsedCount: rollNumbers.length,
      emailsSent: eligibleEmails.length,
    }, 'Eligible list uploaded and notification emails dispatched')
  );
});
// PATCH /api/rounds/:id/attended-list
// Upload Excel → mark roundStatus as 'attended' | 'not_attended'
exports.uploadAttendedList = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new ApiError(400, 'Excel file is required'));

  const round = await Round.findById(req.params.id).populate('drive', 'isFrozen companyName _id');
  if (!round) return next(new ApiError(404, 'Round not found'));
  if (round.drive.isFrozen) return next(new ApiError(403, 'Drive is frozen'));

  let rollNumbers;
  try {
    rollNumbers = parseRollNumbers(path.resolve(req.file.path));
  } catch (err) {
    return next(new ApiError(400, `Excel parsing failed: ${err.message}`));
  }
  round.attendedList = {
    fileUrl: `/uploads/round-results/${req.file.filename}`,
    rollNumbers,
    uploadedAt: new Date(),
  };
  await round.save();
  const bulkOps = [];
  // Mark 'attended' for students who are in the list
  for (const roll of rollNumbers) {
    const student = await Student.findOne({ rollNumber: roll }).select('_id');
    if (!student) continue;
    bulkOps.push({
      updateOne: {
        filter: { student: student._id, drive: round.drive._id, 'roundStatuses.roundNumber': round.roundNumber },
        update: { $set: { 'roundStatuses.$.status': 'attended' } },
      },
    });
  }
  // Mark 'not_attended' for students who were eligible but absent
  const eligibleRolls = round.eligibleList?.rollNumbers || [];
  const notAttendedRolls = eligibleRolls.filter((r) => !rollNumbers.includes(r));
  for (const roll of notAttendedRolls) {
    const student = await Student.findOne({ rollNumber: roll }).select('_id');
    if (!student) continue;
    bulkOps.push({
      updateOne: {
        filter: { student: student._id, drive: round.drive._id, 'roundStatuses.roundNumber': round.roundNumber },
        update: { $set: { 'roundStatuses.$.status': 'not_attended' } },
      },
    });
  }
  if (bulkOps.length) await Application.bulkWrite(bulkOps);
  await AuditLog.create({
    user: req.user._id, action: 'ATTENDED_LIST_UPLOADED',
    entity: 'Round', entityId: round._id,
    details: { roundName: round.roundName, attendedCount: rollNumbers.length, notAttendedCount: notAttendedRolls.length },
    ip: req.ip,
  });

  res.status(200).json(
    new ApiResponse(200, {
      attendedCount: rollNumbers.length,
      notAttendedCount: notAttendedRolls.length,
    }, 'Attended list uploaded and statuses updated')
  );
});
// PATCH /api/rounds/:id/qualified-list
// Upload qualified Excel + isFinalRound flag.
// Logic per student:
//  • In list → qualified + (in_progress | selected if final)
//  • Not in list → not_qualified + rejected + eliminatedAtRound
// If isFinalRound=true → freeze drive, compute selectionRatio, send SELECTED emails
exports.uploadQualifiedList = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new ApiError(400, 'Excel file is required'));
  const isFinalRound = req.body.isFinalRound === 'true' || req.body.isFinalRound === true;
  const round = await Round.findById(req.params.id).populate('drive');
  if (!round) return next(new ApiError(404, 'Round not found'));
  if (round.drive.isFrozen) return next(new ApiError(403, 'Drive is already frozen'));
  let rollNumbers;
  try {
    rollNumbers = parseRollNumbers(path.resolve(req.file.path));
  } catch (err) {
    return next(new ApiError(400, `Excel parsing failed: ${err.message}`));
  }
  round.qualifiedList = {
    fileUrl: `/uploads/round-results/${req.file.filename}`,
    rollNumbers,
    uploadedAt: new Date(),
  };
  round.isFinalRound = isFinalRound;
  await round.save();
  // Fetch all applications that have a roundStatus entry for this round
  const affectedApps = await Application.find({
    drive: round.drive._id,
    'roundStatuses.roundNumber': round.roundNumber,
  }).populate('student', 'rollNumber collegeEmail name _id');
  const selectedEmails = [];
  const rejectedEmails = [];
  const bulkOps = [];
  for (const app of affectedApps) {
    if (!app.student) continue;
    const qualified = rollNumbers.includes(app.student.rollNumber);
    if (qualified) {
      // ── Qualified ──────────────────────────────────────────────────
      bulkOps.push({
        updateOne: {
          filter: { _id: app._id, 'roundStatuses.roundNumber': round.roundNumber },
          update: {
            $set: {
              'roundStatuses.$.status': 'qualified',
              overallStatus: isFinalRound ? 'selected' : 'in_progress',
            },
          },
        },
      });
      if (isFinalRound) {
        selectedEmails.push(app.student.collegeEmail);
        await Student.findByIdAndUpdate(app.student._id, { $inc: { 'stats.drivesSelected': 1 } });
      }
    } else {
      // ── Not qualified ─────────────────────────────────────────────────
      // Determine if student didn't attend or attended but didn't qualify
      const rsEntry = app.roundStatuses.find((rs) => rs.roundNumber === round.roundNumber);
      const roundStatusVal = (rsEntry?.status === 'not_attended') ? 'not_attended' : 'not_qualified';

      bulkOps.push({
        updateOne: {
          filter: { _id: app._id, 'roundStatuses.roundNumber': round.roundNumber },
          update: {
            $set: {
              'roundStatuses.$.status': roundStatusVal,
              overallStatus: 'rejected',
              eliminatedAtRound: round.roundNumber,
            },
          },
        },
      });
      rejectedEmails.push(app.student.collegeEmail);
      await Student.findByIdAndUpdate(app.student._id, { $inc: { 'stats.drivesRejected': 1 } });
    }
  }
  if (bulkOps.length) await Application.bulkWrite(bulkOps);
  // ── Freeze drive if this is the final round ───────────────────────────────
  if (isFinalRound) {
    const round1 = await Round.findOne({ drive: round.drive._id, roundNumber: 1 });
    const attendedInR1 = round1?.attendedList?.rollNumbers?.length || 0;
    await OnCampusDrive.findByIdAndUpdate(round.drive._id, {
      isFrozen: true,
      status: 'frozen',
      selectedStudentsCount: rollNumbers.length,
      selectionRatio: `${rollNumbers.length}/${attendedInR1}`,
    });
  }
  // ── Send emails (non-blocking) ────────────────────────────────────────────
  const company = round.drive.companyName;

  if (selectedEmails.length) {
    sendBulkEmails({
      to: selectedEmails,
      subject: `🎉 [${company}] Congratulations — You have been SELECTED!`,
      text: `Dear Student,\n\nCongratulations! You have successfully cleared all rounds and have been SELECTED by ${company}.\n\nThe HR team will contact you soon with your offer letter details.\n\nWell done!\n— Placement Cell`,
    });
  }
  if (rejectedEmails.length) {
    sendBulkEmails({
      to: rejectedEmails,
      subject: `[${company}] Application Status Update — ${round.roundName}`,
      text: `Dear Student,\n\nThank you for appearing in ${round.roundName} at ${company}. We regret to inform you that you have not been selected to proceed further in this process.\n\nPlease don't be disheartened — more drives are coming. Keep preparing!\n\nBest wishes,\n— Placement Cell`,
    });
  }
  // Guard: mark result emails as sent on the round
  if (!round.resultEmailSent && (selectedEmails.length || rejectedEmails.length)) {
    round.resultEmailSent = true;
    await round.save();
  }
  await AuditLog.create({
    user: req.user._id, action: 'RESULTS_PUBLISHED',
    entity: 'Round', entityId: round._id,
    details: {
      roundName: round.roundName, isFinalRound,
      qualifiedCount: rollNumbers.length,
      rejectedCount: rejectedEmails.length,
      driveFrozen: isFinalRound,
    },
    ip: req.ip,
  });
  res.status(200).json(
    new ApiResponse(200, {
      qualifiedCount: rollNumbers.length,
      rejectedCount: rejectedEmails.length,
      isFinalRound,
      driveFrozen: isFinalRound,
    }, isFinalRound
      ? `Final results published. Drive is now FROZEN. Selected: ${rollNumbers.length}`
      : `Round ${round.roundNumber} results published. ${rollNumbers.length} qualified, ${rejectedEmails.length} eliminated.`
    )
  );
});
