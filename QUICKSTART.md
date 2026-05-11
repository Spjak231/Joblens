# 🔭 JobLens — Quick Start

## ⚡ 3-Step Launch

### Step 1 — Backend
```bash
cd CCPDMS_FINAL
cp .env.example .env        # then edit .env (see below)
npm install
node seed.js                # seed demo users
npm run dev                 # → http://localhost:5000
```

### Step 2 — Frontend  
```bash
cd joblens-frontend
# Create .env:
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
echo "REACT_APP_CLAUDE_API_KEY=sk-ant-YOUR_KEY" >> .env

npm install --legacy-peer-deps
npm start                   # → http://localhost:3000
```

### Step 3 — Get AI Key (FREE)
1. Go to https://console.anthropic.com
2. Create account → get **$5 free credit**
3. Generate API key → paste in frontend `.env`

---

## 🔐 Backend .env Required Fields

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/joblens
JWT_SECRET=any_random_32+_char_string_here
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
NODE_ENV=development
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=your_gmail_app_password  # NOT your normal password!
```

> Gmail App Password: Account → Security → 2-Step Verification → App Passwords

---

## 🎨 Theme Switching
Click the **3 colored dots** at the bottom of the sidebar:
- ⬤ Dark (default)
- ⬤ Light  
- ⬤ College (navy + gold)

---

## 📋 Pages Built

### Student Portal
| Page | URL | Features |
|------|-----|----------|
| Dashboard | `/student/dashboard` | Stats, charts, application history |
| On-Campus | `/student/oncampus` | Active/past drives, apply button |
| Off-Campus | `/student/offcampus` | Verified drives + job link generator |
| Profile | `/student/profile` | 4-tab edit, resume dropzone |
| AI Tools | `/student/ai` | Resume analyzer, interview prep, chatbot, job verifier |
| Feedback | `/student/feedback` | Browse company experiences, submit anonymous feedback |

### Coordinator Portal
| Page | URL | Features |
|------|-----|----------|
| Dashboard | `/coordinator/dashboard` | Batch pie charts, drill-down stats |
| Students | `/coordinator/students` | Filter, detail panel, CSV export |
| On-Campus | `/coordinator/oncampus` | Create drives, manage rounds, upload Excel lists |
| Off-Campus | `/coordinator/offcampus` | Manage verified external drives |
| Audit Logs | `/coordinator/audit` | Full action history |
| Notify | `/coordinator/notify` | Bulk email to students |

---

## 🤖 AI Features
| Feature | Description |
|---------|-------------|
| Resume Analyzer | ATS score (0-100), matched/missing keywords, tips |
| Interview Prep | Role-specific questions + AI feedback on answers |
| AI Chatbot | Placement assistant (floating FAB on every page) |
| Job Verifier | Scam/fake job detection with risk score |
| Job Link Generator | Instant search links for LinkedIn, Naukri, Unstop etc. |

---

## 🔐 Security Implemented
- JWT authentication with auto-refresh
- Role-based routing (student / coordinator)  
- First-login password change enforcement
- XSS sanitization on all form inputs (DOMPurify)
- CSRF protection via `withCredentials`
- 401 auto-logout with redirect
- Env vars for all secrets

---

## ❓ Common Issues

| Problem | Fix |
|---------|-----|
| CORS error | Set `CLIENT_URL=http://localhost:3000` in backend `.env` |
| MongoDB connection fail | Run `mongod` first |
| AI not working | Add `REACT_APP_CLAUDE_API_KEY` to frontend `.env` |
| 401 on login | Check `JWT_SECRET` is set, re-seed with `node seed.js` |
| npm install errors | Use `npm install --legacy-peer-deps` |
