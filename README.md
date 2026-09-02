# OTCS — Organ Transplant Coordination System

A full-stack academic MVP implementing the workflows described in the OTCS SRS v1.4, use-case specifications, class model and interaction model.

> **Important:** This is an academic/demo coordination system using synthetic data. It is **not a clinical decision system**, does not establish real-world organ allocation policy, and must not be used for patient care. The matching score is a software-engineering demonstration of the documented workflow only.

## 1. What this implementation covers

The latest project documents define four core use cases:

- **UC1 — Register Organ Donor**
- **UC2 — Register Transplant Candidate**
- **UC3 — Perform Donor-Recipient Matching and Confirm Allocation**
- **UC4 — Track Organ Transport**

UC3 includes donor/candidate prerequisites and supports ranked candidates, coordinator accept/reject decisions and audit logging. UC4 starts only after a confirmed match and transport notification.

The implementation also includes the supporting modules from the project scenario:

- Secure login and role-based access
- Donor and recipient management
- Dynamic recipient waitlist
- Matching/ranking recommendation
- Coordinator dashboard
- Real-time Socket.IO notifications
- Transport status and elapsed-time tracking
- Cold-ischemia warning logic for the demo
- Document upload/download
- Post-transplant outcome recording API
- Analytics dashboard
- Compliance CSV report
- Audit log
- Administrator user management

## 2. Traceability to your submitted documents

| Project artifact | Implementation |
|---|---|
| FR1 | `backend/src/routes/donors.js`, `frontend/src/pages/Donors.jsx` |
| FR2 | `backend/src/routes/recipients.js`, `frontend/src/pages/Recipients.jsx` |
| FR3 | `backend/src/utils/matching.js`, `GET /api/matches/evaluate/:donorId` |
| FR4 | ranked `MatchAllocation` records |
| FR5 | `POST /api/matches/:id/confirm`, `POST /api/matches/:id/reject` |
| FR6 | Socket.IO notifications after confirmation |
| FR7 | `OrganTransport`, transport update API and UI |
| FR8 | recipient re-ranking in `recipients.js` |
| FR9 | document module |
| FR10 | `PostTransplantOutcome` model/API |
| FR11 | analytics + compliance report |
| FR12 | role-based navigation/dashboard |
| NFR3 | JWT authentication, role checks, demo-local storage |
| NFR7 | `AuditLog` model and audit utility |
| UC1 | Donor registration screen/API |
| UC2 | Recipient registration screen/API |
| UC3 | Matching + confirmation/rejection + transport creation |
| UC4 | Transport status, checkpoints, delivery and alerts |

Your class diagram defines `Person`, `Donor`, `Recipient`, `Hospital`, `TransplantCoordinator`, `MatchAllocation`, `OrganTransport`, `ComplianceReport`, and `INotificationService`. The implementation maps the persistent/active concepts to MongoDB models and services. The interaction sequence of review → validate → confirm → create transport → notify → track → deliver is implemented across the match and transport routes.

## 3. Technology stack

The stack follows the technology list in the project scenario:

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB
- Real-time: Socket.IO
- Authentication: JWT + bcrypt
- File handling: Multer for local demo storage
- Cloud deployment: can be added later with AWS EC2/S3

## 4. Project structure

```text
otcs-mvp/
├── README.md
├── docker-compose.yml
├── .gitignore
│
├── backend/
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── server.js
│       ├── app.js
│       ├── seed.js
│       ├── config/
│       │   └── db.js
│       ├── middleware/
│       │   ├── auth.js
│       │   └── errorHandler.js
│       ├── utils/
│       │   ├── audit.js
│       │   └── matching.js
│       ├── models/
│       │   ├── User.js
│       │   ├── Donor.js
│       │   ├── Recipient.js
│       │   ├── MatchAllocation.js
│       │   ├── OrganTransport.js
│       │   ├── Notification.js
│       │   ├── AuditLog.js
│       │   ├── Document.js
│       │   └── PostTransplantOutcome.js
│       └── routes/
│           ├── auth.js
│           ├── donors.js
│           ├── recipients.js
│           ├── matches.js
│           ├── transports.js
│           ├── notifications.js
│           ├── documents.js
│           ├── analytics.js
│           ├── outcomes.js
│           ├── reports.js
│           └── users.js
│
└── frontend/
    ├── package.json
    ├── index.html
    ├── .env.example
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── api.js
        ├── socket.js
        ├── auth.jsx
        ├── styles.css
        ├── components/
        │   ├── Layout.jsx
        │   ├── ProtectedRoute.jsx
        │   ├── StatCard.jsx
        │   └── StatusBadge.jsx
        └── pages/
            ├── Login.jsx
            ├── Dashboard.jsx
            ├── Donors.jsx
            ├── Recipients.jsx
            ├── Matches.jsx
            ├── Transports.jsx
            ├── Documents.jsx
            ├── Analytics.jsx
            ├── Reports.jsx
            └── Users.jsx
```

