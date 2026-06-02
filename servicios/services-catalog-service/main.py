import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

from core.config import settings
from catalog.router import router as catalog_router
# Temporarily disable database imports for debugging
# from catalog.schemas import ServiceCategory
from catalog.database import engine, Base
# from catalog.models import Service
from common.observability.metrics import setup_metrics

app = FastAPI(
    title="Paseos Felices - Services Catalog Service",
    version="0.1.0",
    description="Microservicio para el catálogo de servicios (Paseos, Grooming, etc.)",
)

# CORS middleware - must be added BEFORE routers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Temporarily disable Prometheus metrics for debugging
# setup_metrics(app)

# Temporarily disable table creation for debugging
# @app.on_event("startup")
# async def startup():
#     print(f"🔗 Using database URL: {settings.DATABASE_URL}")
#     Base.metadata.create_all(bind=engine)
#     print("✅ Database tables created for catalog service")

app.include_router(catalog_router)

@app.get("/")
async def root():
    return {"message": "Services Catalog Service", "port": settings.PORT}

@app.get("/health")
async def health():
    return {"status": "ok", "service": "catalog"}
