// ─────────────────────────────────────────────────────────────────────────────
// ADD THESE TWO LINES to the studentAPI object in your existing:
//   joblens-frontend/src/services/api.js
//
// Locate the "studentAPI" export and add these two methods:
// ─────────────────────────────────────────────────────────────────────────────

/*

export const studentAPI = {
  getProfile:             ()        => api.get('/student/profile'),
  updateProfile:          (data)    => api.patch('/student/profile', data),
  uploadResume:           (form)    => api.post('/student/resume', form),
  getDashboard:           ()        => api.get('/student/dashboard'),
  getOnCampusDrives:      ()        => api.get('/student/drives/oncampus'),
  applyToDrive:           (id)      => api.post(`/student/drives/oncampus/${id}/apply`),
  getAppStatus:           (id)      => api.get(`/student/drives/oncampus/${id}/status`),
  getOffCampusFeed:       (params)  => api.get('/student/drives/offcampus', { params }),
  generateJobLinks:       (data)    => api.post('/student/job-links', data),
  resumeMatch:            (data)    => api.post('/student/resume-match', data),

  // ── ✅ ADD THESE TWO NEW LINES ──────────────────────────────────────────
  checkJobAuthenticity:   (data)    => api.post('/student/job-verifier/check', data),
  getJobVerifierHistory:  ()        => api.get('/student/job-verifier/history'),
};

*/

// ─────────────────────────────────────────────────────────────────────────────
// That's the ONLY change needed in api.js
// ─────────────────────────────────────────────────────────────────────────────
