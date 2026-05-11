# 🛡️ Job Verifier Feature — Complete Integration Guide

## What's Included

```
joblens-job-verifier/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   └── jobVerifier.controller.js   ← Main logic (asyncHandler + ApiResponse pattern)
│   │   ├── routes/
│   │   │   └── jobVerifier.routes.js       ← Express router (protect + authorize pattern)
│   │   ├── services/
│   │   │   ├── heuristic.service.js        ← 30+ regex/keyword scam patterns (no API)
│   │   │   ├── urlSafety.service.js        ← Google Safe Browsing + domain heuristics
│   │   │   └── claude.service.js           ← Claude AI deep NLP analysis
│   │   └── models/
│   │       └── JobVerification.js          ← Mongoose model (persists check history)
│   ├── server.patch.js                     ← Exact lines to add to server.js
│   ├── .env.patch                          ← New env vars to add to .env
│   └── package.patch.json                  ← New npm dependency to install
│
└── frontend/
    └── src/
        ├── pages/student/
        │   └── AITools.js                  ← Complete replacement (all 4 tabs working)
        └── services/
            └── api.patch.js                ← 2 new lines to add to api.js
```

---

## 🚀 Step-by-Step Integration

### BACKEND (CCPDMS_FINAL)

#### Step 1 — Copy new files
```
CCPDMS_FINAL/src/controllers/jobVerifier.controller.js   ← COPY
CCPDMS_FINAL/src/routes/jobVerifier.routes.js            ← COPY
CCPDMS_FINAL/src/services/heuristic.service.js           ← COPY
CCPDMS_FINAL/src/services/urlSafety.service.js           ← COPY
CCPDMS_FINAL/src/services/claude.service.js              ← COPY
CCPDMS_FINAL/src/models/JobVerification.js               ← COPY
```

#### Step 2 — Install new dependency
```bash
cd CCPDMS_FINAL
npm install @anthropic-ai/sdk
```

#### Step 3 — Edit server.js (2 changes)
Open `CCPDMS_FINAL/server.js` and:

**Add this import near the top** (with the other requires):
```js
const jobVerifierRoutes = require('./src/routes/jobVerifier.routes');
```

**Add this route** (after the other `app.use()` calls):
```js
app.use('/api/student/job-verifier', jobVerifierRoutes);
```

#### Step 4 — Edit .env (2 new variables)
Open `CCPDMS_FINAL/.env` and add:
```env
CLAUDE_API_KEY=sk-ant-api03-YOUR_KEY_HERE
GOOGLE_SAFE_BROWSING_API_KEY=AIzaSy-YOUR_KEY_HERE
```
> `GOOGLE_SAFE_BROWSING_API_KEY` is optional — system works without it using heuristics.
> Get Claude API key from: https://console.anthropic.com
> Get Google key (free) from: https://developers.google.com/safe-browsing/v4/get-started

---

### FRONTEND (joblens-frontend)

#### Step 5 — Replace AITools.js
```
REPLACE: joblens-frontend/src/pages/student/AITools.js
WITH:    joblens-job-verifier/frontend/src/pages/student/AITools.js
```

#### Step 6 — Edit api.js (2 new lines only)
Open `joblens-frontend/src/services/api.js`.

Find the `studentAPI` export and add these two lines at the end:
```js
export const studentAPI = {
  // ... all your existing methods stay unchanged ...
  checkJobAuthenticity:  (data) => api.post('/student/job-verifier/check', data),
  getJobVerifierHistory: ()     => api.get('/student/job-verifier/history'),
};
```

---

## ✅ Verification

After restarting both servers:
1. Login as a student → go to `AI Tools`
2. You'll see a new **🛡️ Job Verifier** tab
3. Paste a test scam message (e.g., "Earn ₹500/day, no experience needed, WhatsApp only: 9999999999")
4. Click **Check for Scams** → should return HIGH RISK / LIKELY SCAM

---

## 🔍 How It Works

```
User submits: companyName + jobLink + jobDescription
                         │
           ┌─────────────┼─────────────┐
           ▼             ▼             ▼
    Heuristic        URL Safety    Claude AI
    Service          Service       Service
    (30+ patterns)   (GSB + rules)  (deep NLP)
    Score 0-100      Score 0-100   Confidence 0-100
           │             │             │
           └─────────────┼─────────────┘
                         ▼
              Weighted Average:
              40% Heuristic
              20% URL Safety
              40% Claude AI
                         │
                         ▼
              Final Score → Verdict
              ≥72 → LIKELY LEGITIMATE (LOW risk)
              48-71 → SUSPICIOUS (MEDIUM risk)
              <48 → LIKELY SCAM (HIGH risk)
                         │
                         ▼
              Saved to MongoDB (JobVerification)
              Returned to frontend with:
              - verdict + risk level + score
              - all red flags (deduplicated)
              - all green flags
              - AI analysis text
              - URL safety details
              - score breakdown
```

---

## 📡 API Endpoints

### POST `/api/student/job-verifier/check`
Headers: `Authorization: Bearer <token>`

Request body:
```json
{
  "companyName": "XYZ Corp",
  "jobLink": "https://xyzjobs.click/apply",
  "jobDescription": "Earn ₹500/day working from home. No experience. WhatsApp: 9999999999"
}
```

Response:
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "verdict": "LIKELY SCAM",
    "riskLevel": "HIGH",
    "color": "red",
    "overallScore": 18,
    "scoreBreakdown": { "heuristic": 10, "urlSafety": 10, "ai": 25 },
    "redFlags": ["Scam signal: earn ₹500/day", "Suspicious TLD .click", "WhatsApp contact only"],
    "greenFlags": [],
    "aiAnalysis": "This posting exhibits multiple hallmarks of Indian job scams...",
    "urlSafety": { "safe": false, "domain": "xyzjobs.click", "threats": [] },
    "checkedAt": "2026-05-01T10:00:00.000Z"
  }
}
```

### GET `/api/student/job-verifier/history`
Returns last 20 checks made by the logged-in student.

---

## 🔒 Security Notes
- Route is protected by existing `protect` middleware (JWT)
- Role-restricted to `student` only (uses existing `authorize` middleware)
- Job descriptions truncated to 2000 chars before MongoDB storage
- Check history auto-expires after 90 days (TTL index on `checkedAt`)
- Claude API key is server-side only — never exposed to frontend
