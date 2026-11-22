# Custom Scheduled Jobs

Both USER and ADMIN accounts can create, pause/resume, and delete scheduled jobs.

- USER accounts can see and manage only jobs they created.
- ADMIN accounts can see and manage all scheduled jobs.
- Schedules use standard five-field cron expressions and are interpreted in UTC.
- The job name, description, and schedule are customizable; the task must be one of the supported, safe infrastructure summaries in the UI.
- The scheduler stores definitions in MongoDB `scheduled_jobs` and execution history in `job_execution_results`.
- Enabled jobs are restored from MongoDB when the backend starts.
- This feature intentionally does not execute arbitrary Python, shell commands, or user-provided code.

Examples:
- `0 9 * * *` — daily at 09:00 UTC
- `*/15 * * * *` — every 15 minutes
- `0 8 * * 1` — every Monday at 08:00 UTC

Run the backend from the project root after configuring `.env`:
`python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000`

Run the frontend:
`cd frontend`
`npm install`
`npm run dev`
