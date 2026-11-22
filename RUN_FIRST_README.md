# Enterprise Infrastructure Intelligence & Optimization Agent

This is the consolidated Windows source package. Open the `enterprise-ai-agent` folder in VS Code.

## 1. Requirements

- Windows 10/11
- Python 3.11 (with the Windows `py` launcher)
- Node.js 22 LTS and npm
- A reachable MongoDB instance (local or Atlas)
- An OpenAI API key for the AI Assistant, AI Golden Configuration explanations and LLM recommendations

## 2. First-time setup (run once)

1. Extract the ZIP.
2. Open the extracted `enterprise-ai-agent` folder in VS Code.
3. Double-click `SETUP_WINDOWS.bat` (or run it from PowerShell).
4. Open the generated `.env` file and configure:
   - `MONGODB_URL`: your MongoDB connection string
   - `DATABASE_NAME`: your existing project database name (do not change it if it already contains your project data)
   - `JWT_SECRET_KEY`: a long random secret (32+ characters)
   - `OPENAI_API_KEY`: your own OpenAI API key
   - `MODEL_NAME`: normally `gpt-4.1-mini`
5. Save `.env`.

The setup script creates `.venv` and installs backend requirements, then runs `npm ci` inside `frontend`. Do not run `npm audit fix` as part of setup; it can change locked package versions.

## 3. Create the first Admin account (once)

If you do not already have an Admin account in the configured database, run `CREATE_ADMIN.bat` and follow the prompts. Public registration creates a USER account only. The login role selector does not grant privileges; the backend account role is authoritative.

Register normal User accounts from the frontend Register page.

## 4. Start both applications

Double-click `RUN_PROJECT.bat`. It opens two terminal windows:

- FastAPI backend: http://127.0.0.1:8000
- Swagger diagnostics: http://127.0.0.1:8000/docs
- React frontend: normally http://127.0.0.1:5173 (use the exact Vite URL shown in its terminal)

Keep both terminal windows open. The backend starts first and verifies MongoDB connectivity. If MongoDB is unreachable, the backend window shows the startup error. Do not use Swagger for normal project operations; use the frontend.

## 5. Recommended first demo workflow (approval path)

1. Sign in as USER.
2. Open Servers and submit `data/server_inventory_1000.xlsx` for approval.
3. Sign out, sign in as ADMIN, open Requests & Approvals, and approve the inventory upload.
4. Sign out, sign in as USER, open Golden Configuration, and generate proposals. Start with minimum healthy servers = 5 and no instance type selected.
5. Sign out, sign in as ADMIN, open Golden Configuration, and approve the proposals you want to activate.
6. As ADMIN, open Analysis and click Run Analysis. This runs the inventory-to-baseline comparison followed by the AI workflow.
7. Refresh Dashboard, Servers, Analysis, Alerts, Health, AI Recommendations, Remediation, Analytics and Reports.
8. As USER, open AI Assistant, Scheduled Jobs, and Messages to test user functions. As ADMIN, open Messages and reply to the user's report.

The sample inventory has 1,000 rows across ten instance types. All active Golden Configuration records must use the same `instance_type` strings as the inventory to be included in the comparison.

## 6. Features and permissions

- USER: register/sign in, submit inventory and infrastructure change requests, view shared analysis/health/alerts/recommendations/reports, generate own Golden Configuration proposals, create/manage own scheduled jobs, use AI Assistant, and create/reply to own User–Admin conversations.
- ADMIN: all infrastructure views, approve/reject requests, review/approve/reject Golden Configuration proposals, run global comparison and AI analysis, manage all jobs, use AI Assistant, see/reply to all User–Admin conversations, audit and reports.
- Custom jobs run only predefined safe infrastructure-summary tasks. They do not run arbitrary shell commands or Python code.
- User–Admin Messages are direct application messages, distinct from the AI Assistant.

## 7. Important data notes

- The application does not drop or recreate MongoDB collections at startup.
- Use your existing `DATABASE_NAME` to keep existing project data.
- A dashboard can legitimately show zero until approved inventory, an active Golden Configuration, and analysis results exist.
- If you have already populated the database, do not upload the same `server_id` values a second time. The inventory service rejects duplicates.
- Admin's direct Golden Configuration Excel import is a direct baseline import. For the AI approval demo, use USER proposal generation and ADMIN approval instead.
- AI features require a valid OpenAI key with model access. Comparison itself is deterministic and can run without an OpenAI key.
- The 1,000-row AI graph invokes an LLM recommendation for each eligible server. This can take time and consume API quota. Run the first end-to-end test with one instance type (or a smaller test inventory) before processing all 1,000 servers.

## 8. Optional quick demo-data import

For a fast dashboard/data demonstration only, you may run `LOAD_DEMO_DATA.bat` after configuring `.env` and completing first-time setup. It inserts only inventory rows and Golden Configuration rows whose `server_id` / `instance_type` do not already exist. It does not delete or overwrite existing records.

**Important:** this shortcut inserts the included Golden Configuration workbook directly into the active baseline collection. It bypasses the User-generated AI proposal and Admin approval workflow. Do not use this shortcut when demonstrating that approval workflow. For the approval demonstration, follow Phase 3 above instead.

## 9. Troubleshooting

- Backend MongoDB error: check `MONGODB_URL`, network access/IP allowlist and database credentials in `.env`.
- AI error: check `OPENAI_API_KEY`, model name and API quota.
- Login Admin role mismatch: create an Admin account using `CREATE_ADMIN.bat`; do not use public registration to create Admin.
- Frontend API errors: keep backend running and check the backend terminal plus browser DevTools > Network > Fetch/XHR.
- Missing outputs: ensure inventory approval completed, Golden Configuration is active, then run Admin > Analysis > Run Analysis.
- Python missing package: rerun `SETUP_WINDOWS.bat`.
- Frontend dependency error: from `frontend`, run `npm ci` once, then `npm run dev`.

## Validation statement

This package includes source-level changes, Python syntax checks and TypeScript checks where possible. A true end-to-end run against your personal MongoDB and OpenAI credentials must be performed on your machine; credentials and external services are intentionally not embedded in this ZIP.
