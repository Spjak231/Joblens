// ─────────────────────────────────────────────────────────────────────────────
// server.js — ADD THESE LINES to your existing CCPDMS_FINAL/server.js
// ─────────────────────────────────────────────────────────────────────────────
//
// Step 1: Add this require near the top, alongside the other route imports:
//
//   const jobVerifierRoutes = require('./src/routes/jobVerifier.routes');
//
//
// Step 2: Mount the route, alongside the other app.use() calls:
//
//   app.use('/api/student/job-verifier', jobVerifierRoutes);
//
//
// ── Final server.js route section should look like this: ───────────────────
//
//   app.use('/api/auth',                authRoutes);
//   app.use('/api/student',             studentRoutes);
//   app.use('/api/oncampus',            onCampusRoutes);
//   app.use('/api/offcampus',           offCampusRoutes);
//   app.use('/api/rounds',              roundRoutes);
//   app.use('/api/feedback',            feedbackRoutes);
//   app.use('/api/coordinator',         coordinatorRoutes);
//   app.use('/api/student/job-verifier',jobVerifierRoutes);  // ← ADD THIS
//
// ─────────────────────────────────────────────────────────────────────────────
