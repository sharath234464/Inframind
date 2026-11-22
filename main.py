from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.app_router import app_router
from app.db_handler.mongodb import client, close_database, initialize_database
from app.service.job_scheduler import start_scheduler, stop_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup fails clearly if MongoDB is unreachable. Existing collections and
    # documents are left untouched; this only verifies the connection.
    await initialize_database()
    await start_scheduler()
    try:
        yield
    finally:
        await stop_scheduler()
        await close_database()


app = FastAPI(
    title="Enterprise AI Infrastructure Optimization Agent",
    version="1.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(app_router)


@app.get("/")
async def home():
    return {"message": "Welcome to Enterprise AI Infrastructure Optimization Agent"}


@app.get("/system/health")
async def system_health():
    try:
        await client.admin.command("ping")
    except Exception as exc:
        raise HTTPException(status_code=503, detail="MongoDB is not reachable") from exc
    return {"status": "ok", "database": "connected", "service": "enterprise-ai-infrastructure-agent"}
