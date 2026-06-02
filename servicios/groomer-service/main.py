import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from core.config import settings
from groomers.router import router as groomers_router
from groomers.database import engine, Base
from common.observability.metrics import setup_metrics

# Import models so Base knows about them
from groomers import models  # noqa: F401

app = FastAPI(
    title="Paseos Felices - Groomer Service",
    version="0.1.0",
    description="Microservicio para perfiles de groomers y paseadores",
)

# CORS middleware - must be added BEFORE routers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Prometheus metrics
setup_metrics(app)

# Create tables on startup (for development)
Base.metadata.create_all(bind=engine)

app.include_router(groomers_router)

@app.get("/")
async def root():
    return {"message": "Groomer Service", "port": settings.PORT}

@app.get("/health")
async def health():
    return {"status": "ok", "service": "groomer"}
