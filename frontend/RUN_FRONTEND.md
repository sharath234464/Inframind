# Run the Frontend

Your FastAPI backend is already the backend. Do not copy a backend into this folder.

## 1. Start the existing backend

From the backend project root:

```powershell
uvicorn main:app --reload
```

It should be available at:

```text
http://127.0.0.1:8000
```

## 2. Start this frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal, normally:

```text
http://localhost:5173
```

## 3. Important

The frontend uses a Vite `/api` proxy during local development:

```text
Browser -> /api/... -> Vite -> http://127.0.0.1:8000/...
```

This means you do not need to add CORS just to run the college demo locally.

## Golden Configuration

Go to:

```text
Admin -> Golden Configuration
```

Then:

1. Select the Golden Configuration Excel file.
2. Click **Upload Golden Configuration**.
3. Wait for the backend upload response.
4. Click **Generate AI Suggestions** when inventory is already available.
5. Review the generated configuration.
6. Click **Approve Configuration** for a pending suggestion.
