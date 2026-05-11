const Student = require('../models/Student');
/**
 * Return all Student docs that match an OnCampusDrive's eligibility criteria.
 */
const filterEligibleStudents = async (drive) => {
  return Student.find({
    passedOutYear:  { $in: drive.eligibleBatches },
    branch:         { $in: drive.eligibleBranches },
    cgpa:           { $gte: drive.cgpaCutOff ?? 0 },
    activeBacklogs: { $lte: drive.backlogsAllowed ?? 999 },
  }).select('_id rollNumber name collegeEmail cgpa activeBacklogs branch passedOutYear');
};
/**
 * Check if a single student document is eligible for a drive.
 */
const isStudentEligible = (student, drive) =>
  drive.eligibleBatches.includes(student.passedOutYear) &&
  drive.eligibleBranches.includes(student.branch) &&
  student.cgpa >= (drive.cgpaCutOff ?? 0) &&
  student.activeBacklogs <= (drive.backlogsAllowed ?? 999);
module.exports = { filterEligibleStudents, isStudentEligible };