# Enterprise Infrastructure Intelligence and Optimization Agent

## Included project
This archive contains the complete source tree supplied for the project, with the schema import compatibility package included. It preserves the existing FastAPI + MongoDB backend and React + Vite frontend. It does not contain a database dump, virtual environment, `node_modules`, or private credentials.

## Feature areas present in the source
- Authentication, JWT session handling, and USER/ADMIN role protection
- Server inventory upload and management
- Golden Configuration upload, generation, and approval workflow
- Inventory-to-baseline comparison and nine allocation/utilization states
- Analysis workflow and compliance evaluation
- Infrastructure health, alerts, dashboards, analytics, and reports
- AI Assistant / chatbot and AI recommendations
- What-If resource simulation and remediation views
- User change requests with Admin approval/rejection
- Decision memory and audit logs
- Custom scheduled infrastructure summary jobs for USER and ADMIN, with ownership enforcement and execution history

The source includes these feature modules. Actual operation depends on valid MongoDB data, environment configuration, and (for LLM-backed actions) an OpenAI API key.

## Windows setup

Prerequisites:
- Python 3.11
- Node.js 22 LTS (npm included)
- MongoDB running locally or a reachable MongoDB Atlas cluster

### 1. Configure environment
From this folder (the folder containing `main.py`):

```powershell
Copy-Item .env.example .env
notepad .env
```

Set `MONGODB_URL`, `DATABASE_NAME`, and a strong `JWT_SECRET_KEY`. Add `OPENAI_API_KEY` for LLM-powered features. To use an existing database, use its exact original MongoDB URL and database name. Never share or commit `.env`.

### 2. Install and start backend — Terminal 1

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Backend: http://127.0.0.1:8000
Swagger: http://127.0.0.1:8000/docs
MongoDB health check: http://127.0.0.1:8000/system/health

### 3. Install and start frontend — Terminal 2

```powershell
cd frontend
npm ci
npm run dev
```

Open the Vite URL printed in the terminal (normally http://localhost:5173).

For a production frontend check:

```powershell
npm run build
```

### 4. Admin account
Public registration creates a USER account. Use the existing ADMIN account if available. If the database has no admin account, run this once from the project root in another backend terminal:

```powershell
.\.venv\Scripts\Activate.ps1
python scripts/create_admin.py
```

Do not create a duplicate administrator if one already exists.

## Data safety
- The application connects to the database named in `.env`; it is not a database migration/reset tool.
- Do not delete collections or re-upload existing inventory/Golden Configuration spreadsheets to test the app.
- Use the same database URL and database name if you need your existing records.
- Test destructive actions only with disposable server records.
- User change requests should remain pending until an Admin approves them.
- Scheduled jobs are restricted to predefined infrastructure summary task types; arbitrary shell/Python execution is not supported.

## Important verification boundary
Source-level Python compilation and frontend TypeScript project checking were performed on the supplied source. A complete live end-to-end test against your MongoDB instance and OpenAI account cannot be certified from this archive alone because those services and credentials are specific to your machine. Run `/system/health`, then follow `TEST_CHECKLIST.md` to verify each feature with your own database before relying on it for a demo.
