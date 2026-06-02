from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from reviews.router import router as reviews_router
from reviews.database import engine, Base
from common.observability.metrics import setup_metrics

# Import models so Base knows about them
from reviews import models  # noqa: F401

app = FastAPI(
    title="Paseos Felices - Reviews Service",
    version="0.1.0",
    description="Microservicio para reseñas y calificaciones de groomers",
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

app.include_router(reviews_router)

@app.get("/")
async def root():
    return {"message": "Reviews Service", "port": settings.PORT}

@app.get("/health")
async def health():
    return {"status": "ok", "service": "reviews"}
