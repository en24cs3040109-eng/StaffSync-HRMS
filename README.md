# StaffSync — Modern Human Resource Management Solution

MERN stack HRM app with three roles — **HR**, **Manager** and **Employee** — covering employee records, leave, attendance, announcements, training and notifications.

## Setup

Needs Node.js 18+ and MongoDB (local, or a MongoDB Atlas connection string).

1. Open the `staffsync` folder in VS Code. It contains `client` (React frontend) and `server` (Node.js + Express backend).
2. Create the environment files: copy `server/.env.example` to `server/.env` and `client/.env.example` to `client/.env`. Set `MONGO_URI` and `JWT_SECRET` in `server/.env`.
3. Install everything and load the demo data:

```bash
npm run install-all   # installs root, server and client packages
npm run seed          # optional: demo data (wipes the database first)
npm run dev           # starts the API and the React app together
```

- React app: http://localhost:5173
- API: http://localhost:5000/api/health

To run them separately instead: `cd server && npm run dev` in one terminal and `cd client && npm run dev` in another.

## Output

- Screenshots of every screen: [`docs/screenshots`](docs/screenshots)
- Demo walkthrough video (2.5 min): [`docs/staffsync-demo.mp4`](docs/staffsync-demo.mp4)

## Demo logins (after `npm run seed`)

All passwords: `password123`

| Role | Email |
| --- | --- |
| HR | hr@staffsync.com |
| Manager (Engineering) | manager.eng@staffsync.com |
| Manager (Sales) | manager.sales@staffsync.com |
| Employee | amit@staffsync.com, sneha@staffsync.com, rohan@staffsync.com, kavya@staffsync.com, vikram@staffsync.com |

## Backend structure (MVC)

```
server/
├── server.js              entry point: middleware, routes, DB connection
├── config/db.js           MongoDB connection (Mongoose)
├── models/                User, Employee, Department, Leave, Attendance, Announcement, Training, Notification
├── controllers/           business logic, one file per module
├── routes/                API endpoints mapped to controllers
├── middleware/            authMiddleware (JWT + roles), uploadMiddleware (multer), errorMiddleware
├── utils/                 generateToken, notify, helpers, seed
└── uploads/               uploaded files (served at /uploads)
```

## Frontend structure

```
client/src/
├── App.jsx                 routes: /, /login, /register (HR only), /employee, /hr, /manager
├── App.css                 global styles and design tokens
├── main.jsx                entry point: router, auth provider, toasts
├── api/axios.js            API client (adds the token, handles expired sessions)
├── context/AuthContext.jsx logged-in user and profile
├── routes/ProtectedRoute.jsx  blocks pages by role
├── components/
│   ├── Home.jsx
│   ├── auth/               Login, Register
│   ├── employee/           Attendance, LeaveApply, LeaveList, Announcements, MyTrainings
│   ├── hr/                 EmployeeCRUD, EmployeeForm, LeaveApplications, AttendanceSummary, AnnouncementsManager, Departments
│   ├── manager/            LeaveApplications, TrainingManagement, TeamMembers
│   └── common/             layout, notifications, today panel, profile, shared tables
└── pages/                  EmployeeDashboard, HrDashboard, ManagerDashboard
```

## API

All routes are under `/api`; everything except login needs `Authorization: Bearer <token>`.
Import `server/StaffSync.postman_collection.json` into Postman to try them.

| Module | Endpoints |
| --- | --- |
| Auth | `POST /auth/login`, `GET /auth/me`, `PUT /auth/change-password` |
| Employees | `GET/POST /employees`, `GET /employees/managers`, `GET/PUT/DELETE /employees/:id`, `POST /employees/:id/documents` |
| Departments | `GET/POST /departments`, `PUT/DELETE /departments/:id` |
| Leaves | `POST /leaves`, `GET /leaves/my`, `GET /leaves`, `PATCH /leaves/:id/status`, `PATCH /leaves/:id/cancel`, `GET /leaves/report` |
| Attendance | `POST /attendance/check-in`, `POST /attendance/check-out`, `GET /attendance/today`, `GET /attendance/my`, `GET /attendance`, `POST /attendance/mark`, `PUT /attendance/:id`, `GET /attendance/report` |
| Announcements | `GET/POST /announcements`, `PUT/DELETE /announcements/:id` |
| Trainings | `GET/POST /trainings`, `GET/PUT/DELETE /trainings/:id`, `POST /trainings/:id/assign`, `DELETE /trainings/:id/participants/:employeeId`, `PATCH /trainings/:id/progress` |
| Notifications | `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all` |
| Dashboard | `GET /dashboard/stats` (shape depends on role) |

## Roles

- **HR** — manages employees and departments, sees all leave and attendance, posts announcements, runs reports.
- **Manager** — approves or rejects leave for their team, views team attendance, creates and assigns training, posts announcements.
- **Employee** — applies for leave, checks in and out, updates their own profile, views announcements and assigned training.
