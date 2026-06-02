from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from profiles.router import router as profiles_router
from common.observability.metrics import setup_metrics

app = FastAPI(
    title="Paseos Felices - User Profile Service",
    version="0.1.0",
    description="Microservicio para perfiles extendidos de usuarios",
)

# Prometheus metrics
setup_metrics(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(profiles_router)

@app.get("/")
async def root():
    return {"message": "User Profile Service", "port": settings.PORT}

@app.get("/health")
async def health():
    return {"status": "ok", "service": "profile"}
