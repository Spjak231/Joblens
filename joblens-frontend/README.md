<!-- # 🎓 JobLens — CCPDMS Frontend
### Centralized Campus Placement & Drive Management System

---

## 🚀 Quick Start (3 Steps)

### Step 1 — Seed the Database (run once)
```bash
cd CCPDMS_FINAL
node seed.js
```
This creates demo coordinators, students, and drives in MongoDB.

### Step 2 — Start the Backend
```bash
cd CCPDMS_FINAL
npm start
# ✅ Running on http://localhost:5000
```

### Step 3 — Start the Frontend
```bash
cd joblens-frontend
npm install          # first time only (2-3 minutes)
npm start
# ✅ Opens http://localhost:3000
```

---

## 🔑 Login Credentials

| Role        | Email                        | Password  |
|-------------|------------------------------|-----------|
| Coordinator | coordinator@college.edu      | Test@123  |
| Student     | 23mh1a05k7@college.edu       | Test@123  |

> **First login** → System asks you to change your password.

---

## 🎨 Theme System

Use the theme switcher in the top-right corner:

| Theme    | Description                          |
|----------|--------------------------------------|
| 🌙 Dark  | Deep navy + orange (default)         |
| ☀️ Light | Clean white + orange                 |
| 🏫 College | Navy + saffron (Indian college palette) |

---

## 📋 All Pages & Features

### 👨‍💼 Coordinator Portal
| Page | URL | Features |
|------|-----|----------|
| Dashboard | `/coordinator` | 4-year batch pie charts, stats, quick actions |
| On-Campus Drives | `/coordinator/oncampus` | Create/edit drives, add rounds, freeze on final result |
| Off-Campus Drives | `/coordinator/offcampus` | Add jobs/internships/hackathons with apply links |
| Students | `/coordinator/students` | Filter by CGPA/backlog/batch/branch, export CSV |
| Placement Tracker | `/coordinator/placements` | Batch analytics, charts, drive list |
| Notifications | `/coordinator/notifications` | Email blast to filtered students |
| Audit Logs | `/coordinator/audit` | All coordinator actions logged |

### 👨‍🎓 Student Portal
| Page | URL | Features |
|------|-----|----------|
| Dashboard | `/student` | Stats, quick actions, greeting banner |
| Profile | `/student/profile` | Personal info, education, skills, resume upload |
| On-Campus | `/student/oncampus` | Active/past drive tabs, apply, round status tracking |
| Off-Campus | `/student/offcampus` | Curated external drives feed |
| App Status | `/student/status` | Timeline of all applications and round results |
| Resume Match AI | `/student/resume-match` | Paste JD → AI gives fit score, missing skills, tips |
| Job Links | `/student/job-links` | Generate LinkedIn/Naukri/Unstop links from filters |
| Fake Job Detector 🛡️ | `/student/fake-detect` | AI cybersecurity scan for fraud detection |
| Feedback | `/student/feedback` | Anonymous company feedback, read seniors' experiences |

---

## 🤖 AI Features

### 1. Resume–Job Match
- Compares your profile resume (or uploaded resume) with a pasted job description
- Returns: **fit score %, matched skills, missing skills, prep tips**
- Powered by your backend's `/api/student/resume-match` endpoint

### 2. Job Link Generator
- Input: role, location, experience, type
- Output: **ready-to-open links** for LinkedIn, Naukri, Unstop, Indeed, Internshala, Glassdoor
- Powered by your backend's `/api/student/job-links` endpoint

### 3. 🛡️ Fake Job Detector (Cybersecurity)
- Analyzes: company name, job link, contact email, description
- Uses Claude AI (with rule-based fallback)
- Returns: **Risk Score 0-100, SAFE/SUSPICIOUS/LIKELY_FAKE verdict, red flags, recommendations**

### 4. 🤖 PlaceMate Chatbot (floating button)
- Context-aware placement assistant
- Knows about current active drives
- Uses Claude AI for natural conversation

---

## 🗂️ Project Structure

```
joblens-frontend/
├── public/
│   └── index.html                  # Fonts loaded here (Syne + DM Sans)
├── src/
│   ├── App.js                      # Routes + Protected routes
│   ├── index.js                    # Entry point
│   ├── context/
│   │   ├── AuthContext.js          # JWT auth state
│   │   └── ThemeContext.js         # Dark/Light/College themes
│   ├── services/
│   │   └── api.js                  # All Axios API calls
│   ├── styles/
│   │   └── globals.css             # CSS variables, all shared styles
│   ├── components/
│   │   └── shared/index.js         # Sidebar, Topbar, Modal, Toast, etc.
│   └── pages/
│       ├── Login.js
│       ├── ChangePassword.js
│       ├── coordinator/
│       │   ├── Dashboard.js
│       │   ├── OnCampusDrives.js
│       │   ├── OffCampusDrives.js
│       │   ├── Students.js
│       │   ├── PlacementTracker.js
│       │   └── Misc.js              # Notifications, AuditLogs, NewDrive
│       └── student/
│           ├── Dashboard.js
│           ├── Profile.js
│           ├── OnCampus.js
│           ├── AppStatus.js
│           ├── OffCampusAndFeedback.js
│           └── AIFeatures.js        # ResumeMatch, JobLinks, FakeDetector, Chatbot
```

---

## 🔧 Environment Setup

### Backend `.env` (CCPDMS_FINAL/.env)
```
PORT=5000
MONGO_URI=<your MongoDB URI>
JWT_SECRET=<your secret>
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=<your gmail>
EMAIL_PASS=<app password>
COLLEGE_EMAIL_DOMAIN=college.edu
CLIENT_URL=http://localhost:3000
```

### Frontend (no .env needed — uses package.json proxy)
The `"proxy": "http://localhost:5000"` in `package.json` handles API routing automatically.

---

## ❓ Troubleshooting

| Issue | Fix |
|-------|-----|
| `npm start` fails | Run `npm install` first |
| Login shows "Invalid credentials" | Run `node seed.js` in CCPDMS_FINAL |
| CORS error | Make sure backend is running on port 5000 |
| Resume upload fails | Check `uploads/` folder exists in CCPDMS_FINAL |
| AI features show error | Backend AI endpoints may need implementation — fallback mode works |
| Blank page after login | Open browser console, check for JS errors |

---

## 🏗️ Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 18, React Router v6           |
| Styling    | Pure CSS with CSS variables (no Tailwind) |
| Charts     | Recharts                            |
| HTTP       | Axios (with JWT interceptors)       |
| Fonts      | Syne (display) + DM Sans (body)     |
| AI         | Anthropic Claude API (client-side for chatbot & fake detector) |
| Backend    | Node.js + Express                   |
| Database   | MongoDB + Mongoose                  |
| Auth       | JWT + bcryptjs                      |
| File Upload| Multer                              |
| Email      | Nodemailer                          |

---

*Built for CCPDMS — Centralized Campus Placement & Drive Management System* -->