## 5. Prerequisites

Install:

1. Node.js 18+ (Node 20 LTS recommended)
2. npm
3. MongoDB 7+ locally **or** Docker Desktop

Check:

```bash
node -v
npm -v
docker --version
```

## 6. Start MongoDB

### Option A — Docker

From the project root:

```bash
docker compose up -d
```

MongoDB will be available at:

```text
mongodb://localhost:27017/otcs
```

### Option B — Local MongoDB

Start your local MongoDB service and use the same connection string in `.env`.

## 7. Backend setup

Open a terminal:

```bash
cd backend
npm install
```

Create `.env` from `.env.example`.

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

macOS/Linux:

```bash
cp .env.example .env
```

The default local configuration is:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/otcs
JWT_SECRET=change_this_for_local_demo
CLIENT_URL=http://localhost:5173
UPLOAD_DIR=uploads
CHECKPOINT_INTERVAL_MINUTES=30
COLD_ISCHEMIA_ALERT_PERCENT=80
```

Seed synthetic demo data:

```bash
npm run seed
```

Start backend:

```bash
npm run dev
```

API:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/api/health
```

## 8. Frontend setup

Open another terminal:

```bash
cd frontend
npm install
```

Create `.env`:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Start:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

## 9. Demo accounts

All seeded accounts use:

```text
Password: Password@123
```

| Role | Email |
|---|---|
| Administrator | admin@otcs.local |
| Hospital Staff | hospital@otcs.local |
| Transplant Coordinator | coordinator@otcs.local |
| Transport Dispatcher | transport@otcs.local |
| OPO Officer | opo@otcs.local |
| Regulatory Auditor | auditor@otcs.local |

## 10. Recommended demonstration flow

### Step 1 — Hospital

Login:

```text
hospital@otcs.local
```

Go to **Donors** and register a donor.

Then go to **Recipients** and register a transplant candidate.

The recipient waitlist is automatically re-ranked by urgency and registration time.

### Step 2 — Coordinator

Login:

```text
coordinator@otcs.local
```

Open **Matching**.

Select an available donor and click:

```text
Run compatibility evaluation
```

The system generates a ranked compatibility list.

The coordinator can:

- review score/reasons
- confirm the proposed match
- reject it with a mandatory reason

Confirming a match automatically:

1. Changes donor status to `Matched`
2. Changes recipient status to `Matched`
3. Rejects other proposed candidates for that donor
4. Creates an `OrganTransport`
5. Creates notifications
6. Writes an audit event

### Step 3 — Transport team

Login:

```text
transport@otcs.local
```

Open **Transport**.

Move the job through:

```text
Picked up
→ In transit
→ Delivered
```

The backend calculates elapsed transport time from `startedAt`.

### Step 4 — Coordinator/Auditor

Open **Analytics** for operational statistics.

Open **Compliance** to:

- review audit entries
- export the compliance CSV report

## 11. API overview

### Authentication

```text
POST /api/auth/login
GET  /api/auth/me
```

### Donors

```text
GET    /api/donors
POST   /api/donors
PATCH  /api/donors/:id
```

### Recipients

```text
GET    /api/recipients
POST   /api/recipients
PATCH  /api/recipients/:id
```

### Matching

```text
GET  /api/matches
GET  /api/matches/evaluate/:donorId
POST /api/matches/:id/confirm
POST /api/matches/:id/reject
```

### Transport

```text
GET   /api/transports
PATCH /api/transports/:id
POST  /api/transports/:id/exception
```

### Notifications

```text
GET   /api/notifications
PATCH /api/notifications/:id/read
```

### Documents

```text
GET  /api/documents
POST /api/documents/upload
GET  /api/documents/:id/download
```

### Analytics and reporting

```text
GET /api/analytics
GET /api/reports/compliance.csv
GET /api/reports/audit
```

### Outcomes

```text
GET  /api/outcomes
POST /api/outcomes
```

### Users

```text
GET   /api/users
POST  /api/users
PATCH /api/users/:id/toggle
```

## 12. Matching logic used by this academic MVP

The project requirement describes ranking using:

- blood type
- HLA compatibility
- organ size
- medical urgency

The project scenario additionally describes prioritization using waiting time and hospital distance.

The demo scoring function combines those inputs into a transparent score:

```text
HLA compatibility      35%
Medical urgency        30%
Waiting-time score     15%
Organ-size score       10%
Distance score         10%
```

