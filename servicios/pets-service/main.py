from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from pets.router import router as pets_router
from pets.database import engine, Base
from common.observability.metrics import setup_metrics

# Import models so Base knows about them
from pets import models  # noqa: F401

app = FastAPI(
    title="Paseos Felices - Pets Service",
    version="0.1.0",
    description="Microservicio para gestión de mascotas de los clientes",
)

# Create tables on startup (for development)
Base.metadata.create_all(bind=engine)

# Prometheus metrics
setup_metrics(app)

# CORS
app.add_middleware(
    CORSMiddleware,
    # Restrict CORS to the development frontend origins and allow credentials.
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "https://paseos-felices-v5.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(pets_router)

@app.get("/")
async def root():
    return {"message": "Pets Service - Paseos Felices", "port": settings.PORT}

@app.get("/health")
async def health():
    return {"status": "ok", "service": "pets"}
