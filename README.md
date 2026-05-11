# JobLens – AI-Powered Campus Placement Management System

## 📌 Overview

JobLens is a full-stack MERN application designed to simplify and automate campus placement management processes for students, placement officers, and recruiters.

The platform provides role-based access, placement drive management, student eligibility filtering, AI chatbot assistance, resume verification, and AI-powered fake job detection features to improve efficiency and reduce manual work during placement activities.

---

# 🚨 Problem Statement

Campus placement management in many colleges is still handled manually or through disconnected systems.

Common problems include:

- Difficulty tracking student applications
- Manual eligibility verification
- Fake or suspicious job postings
- Lack of centralized placement management
- Time-consuming recruiter coordination
- No automated student-drive matching system
- Lack of career guidance support for students

These issues reduce efficiency, increase workload for placement officers, and create confusion for students during recruitment processes.

---

# 💡 Proposed Solution

JobLens solves these problems by providing a centralized AI-powered web platform that automates major placement activities.

The system offers:

- Student registration and profile management
- Placement drive creation and management
- Automated eligibility checking
- Resume analysis
- AI-powered fake job detection
- AI chatbot assistance for students
- Role-based authentication and authorization
- Secure REST APIs
- Dashboard-based placement tracking

The platform improves transparency, automation, security, and scalability for placement processes.

---

# ✨ Features

## 👨‍🎓 Student Features

- Student registration and login
- Profile management
- Resume upload
- Apply for placement drives
- View eligible drives
- Track applications
- View placement updates
- AI chatbot support for placement queries

---

## 🏢 Recruiter Features

- Create job drives
- Manage applicants
- Verify job postings
- View shortlisted students
- Track drive statistics

---

## 👨‍💼 Admin Features

- Manage students
- Manage recruiters
- Manage placement drives
- Monitor applications
- Control user roles and permissions
- Monitor suspicious job postings

---

## 🤖 AI Features

### ✅ AI Chatbot

The platform includes an AI-powered chatbot that helps students by answering placement-related queries such as:

- Eligibility doubts
- Resume guidance
- Placement process information
- Application tracking assistance
- Career-related support

---

### 🚨 Fake Job Detection System

One of the core features of JobLens is the AI-powered Fake Job Detection System.

The system helps identify suspicious or fraudulent job postings using:

- Heuristic pattern analysis
- URL safety checking
- AI verification
- Weighted risk scoring
- Scam keyword detection

This feature helps students avoid fake placement opportunities and improves trust within the platform.

---

# 🏗️ System Architecture

## Architecture Overview

```text
Frontend (React + Tailwind CSS)
                ↓
Backend REST API (Node.js + Express)
                ↓
Authentication Layer (JWT)
                ↓
MongoDB Database
                ↓
AI Services Layer
        ↙                ↘
AI Chatbot        Fake Job Detection
```

---

## Frontend

- React.js
- Tailwind CSS
- Axios
- React Router DOM

---

## Backend

- Node.js
- Express.js
- JWT Authentication
- REST APIs

---

## Database

- MongoDB
- Mongoose ODM

---

## AI Services

- AI Chatbot Support
- Fake Job Detection
- Heuristic Analysis
- URL Safety Validation
- Resume Assistance

---

## Security

- JWT Authentication
- Password hashing using bcrypt
- Protected routes
- Role-based access control
- Input validation

---

# 🛠️ Tech Stack

| Category | Technology |
|---|---|
| Frontend | React.js |
| Styling | Tailwind CSS |
| Backend | Node.js |
| Framework | Express.js |
| Database | MongoDB |
| Authentication | JWT |
| Password Security | bcrypt |
| API Testing | Postman |
| Version Control | Git & GitHub |

---

# 📂 Project Structure

```text
Joblens/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── services/
│   │   ├── utils/
│   │   └── config/
│   │
│   ├── tests/
│   └── package.json
│
├── README.md
└── docker-compose.yml
```

---

# 🔐 Authentication & Authorization

The application uses JWT-based authentication.

Supported roles:

- Admin
- Student
- Recruiter

Protected APIs are secured using middleware-based role verification.

---

# 📡 API Endpoints

## Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login user |

---

## Students

| Method | Endpoint |
|---|---|
| GET | /api/students |
| GET | /api/students/:id |
| PUT | /api/students/:id |

---

## Placement Drives

| Method | Endpoint |
|---|---|
| POST | /api/drives |
| GET | /api/drives |
| GET | /api/drives/:id |
| POST | /api/drives/apply |

---

## AI Chatbot

| Method | Endpoint |
|---|---|
| POST | /api/chatbot |

---

## Fake Job Detection

| Method | Endpoint |
|---|---|
| POST | /api/jobs/verify |

---

# ⚙️ Installation Guide

## Clone Repository

```bash
git clone https://github.com/Spjak231/Joblens.git
```

---

# 📦 Backend Setup

```bash
cd backend
npm install
npm run dev
```

Backend runs on:

```text
http://localhost:5000
```

---

# 💻 Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend runs on:

```text
http://localhost:3000
```

---

# 🔑 Environment Variables

Create a `.env` file inside the backend directory.

```env
PORT=5000
MONGO_URI=your_mongodb_connection
JWT_SECRET=your_secret_key
CLAUDE_API_KEY=your_api_key
EMAIL_USER=your_email
EMAIL_PASS=your_password
```

---

# 🐳 Docker Support

## Backend Dockerfile

```dockerfile
FROM node:20

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

---

## Frontend Dockerfile

```dockerfile
FROM node:20

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

---

## docker-compose.yml

```yml
version: "3"

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
```

---

# 🧪 Testing

The project supports automated testing using:

- Jest
- Supertest

Run tests:

```bash
npm test
```

Example test cases:

- Authentication testing
- Placement drive APIs
- Eligibility verification
- Fake job detection APIs
- AI chatbot APIs

---

# 🔒 Security Measures

- JWT authentication
- Password hashing using bcrypt
- Protected routes
- Input validation
- Role-based access control
- API authorization middleware

---

# 🚨 Fake Job Detection Workflow

```text
Recruiter Posts Job
          ↓
AI Verification Triggered
          ↓
URL Safety Check
          ↓
Heuristic Scam Detection
          ↓
AI Risk Analysis
          ↓
Risk Score Generated
          ↓
Safe / Suspicious Classification
```

---

# 📈 Future Enhancements

- Cloud deployment support
- Docker production deployment
- AI resume scoring
- Email notification system
- Real-time placement updates
- Analytics dashboard
- Mobile application
- Interview scheduling system
- Resume ranking using AI
- Voice-enabled AI chatbot
- Video interview integration

---

# 🚀 Deployment

Suggested deployment platforms:

| Service | Platform |
|---|---|
| Frontend | Vercel |
| Backend | Render |
| Database | MongoDB Atlas |

---

# 📸 Screenshots

Add screenshots of:

- Login page
- Dashboard
- Placement drives
- Student portal
- Recruiter portal
- AI chatbot
- Fake job detection result

---

# 👨‍💻 Contributors

## Adarsha Kunisetty

Developer of JobLens Placement Management System

GitHub:
https://github.com/Spjak231

---

# 📄 License

This project is developed for educational and academic purposes.

---

# ⭐ Conclusion

JobLens is a scalable and intelligent placement management platform that simplifies campus recruitment workflows using modern web technologies and AI-assisted systems.

The project demonstrates:

- Full-stack MERN development
- REST API design
- Authentication & authorization
- Database integration
- AI chatbot integration
- Fake job detection using AI
- Modular backend architecture
- Deployment-ready application structure
- Secure and scalable web development