This is an **engineering demonstration**, not a medically validated allocation algorithm. The application deliberately does not use protected/non-medical personal attributes for ranking.

## 13. Real-time interaction

Socket.IO is used for:

- match confirmation notifications
- critical-recipient alerts
- transport updates
- delivery/exception notifications

The frontend joins:

```text
user:<userId>
```

and receives the `notification` event.

Transport changes are broadcast through:

```text
transport-updated
```

## 14. How the implementation maps to the interaction diagram

The submitted interaction diagram describes:

```text
1. reviewMatch(matchId)
2. validateCompatibility()
3. validationResult
4. confirmAllocation()
5. create new OrganTransport(matchId)
6. notifyMatchConfirmed(matchId) <async>
7. startTracking()
8. markDelivered()
9. release transport record
10. confirmationResult
```

The web implementation represents the same logical sequence as:

```text
Coordinator opens/evaluates match
        ↓
matching.js validates compatibility
        ↓
Coordinator confirms
        ↓
MatchAllocation becomes CONFIRMED
        ↓
OrganTransport is created
        ↓
Socket.IO notifications are emitted
        ↓
Transport dispatcher updates checkpoints
        ↓
Transport becomes DELIVERED
        ↓
Audit log records the decision/status
```

## 15. Security notes

Implemented for the academic MVP:

- JWT authentication
- bcrypt password hashing
- role-based authorization middleware
- authenticated document access
- audit events for important mutations
- no ranking on protected/non-medical identity attributes

Before any real deployment, the system would require professional security review, encryption at rest/in transit, secure secrets management, immutable audit retention, proper access governance, validated healthcare interoperability, backup/failover, and regulatory/legal review.

The SRS requires HIPAA-equivalent handling and long-term immutable audit retention; this student MVP should **not** be represented as satisfying those production requirements.

## 16. Known MVP limitations

1. Local file storage is used instead of AWS S3.
2. The transport screen uses text locations rather than a live Google Maps SDK.
3. No real GPS device integration.
4. No HL7 FHIR integration.
5. No email/SMS provider; Socket.IO is used for real-time demo alerts.
6. Compliance CSV is provided instead of a signed regulatory PDF workflow.
7. Cold-ischemia thresholds are configurable demo values, not clinical guidance.
8. The matching formula is not a validated organ allocation policy.
9. No production-grade HA/failover implementation.
10. No real patient data should be entered.

## 17. Next development phase

For a stronger final-year/college demonstration, implement:

- Google Maps API or a map component with route visualization
- AWS S3 for encrypted document storage
- AWS EC2 deployment
- HTTPS
- refresh-token/session management
- email/SMS notification adapter
- FHIR integration layer
- hospital-specific tenant isolation
- immutable audit storage
- PDF compliance report
- post-transplant outcome UI
- coordinator notification drawer
- transport checkpoint timer
- test suite
- Dockerized frontend/backend deployment

## 18. Troubleshooting

### MongoDB connection error

Check that MongoDB is running:

```bash
docker ps
```

or start your local MongoDB service.

### Port 5000 already in use

Change:

```env
PORT=5001
```

Then change the frontend:

```env
VITE_API_URL=http://localhost:5001/api
VITE_SOCKET_URL=http://localhost:5001
```

### Frontend cannot call backend

Make sure both terminals are running and the frontend `.env` points to the backend.

### Seed data not appearing

Run:

```bash
cd backend
npm run seed
```

This resets demo users, donors and recipients.

### Upload fails

The backend automatically creates the `uploads/` directory. Check that the backend process has write permission.

## 19. Git workflow for the team

Recommended branches:

```text
main
├── feature/auth
├── feature/donor-recipient
├── feature/matching
├── feature/transport
├── feature/reports
└── feature/frontend
```

Suggested ownership:

- **Member 1:** Authentication + users + database
- **Member 2:** Donor/recipient + matching
- **Member 3:** Transport + notifications + frontend integration

Merge feature branches into `main` only after testing the complete UC1 → UC4 flow.

## 20. Final demo checklist

Before presentation:

- [ ] MongoDB running
- [ ] Backend running on port 5000
- [ ] Frontend running on port 5173
- [ ] `npm run seed` completed
- [ ] Login works for coordinator
- [ ] Donor registration works
- [ ] Recipient registration works
- [ ] Matching produces ranked candidates
- [ ] Rejection requires a reason
- [ ] Confirmation creates transport
- [ ] Transport status updates
- [ ] Socket notification appears
- [ ] Audit records are visible
- [ ] Compliance CSV downloads
- [ ] Screenshots of UC1, UC2, UC3 and UC4 are ready
