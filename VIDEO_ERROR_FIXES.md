# Video error fixes

## 1. Alerts API returned HTTP 500

Cause: `/alerts` returned MongoDB documents containing BSON `ObjectId` values. FastAPI's default encoder attempted to treat an `ObjectId` like an iterable and raised `TypeError: 'ObjectId' object is not iterable`.

Fix: `app/utils/mongo_serialization.py` recursively converts BSON `ObjectId` values to strings and dates to ISO-8601 strings. `app/service/alert_service.py` uses it for alert responses. This changes only API response values; it does not mutate or delete MongoDB records.

## 2. Server health response could fail during serialization

Cause: health-score repository reads returned MongoDB documents with raw `_id` values.

Fix: `app/repository/health_repository.py` serializes returned documents. The existing health service only calculates missing derived health-score records; it does not clear inventory.

## 3. What-If Simulation failed with a generic message

Cause: the UI example used `SRV-001`, but the included sample inventory IDs start at `SRV-10001`. The UI also hid useful API error details.

Fix: `frontend/src/pages/user/Simulation.tsx` loads existing server IDs from the health endpoint, offers them as suggestions, defaults to the first existing ID when available, and displays the backend's actual error message. Simulation remains read-only and does not apply resource changes to the real server.

## Verify on Windows

Backend terminal:

```powershell
venv\Scripts\activate
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Frontend terminal:

```powershell
cd frontend
npm install
npm run build
npm run dev
```

After login, open Alerts and verify it loads. Open What-If Simulation and choose an existing server ID such as `SRV-10001` only if that ID exists in your connected database. If the database differs from the sample spreadsheet, use one of the IDs suggested by the UI.
