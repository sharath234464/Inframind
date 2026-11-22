# InfraMind Frontend / FastAPI Integration

The frontend uses Axios with `VITE_API_BASE_URL=/api`. Vite proxies `/api/*` to FastAPI at `http://127.0.0.1:8000/*` during local development.

## Canonical API contracts in this package

- Authentication: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `POST /auth/admin/register` (admin only)
- Dashboard / reports: `GET /dashboard`, `GET /operations/summary`, `GET /reports`
- Inventory and health: `GET /health`, `GET /health/{server_id}`, `POST /upload/server` (admin only)
- Golden config: `GET /golden` (admin only), `POST /upload/golden` (admin only), `POST /golden-generation/generate`, `GET /golden-generation/proposals`, `POST /golden-generation/proposals/{proposal_id}/approve`
- Analysis: `POST /comparison/run` and `POST /analysis/generate` (admin only)
- Recommendations: `GET /recommendations`, `POST /recommendations/generate` (admin only), `POST /recommendations/ai` (admin only; performs LLM generation)
- Alerts: `GET /alerts`, `GET /alerts/{alert_id}`, `POST /alerts/{alert_id}/resolve`
- What-if simulation: `POST /simulation/resource`
- Chatbot: `POST /chatbot/chat`
- Requests: `POST /requests`, `GET /requests/mine`, `GET /requests/admin`, `POST /requests/{request_id}/decision`
- Scheduled jobs: `/jobs` and `/jobs/{job_id}` use the backend's `cron_expression`, `description`, `last_run_at`, and `next_run_at` fields.
- Audit / decision memory / remediation / analytics: use the corresponding `/audit`, `/decision-memory`, `/remediation`, and `/analytics` routers.

## Important behavior

- Reports endpoint returns a single summary object, not a list of report documents. The Reports page renders that object and exports it as CSV.
- AI recommendation generation is a POST because it writes to MongoDB. It is admin-only.
- Existing golden configurations are read from `GET /golden`; loading this page does not upload or replace them.
- Existing inventory and approved golden configurations are never automatically re-uploaded on app startup.
- An analysis run is explicit. If no servers can be compared to approved golden baselines, the backend returns an error and preserves the previous analysis results.
- The MongoDB startup check only pings the configured database; it does not clear collections or add unique indexes.
