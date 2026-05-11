const Student = require('../models/Student');
const Application = require('../models/Application');
const OnCampusDrive = require('../models/OnCampusDrive');
const OffCampusDrive = require('../models/OffCampusDrive');
const { ApiResponse, ApiError } = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
// PROFILE
// GET /api/student/profile
exports.getProfile = asyncHandler(async (req, res, next) => {
  const student = await Student.findOne({ user: req.user._id })
    .populate('user', 'email role lastLogin isActive');
  if (!student) return next(new ApiError(404, 'Student profile not found'));
  res.status(200).json(new ApiResponse(200, student));
});
// PATCH /api/student/profile
exports.updateProfile = asyncHandler(async (req, res, next) => {
  // Only these fields are student-editable
  const EDITABLE = [
    'personalEmail', 'contact', 'address',
    'skills', 'projects', 'internships',
    'certifications', 'academicAchievements',
    'codingProfiles', 'profileSummary', 'education',
  ];
  const updates = {};
  EDITABLE.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });
  if (!Object.keys(updates).length)
    return next(new ApiError(400, 'No valid fields provided for update'));
  const student = await Student.findOneAndUpdate(
    { user: req.user._id },
    { $set: updates },
    { new: true, runValidators: true }
  );
  if (!student) return next(new ApiError(404, 'Student profile not found'));
  res.status(200).json(new ApiResponse(200, student, 'Profile updated successfully'));
});
// RESUME
// POST /api/student/resume
exports.uploadResume = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new ApiError(400, 'Resume PDF is required'));
  const resumeUrl = `/uploads/resumes/${req.file.filename}`;
  const student = await Student.findOneAndUpdate(
    { user: req.user._id },
    {
      $set: {
        'resume.url': resumeUrl,
        'resume.uploadedAt': new Date(),
        lastResumeReminderSent: new Date(),
      },
    },
    { new: true }
  );
  if (!student) return next(new ApiError(404, 'Student profile not found'));
  res.status(200).json(
    new ApiResponse(200, { resumeUrl, uploadedAt: student.resume.uploadedAt }, 'Resume uploaded successfully')
  );
});
// DASHBOARD — statistics + drive history
// GET /api/student/dashboard
exports.getDashboard = asyncHandler(async (req, res, next) => {
  const student = await Student.findOne({ user: req.user._id })
    .select('name rollNumber branch passedOutYear cgpa activeBacklogs stats resume');
  if (!student) return next(new ApiError(404, 'Student profile not found'));
  const applications = await Application.find({ student: student._id })
    .populate('drive', 'companyName minPackage maxPackage status isFrozen selectionRatio')
    .sort({ appliedAt: -1 });
  // Status breakdown for pie/bar charts on frontend
  const statusBreakdown = {
    registered: 0, shortlisted: 0, in_progress: 0,
    selected: 0, rejected: 0, not_shortlisted: 0,
  };
  const driveHistory = applications.map((app) => {
    if (statusBreakdown[app.overallStatus] !== undefined) {
      statusBreakdown[app.overallStatus]++;
    }
    return {
      applicationId: app._id,
      driveId: app.drive?._id,
      companyName: app.drive?.companyName,
      overallStatus: app.overallStatus,
      eliminatedAtRound: app.eliminatedAtRound,
      roundStatuses: app.roundStatuses,
      appliedAt: app.appliedAt,
      feedbackPending:
        !app.feedbackSubmitted &&
        ['selected', 'rejected', 'not_shortlisted'].includes(app.overallStatus),
    };
  });
  res.status(200).json(
    new ApiResponse(200, {
      student: {
        name: student.name, rollNumber: student.rollNumber,
        branch: student.branch, passedOutYear: student.passedOutYear,
        cgpa: student.cgpa, activeBacklogs: student.activeBacklogs,
        hasResume: !!student.resume?.url,
      },
      stats: student.stats,
      statusBreakdown,
      driveHistory,
      totalApplications: applications.length,
    })
  );
});
// ON-CAMPUS DRIVE VISIBILITY (Active + Past)
// GET /api/student/drives/oncampus
// Implements full SRS FR-13 logic:
//  • Drives where batch/branch doesn't match → excluded entirely
//  • CGPA < cutoff OR backlogs > allowed → Past Drives ("Not eligible")
//  • Eligible + not applied → Active Drives (registration open)
//  • overallStatus: registered / shortlisted / in_progress → Active Drives
//  • overallStatus: not_shortlisted / rejected / selected → Past Drives
exports.getOnCampusDrives = asyncHandler(async (req, res, next) => {
  const student = await Student.findOne({ user: req.user._id });
  if (!student) return next(new ApiError(404, 'Student profile not found'));
  // Only drives targeting this student's batch AND branch
  const drives = await OnCampusDrive.find({
    eligibleBatches: student.passedOutYear,
    eligibleBranches: student.branch,
  })
    .populate({
      path: 'rounds',
      select: 'roundNumber roundName date venue description isFinalRound eligibleList attendedList qualifiedList eligibleEmailSent resultEmailSent',
    })
    .sort({ createdAt: -1 });
  const activeDrives = [];
  const pastDrives = [];
  for (const drive of drives) {
    const application = await Application.findOne({
      student: student._id,
      drive: drive._id,
    });
    const meetsEligibility =
      student.cgpa >= (drive.cgpaCutOff ?? 0) &&
      student.activeBacklogs <= (drive.backlogsAllowed ?? 999);

    const driveObj = drive.toObject();
    driveObj.applicationId = application?._id || null;
    driveObj.overallStatus = application?.overallStatus || null;
    driveObj.roundStatuses = application?.roundStatuses || [];
    driveObj.eliminatedAtRound = application?.eliminatedAtRound || null;
    driveObj.feedbackSubmitted = application?.feedbackSubmitted || false;
    driveObj.feedbackPending =
      application &&
      !application.feedbackSubmitted &&
      ['selected', 'rejected', 'not_shortlisted'].includes(application?.overallStatus);
    if (!meetsEligibility) {
      // Fails CGPA or backlog criteria → Past Drives
      driveObj.visibilityReason = 'Not eligible — CGPA or active backlogs criteria not met';
      pastDrives.push(driveObj);
      continue;
    }
    if (!application) {
      // Eligible, not yet applied → Active (registration open card)
      driveObj.visibilityReason = 'Registration open';
      activeDrives.push(driveObj);
      continue;
    }
    switch (application.overallStatus) {
      case 'registered':
        driveObj.visibilityReason = 'Registered — awaiting Round 1 shortlist';
        activeDrives.push(driveObj);
        break;
      case 'shortlisted':
        driveObj.visibilityReason = 'Shortlisted for Round 1';
        activeDrives.push(driveObj);
        break;
      case 'in_progress':
        driveObj.visibilityReason = `Round ${application.roundStatuses.length} cleared — next round pending`;
        activeDrives.push(driveObj);
        break;
      case 'not_shortlisted':
        driveObj.visibilityReason = 'Not shortlisted for Round 1';
        pastDrives.push(driveObj);
        break;
      case 'rejected':
        driveObj.visibilityReason = `Not qualified in Round ${application.eliminatedAtRound}`;
        pastDrives.push(driveObj);
        break;
      case 'selected':
        driveObj.visibilityReason = 'SELECTED';
        driveObj.isSelected = true;
        pastDrives.push(driveObj);
        break;
      default:
        pastDrives.push(driveObj);
    }
  }
  res.status(200).json(new ApiResponse(200, { activeDrives, pastDrives }));
});
// APPLY TO DRIVE
// POST /api/student/drives/oncampus/:driveId/apply
exports.applyToDrive = asyncHandler(async (req, res, next) => {
  const student = await Student.findOne({ user: req.user._id });
  if (!student) return next(new ApiError(404, 'Student profile not found'));
  // Resume is mandatory before applying
  if (!student.resume?.url)
    return next(new ApiError(400, 'Please upload your resume before applying to any drive'));
  const drive = await OnCampusDrive.findById(req.params.driveId);
  if (!drive) return next(new ApiError(404, 'On-campus drive not found'));
  if (drive.isFrozen || drive.status === 'frozen')
    return next(new ApiError(400, 'Registration is closed — drive results have been declared'));
  if (drive.registrationDeadline && new Date() > new Date(drive.registrationDeadline))
    return next(new ApiError(400, 'Registration deadline has passed for this drive'));
  // Batch / branch check
  if (!drive.eligibleBatches.includes(student.passedOutYear))
    return next(new ApiError(403, `Your batch (${student.passedOutYear}) is not eligible for this drive`));
  if (!drive.eligibleBranches.includes(student.branch))
    return next(new ApiError(403, `Your branch (${student.branch}) is not eligible for this drive`));
  // CGPA check
  if (student.cgpa < (drive.cgpaCutOff ?? 0))
    return next(new ApiError(403, `Your CGPA (${student.cgpa}) is below the required cutoff (${drive.cgpaCutOff})`));
  // Backlog check
  if (student.activeBacklogs > (drive.backlogsAllowed ?? 999))
    return next(new ApiError(403, `Your active backlogs (${student.activeBacklogs}) exceed the allowed limit (${drive.backlogsAllowed})`));
  // Duplicate application guard (also enforced by DB index)
  const existing = await Application.findOne({ student: student._id, drive: drive._id });
  if (existing) return next(new ApiError(409, 'You have already applied to this drive'));
  const application = await Application.create({
    student: student._id,
    drive: drive._id,
    overallStatus: 'registered',
    resumeSnapshot: student.resume.url,
    appliedAt: new Date(),
  });
  await Student.findByIdAndUpdate(student._id, { $inc: { 'stats.drivesApplied': 1 } });
  res.status(201).json(
    new ApiResponse(201, application, `Successfully applied to ${drive.companyName}`)
  );
});
// APPLICATION STATUS for a specific drive
// GET /api/student/drives/oncampus/:driveId/status
exports.getApplicationStatus = asyncHandler(async (req, res, next) => {
  const student = await Student.findOne({ user: req.user._id }).select('_id');
  if (!student) return next(new ApiError(404, 'Student profile not found'));
  const application = await Application.findOne({
    student: student._id,
    drive: req.params.driveId,
  })
    .populate('drive', 'companyName minPackage maxPackage status isFrozen selectionRatio description')
    .populate('roundStatuses.round', 'roundName roundNumber date venue description');
  if (!application)
    return next(new ApiError(404, 'No application found for this drive'));
  res.status(200).json(new ApiResponse(200, application));
});
// OFF-CAMPUS DRIVES (student feed — batch + branch filtered)
// GET /api/student/drives/offcampus?category=&page=&limit=
exports.getOffCampusFeed = asyncHandler(async (req, res, next) => {
  const student = await Student.findOne({ user: req.user._id }).select('passedOutYear branch');
  if (!student) return next(new ApiError(404, 'Student profile not found'));
  const { category, page = 1, limit = 10 } = req.query;
  const filter = {
    eligibleBatches: student.passedOutYear,
    eligibleBranches: student.branch,
  };
  if (category) filter.driveCategory = category;
  const skip = (Number(page) - 1) * Number(limit);
  const [drives, total] = await Promise.all([
    OffCampusDrive.find(filter).sort({ publishedAt: -1 }).skip(skip).limit(Number(limit)),
    OffCampusDrive.countDocuments(filter),
  ]);
  res.status(200).json(
    new ApiResponse(200, {
      drives,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    })
  );
});
// AI JOB-SEARCH LINK GENERATOR (FR-21)
// POST /api/student/job-links
exports.generateJobLinks = asyncHandler(async (req, res) => {
  const {
    role = '',
    location = '',
    experience = '0',
  } = req.body;
  const encodedRole = encodeURIComponent(role.trim());
  const encodedLocation = encodeURIComponent(location.trim());
  const slugRole = role.trim().toLowerCase().replace(/\s+/g, '-');
  const slugLoc = location.trim().toLowerCase().replace(/\s+/g, '-');
  const links = {
    linkedin: `https://www.linkedin.com/jobs/search/?keywords=${encodedRole}&location=${encodedLocation}`,
    naukri: `https://www.naukri.com/${slugRole}-jobs-in-${slugLoc || 'india'}`,
    unstop: `https://unstop.com/jobs?search=${encodedRole}`,
    indeed: `https://in.indeed.com/jobs?q=${encodedRole}&l=${encodedLocation}`,
    internshala: `https://internshala.com/internships/${slugRole}-internship`,
    glassdoor: `https://www.glassdoor.co.in/Job/jobs.htm?sc.keyword=${encodedRole}&locKeyword=${encodedLocation}`,
    wellfound: `https://wellfound.com/jobs?query=${encodedRole}`,
    hirist: `https://www.hirist.tech/j/${slugRole}-jobs`,
  };
  res.status(200).json(
    new ApiResponse(200, { role, location, experience, links }, 'Job search links generated')
  );
});
// AI RESUME–JOB MATCH (FR-20) — Stub (connect to OpenAI / Anthropic in prod)
// POST /api/student/resume-match
exports.resumeMatch = asyncHandler(async (req, res, next) => {
  const { jobDescription } = req.body;
  const student = await Student.findOne({ user: req.user._id })
    .select('skills certifications internships projects profileSummary resume');
  if (!student) return next(new ApiError(404, 'Student profile not found'));
  if (!student.resume?.url)
    return next(new ApiError(400, 'Please upload your resume before using resume match'));
  if (!jobDescription)
    return next(new ApiError(400, 'jobDescription is required'));
  // Simple keyword-based stub — replace with LLM call in production
  const jdWords = jobDescription.toLowerCase().split(/\W+/);
  const matched = (student.skills || []).filter((s) => jdWords.includes(s.toLowerCase()));
  const missing = (student.skills || []).filter((s) => !jdWords.includes(s.toLowerCase()));
  const score = student.skills?.length
    ? Math.round((matched.length / student.skills.length) * 100)
    : 0;
  res.status(200).json(
    new ApiResponse(200, {
      jobFitScore: score,
      matchedSkills: matched,
      missingInJD: missing,
      suggestion: `Your profile matches ${score}% of the job description. Focus on: ${missing.slice(0, 3).join(', ') || 'All skills are covered'}.`,
      note: 'For detailed AI analysis, connect this endpoint to an LLM service.',
    })
  );
});
