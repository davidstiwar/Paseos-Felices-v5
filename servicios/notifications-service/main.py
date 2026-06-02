from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from notifications.router import router as notifications_router
from common.observability.metrics import setup_metrics
from notifications.database import engine, Base

# Import models so Base knows about them
from notifications import models  # noqa: F401

app = FastAPI(
    title="Paseos Felices - Notifications Service",
    version="0.1.0",
    description="Microservicio para envío y gestión de notificaciones",
)

# Create tables on startup (for development)
Base.metadata.create_all(bind=engine)

# Prometheus metrics
setup_metrics(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(notifications_router)

@app.get("/")
async def root():
    return {"message": "Notifications Service", "port": settings.PORT}

@app.get("/health")
async def health():
    return {"status": "ok", "service": "notifications"}
