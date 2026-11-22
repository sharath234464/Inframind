# End-to-end test checklist

## First-time setup and safe startup
- [ ] `.env` points to the existing MongoDB URL and database name.
- [ ] A strong JWT secret is configured and `OPENAI_API_KEY` is set for AI features.
- [ ] MongoDB is reachable before starting FastAPI.
- [ ] `SETUP_WINDOWS.bat` completed once (Python environment + backend packages + frontend `npm ci`).
- [ ] `RUN_PROJECT.bat` opens backend and frontend terminals.
- [ ] `GET /system/health` reports `status: ok` and `database: connected`.
- [ ] Frontend uses the Vite `/api` proxy to reach FastAPI on port 8000.

## Authentication
- [ ] Create the first Admin once with `CREATE_ADMIN.bat` if no Admin exists.
- [ ] Register a standard User from the frontend.
- [ ] Verify Admin and User login selectors are clickable.
- [ ] Verify the selected role must match the role returned by `/auth/me`.
- [ ] Verify a USER cannot access Admin-only routes/actions.
- [ ] Sign out before switching accounts.

## Inventory and Golden Configuration approval
- [ ] As USER, upload a genuinely new inventory workbook.
- [ ] Verify a pending `INVENTORY_UPLOAD` request is created; inventory is not changed yet.
- [ ] As ADMIN, approve the inventory request.
- [ ] Verify server records appear in Servers and the `server_inventory` collection.
- [ ] As USER, generate AI-assisted Golden Configuration proposals.
- [ ] Verify proposals are `PENDING_APPROVAL` and not in the active baseline collection.
- [ ] As ADMIN, review and approve/reject proposals.
- [ ] Verify only approved proposals update `golden_configuration`.

## Analysis and outputs
- [ ] As ADMIN, click Analysis -> Run Analysis.
- [ ] Verify the comparison count is greater than zero and based on exact `instance_type` matches.
- [ ] Verify allocation, utilization and compliance states appear.
- [ ] Verify the AI stage displays completed/skipped/failed counts.
- [ ] Verify Health, Alerts, Recommendations, Remediation, Analytics, Dashboard and Reports load persisted results.
- [ ] As USER, verify those result screens are viewable but protected Admin actions are not shown.

## AI Assistant, jobs and messaging
- [ ] Ask the AI Assistant a question requiring actual infrastructure data.
- [ ] Create a scheduled job as USER; verify the USER can manage only their own job.
- [ ] Create a scheduled job as ADMIN; verify ADMIN can view/manage all jobs.
- [ ] Pause, resume, delete and inspect job execution history.
- [ ] As USER, create a User–Admin Message / Infrastructure Report.
- [ ] As ADMIN, refresh Messages, open the conversation and reply.
- [ ] As USER, reopen Messages and verify the Admin reply appears.
- [ ] Verify User and Admin AI Assistant routes remain separate from direct Messages.

## Non-destructive data checks
- [ ] Preserve the existing MongoDB database name and connection URL.
- [ ] Do not re-upload duplicate `server_id` values.
- [ ] Do not run `LOAD_DEMO_DATA.bat` when demonstrating User-upload -> Admin approval -> AI Golden proposal -> Admin approval; that optional shortcut directly seeds active sample baselines.
