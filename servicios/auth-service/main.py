from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from core.config import settings
from auth.router import router as auth_router
from auth.database import engine, Base
# from common.observability.metrics import setup_metrics  # Commented for Railway deployment

# Import models so Base knows about them
from auth import models  # noqa: F401

app = FastAPI(
    title="Paseos Felices - Auth Service",
    version="0.1.0",
    description="Microservicio de Autenticación (Login / Register)",
)

# Create tables on startup (for development)
Base.metadata.create_all(bind=engine)

# CORS MIDDLEWARE - Debe agregarse PRIMERO antes de otros middlewares
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "https://paseos-felices-v5.vercel.app",
        "*ngrok-free.app",
        "*ngrok.io"
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Prometheus metrics
setup_metrics(app)

# Manejador para errores de validación de Pydantic
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for error in exc.errors():
        errors.append({
            "field": ".".join(str(x) for x in error["loc"][1:]),
            "message": error["msg"],
            "type": error["type"]
        })
    return JSONResponse(
        status_code=422,
        content={"detail": "Validation error", "errors": errors},
    )

# Manejador global de excepciones para evitar 500 sin CORS headers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    print(f"Error no manejado: {exc}")
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": "Error interno del servidor", "error": str(exc)}
    )

# Routers
app.include_router(auth_router)

@app.get("/")
async def root():
    return {"message": "Auth Service - Paseos Felices", "port": settings.PORT}

@app.get("/health")
async def health():
    return {"status": "ok", "service": "auth"}