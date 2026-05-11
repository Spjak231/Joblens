const OnCampusDrive = require('../models/OnCampusDrive');
const Application = require('../models/Application');
const AuditLog = require('../models/AuditLog');
const { filterEligibleStudents } = require('../services/filter.service');
const { ApiResponse, ApiError } = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
// Helper — safely parse JSON arrays (handles both parsed arrays and JSON strings)
const parseArray = (val) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return val.split(',').map((s) => s.trim()); }
  }
  return [];
};
// POST /api/oncampus  — Coordinator creates a new on-campus drive
exports.createDrive = asyncHandler(async (req, res, next) => {
  const {
    companyName, eligibleBatches, eligibleBranches,
    cgpaCutOff, backlogsAllowed, description,
    minPackage, maxPackage, registrationDeadline,
    registrationLink, status,
  } = req.body;

  if (!companyName || !eligibleBatches || !eligibleBranches || cgpaCutOff === undefined || cgpaCutOff === '')
    return next(new ApiError(400, 'companyName, eligibleBatches, eligibleBranches, and cgpaCutOff are required'));
  const batches = parseArray(eligibleBatches).map(Number);
  const branches = parseArray(eligibleBranches);
  if (!batches.length) return next(new ApiError(400, 'At least one eligible batch is required'));
  if (!branches.length) return next(new ApiError(400, 'At least one eligible branch is required'));
  // Duplicate check — same company + overlapping batch created today
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const duplicate = await OnCampusDrive.findOne({
    companyName: { $regex: new RegExp(`^${companyName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    eligibleBatches: { $in: batches },
    createdAt: { $gte: todayStart },
  });
  if (duplicate)
    return next(
      new ApiError(409, `A drive for "${companyName}" with overlapping batches was already created today (Drive ID: ${duplicate._id})`)
    );
  const drive = await OnCampusDrive.create({
    companyName: companyName.trim(),
    eligibleBatches: batches,
    eligibleBranches: branches,
    cgpaCutOff: Number(cgpaCutOff),
    backlogsAllowed: Number(backlogsAllowed ?? 0),
    description: description || '',
    minPackage: minPackage ? Number(minPackage) : undefined,
    maxPackage: maxPackage ? Number(maxPackage) : undefined,
    registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : undefined,
    registrationLink: registrationLink || '',
    status: status || 'active',
    documentUrl: req.file ? `/uploads/drive-docs/${req.file.filename}` : undefined,
    createdBy: req.user._id,
  });
  // Cache eligible student count
  const eligible = await filterEligibleStudents(drive);
  drive.eligibleStudentsCount = eligible.length;
  await drive.save();
  await AuditLog.create({
    user: req.user._id, action: 'DRIVE_CREATED',
    entity: 'OnCampusDrive', entityId: drive._id,
    details: { companyName: drive.companyName, batches, branches, eligibleCount: eligible.length },
    ip: req.ip,
  });
  res.status(201).json(
    new ApiResponse(201, drive, `On-campus drive for ${drive.companyName} created. ${eligible.length} students are eligible.`)
  );
});
// GET /api/oncampus?batch=&status=&page=&limit=  — Coordinator list
exports.getAllDrives = asyncHandler(async (req, res) => {
  const { batch, status, page = 1, limit = 10 } = req.query;
  const filter = {};
  if (batch) filter.eligibleBatches = Number(batch);
  if (status) filter.status = status;
  const skip = (Number(page) - 1) * Number(limit);
  const [drives, total] = await Promise.all([
    OnCampusDrive.find(filter)
      .populate('rounds', 'roundNumber roundName date isFinalRound')
      .populate('createdBy', 'email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    OnCampusDrive.countDocuments(filter),
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
// GET /api/oncampus/:id  — Full drive details (both roles)
exports.getDriveById = asyncHandler(async (req, res, next) => {
  const drive = await OnCampusDrive.findById(req.params.id)
    .populate('rounds')
    .populate('createdBy', 'email')
    .populate('lastUpdatedBy', 'email');

  if (!drive) return next(new ApiError(404, 'On-campus drive not found'));
  res.status(200).json(new ApiResponse(200, drive));
});
// PATCH /api/oncampus/:id  — Coordinator updates drive (blocked if frozen)
exports.updateDrive = asyncHandler(async (req, res, next) => {
  const drive = await OnCampusDrive.findById(req.params.id);
  if (!drive) return next(new ApiError(404, 'On-campus drive not found'));
  if (drive.isFrozen)
    return next(new ApiError(403, 'This drive is frozen after final results. No further edits are allowed.'));
  // registrationDeadline: only editable before Round 1 is created
  if (req.body.registrationDeadline && drive.rounds?.length > 0)
    return next(new ApiError(400, 'Registration deadline cannot be changed after Round 1 has been created'));
  const UPDATABLE = ['description', 'minPackage', 'maxPackage', 'registrationDeadline', 'registrationLink', 'status'];
  UPDATABLE.forEach((f) => {
    if (req.body[f] !== undefined) drive[f] = req.body[f];
  });
  if (req.file) drive.documentUrl = `/uploads/drive-docs/${req.file.filename}`;
  drive.lastUpdatedBy = req.user._id;
  await drive.save();
  await AuditLog.create({
    user: req.user._id, action: 'DRIVE_UPDATED',
    entity: 'OnCampusDrive', entityId: drive._id,
    details: req.body, ip: req.ip,
  });
  res.status(200).json(new ApiResponse(200, drive, 'Drive updated successfully'));
});
// GET /api/oncampus/:id/eligible-students  — Coordinator preview eligible students before creating drive
exports.getEligibleStudents = asyncHandler(async (req, res, next) => {
  const drive = await OnCampusDrive.findById(req.params.id);
  if (!drive) return next(new ApiError(404, 'Drive not found'));

  const students = await filterEligibleStudents(drive);
  res.status(200).json(new ApiResponse(200, { count: students.length, students }));
});
// GET /api/oncampus/:id/applications?status=  — All applicants for a drive
exports.getDriveApplications = asyncHandler(async (req, res, next) => {
  const drive = await OnCampusDrive.findById(req.params.id);
  if (!drive) return next(new ApiError(404, 'Drive not found'));

  const filter = { drive: drive._id };
  if (req.query.status) filter.overallStatus = req.query.status;

  const applications = await Application.find(filter)
    .populate('student', 'rollNumber name branch cgpa activeBacklogs collegeEmail passedOutYear')
    .sort({ appliedAt: -1 });

  res.status(200).json(
    new ApiResponse(200, { count: applications.length, applications })
  );
});
// GET /api/oncampus/:id/eligible-students  — Coordinator preview eligible students before creating drive
exports.getEligibleStudents = asyncHandler(async (req, res, next) => {
  const drive = await OnCampusDrive.findById(req.params.id);
  if (!drive) return next(new ApiError(404, 'Drive not found'));

  const students = await filterEligibleStudents(drive);
  res.status(200).json(new ApiResponse(200, { count: students.length, students }));
});
// GET /api/oncampus/:id/applications?status=  — All applicants for a drive
exports.getDriveApplications = asyncHandler(async (req, res, next) => {
  const drive = await OnCampusDrive.findById(req.params.id);
  if (!drive) return next(new ApiError(404, 'Drive not found'));

  const filter = { drive: drive._id };
  if (req.query.status) filter.overallStatus = req.query.status;

  const applications = await Application.find(filter)
    .populate('student', 'rollNumber name branch cgpa activeBacklogs collegeEmail passedOutYear')
    .sort({ appliedAt: -1 });

  res.status(200).json(
    new ApiResponse(200, { count: applications.length, applications })
  );
});
// GET /api/oncampus/:id/eligible-students  — Coordinator preview eligible students before creating drive
exports.getEligibleStudents = asyncHandler(async (req, res, next) => {
  const drive = await OnCampusDrive.findById(req.params.id);
  if (!drive) return next(new ApiError(404, 'Drive not found'));

  const students = await filterEligibleStudents(drive);
  res.status(200).json(new ApiResponse(200, { count: students.length, students }));
});
// GET /api/oncampus/:id/applications?status=  — All applicants for a drive
exports.getDriveApplications = asyncHandler(async (req, res, next) => {
  const drive = await OnCampusDrive.findById(req.params.id);
  if (!drive) return next(new ApiError(404, 'Drive not found'));

  const filter = { drive: drive._id };
  if (req.query.status) filter.overallStatus = req.query.status;

  const applications = await Application.find(filter)
    .populate('student', 'rollNumber name branch cgpa activeBacklogs collegeEmail passedOutYear')
    .sort({ appliedAt: -1 });

  res.status(200).json(
    new ApiResponse(200, { count: applications.length, applications })
  );
});
// GET /api/oncampus/:id/eligible-students  — Coordinator preview eligible students before creating drive
exports.getEligibleStudents = asyncHandler(async (req, res, next) => {
  const drive = await OnCampusDrive.findById(req.params.id);
  if (!drive) return next(new ApiError(404, 'Drive not found'));

  const students = await filterEligibleStudents(drive);
  res.status(200).json(new ApiResponse(200, { count: students.length, students }));
});
// GET /api/oncampus/:id/applications?status=  — All applicants for a drive
exports.getDriveApplications = asyncHandler(async (req, res, next) => {
  const drive = await OnCampusDrive.findById(req.params.id);
  if (!drive) return next(new ApiError(404, 'Drive not found'));

  const filter = { drive: drive._id };
  if (req.query.status) filter.overallStatus = req.query.status;

  const applications = await Application.find(filter)
    .populate('student', 'rollNumber name branch cgpa activeBacklogs collegeEmail passedOutYear')
    .sort({ appliedAt: -1 });

  res.status(200).json(
    new ApiResponse(200, { count: applications.length, applications })
  );
});
// GET /api/oncampus/:id/eligible-students  — Coordinator preview eligible students before creating drive
exports.getEligibleStudents = asyncHandler(async (req, res, next) => {
  const drive = await OnCampusDrive.findById(req.params.id);
  if (!drive) return next(new ApiError(404, 'Drive not found'));

  const students = await filterEligibleStudents(drive);
  res.status(200).json(new ApiResponse(200, { count: students.length, students }));
});
// GET /api/oncampus/:id/applications?status=  — All applicants for a drive
exports.getDriveApplications = asyncHandler(async (req, res, next) => {
  const drive = await OnCampusDrive.findById(req.params.id);
  if (!drive) return next(new ApiError(404, 'Drive not found'));

  const students = await filterEligibleStudents(drive);
  res.status(200).json(new ApiResponse(200, { count: students.length, students }));
});