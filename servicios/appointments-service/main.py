from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from core.config import settings
from appointments.router import router as appointments_router
from appointments.database import engine, Base
from invoices.router import router as invoices_router
from common.observability.metrics import setup_metrics

# Import models so Base knows about them
from appointments import models  # noqa: F401
from invoices import models as invoice_models  # noqa: F401

app = FastAPI(
    title="Paseos Felices - Appointments Service",
    version="0.1.0",
    description="Microservicio para gestión de citas / reservas",
)

# Create tables on startup (for development)
Base.metadata.create_all(bind=engine)

# CORS MIDDLEWARE - Debe agregarse PRIMERO antes de otros middlewares
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

# Manejador global de excepciones para evitar errores sin CORS headers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    print(f"Error no manejado en appointments-service: {exc}")
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": "Error interno del servidor", "error": str(exc)}
    )

app.include_router(appointments_router)
app.include_router(invoices_router)

@app.get("/")
async def root():
    return {"message": "Appointments Service - Paseos Felices", "port": settings.PORT}

@app.get("/health")
async def health():
    return {"status": "ok", "service": "appointments"}
