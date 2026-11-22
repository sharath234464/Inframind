# InfraMind — Enterprise Infrastructure Intelligence & Optimization Agent

This package keeps the existing FastAPI backend structure and React/Vite frontend. It connects to the MongoDB database configured in `.env`; it does **not** drop or recreate existing collections.

## Before starting — preserve your existing data

1. Open the `.env` from your OLD working project and copy its `MONGODB_URL` and `DATABASE_NAME` values into the new project's `.env`.
2. If you use MongoDB Compass, verify the new project's values point to the same connection and database you already see in Compass.
3. Do **not** delete collections, run database reset commands, or upload the same inventory/Golden Configuration Excel files again. The upload endpoints reject existing IDs/instance types.
4. Simply opening Dashboard, Servers, Reports, Alerts, and Golden Configuration reads existing records. The Health page creates only missing derived health-score records. It does not delete inventory, golden configurations, or analysis results.
5. `Run Analysis` is an intentional recalculation action. It replaces `analysis_results` only after a non-empty comparison can be computed. If no inventory records match an approved golden configuration, the API returns an error and leaves the previous analysis results unchanged.

## Requirements

- Windows 10/11
- Python 3.11
- Node.js 22 LTS recommended
- MongoDB Community Server running locally, or an existing MongoDB Atlas connection
- An OpenAI API key for LLM-powered analysis/chatbot features

## 1. Configure the backend

In the project root, copy `.env.example` to `.env` and fill in your values. For an existing database, keep the exact old MongoDB URL and database name. Never commit `.env` to Git.

```powershell
py -3.11 -m venv venv
venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

If MongoDB is installed as a Windows service:

```powershell
net start MongoDB
```

If it is already running, continue without restarting it.

## 2. Start FastAPI — Terminal 1

Run from the project root (`enterprise-ai-agent`):

```powershell
venv\Scripts\activate
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Verify:

- App: http://127.0.0.1:8000/
- MongoDB-aware health check: http://127.0.0.1:8000/system/health
- Swagger API docs: http://127.0.0.1:8000/docs

The backend pings MongoDB on startup. It does not clear collections or create unique indexes that could fail against existing data.

## 3. Start React — Terminal 2

```powershell
cd frontend
npm install
npm run dev
```

Open the URL Vite prints, normally http://localhost:5173.

## 4. Authentication

- Public `/register` creates a standard `USER` account only.
- Use an existing admin account if one already exists in the `users` collection.
- Only if no admin exists, create one once from the project root:

```powershell
venv\Scripts\activate
python scripts\create_admin.py
```

The script prompts for credentials and stores a bcrypt password hash. It does not reset or replace existing users. If the email already exists, use that account instead of creating a duplicate.

## 5. Test the existing data before uploading anything

1. Start MongoDB, FastAPI, and the frontend.
2. Log in with an existing account.
3. Open Dashboard and Servers; they should read existing analysis and inventory data.
4. Open Golden Configuration as admin; the Active Approved Baselines table reads the existing `golden_configuration` collection.
5. Open Reports; the page shows the actual report summary returned by `GET /reports` and can export it to CSV.
6. Open Health; missing derived health scores are calculated from saved inventory records.
7. Open Alerts, Recommendations, Decision Memory, Requests, Remediation, Simulation, and Audit Logs to test the corresponding API-backed pages.
8. Confirm writes by refreshing MongoDB Compass. Never upload an existing inventory or baseline spreadsheet merely to test the connection.

## 6. Useful API routes

- `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- `GET /dashboard`, `GET /reports`, `GET /health`
- `GET /golden`, `GET /alerts`, `GET /recommendations`
- `POST /upload/server` and `POST /upload/golden` (admin only; use only for genuinely new data)
- `POST /comparison/run` and `POST /analysis/generate` (admin only; explicitly recalculates analysis)
- `POST /simulation/resource`
- `POST /recommendations/ai` (admin only; intentionally regenerates AI recommendations)
- `POST /chatbot/chat`

## Troubleshooting

- **MongoDB connection error:** compare `MONGODB_URL` and `DATABASE_NAME` with the old working project's `.env`; ensure the MongoDB service/Atlas is reachable.
- **401:** log in again; the frontend uses the JWT and fetches the current account profile from MongoDB.
- **403:** the action is admin-only; sign in using the existing admin account.
- **404 on a page:** check the route in Swagger (`/docs`) and make sure both the updated backend and frontend are running from this extracted project, not the old folder.
- **Frontend dependency/native Vite error:** remove `frontend/node_modules` and run `npm install` again on your own Windows machine. Do not copy Linux `node_modules` into Windows.
- **OpenAI feature fails:** verify `OPENAI_API_KEY`; basic MongoDB-backed pages should still use saved data.


## User requests and administrator approval

- A normal USER can submit a server inventory file from the Servers page. The file is validated and stored inside an `infrastructure_requests` document as `PENDING`; it is **not** inserted into `server_inventory` until an ADMIN approves it.
- From the AI Assistant, users can request add/update/delete server operations using a server ID and the requested values. The assistant creates a pending request rather than mutating MongoDB directly.
- Users can request Golden Configuration generation from inventory by specifying the instance type. On approval, the backend generates a proposal from eligible healthy inventory and activates it through the existing Golden Generation approval service.
- ADMINs review requests at `/admin/requests`; approve/reject controls are available in the Requests & Approvals table. Rejected requests never execute. Successful approvals become `COMPLETED`; execution errors are marked `FAILED`.
- Users see only their own submissions at `/user/requests`.
