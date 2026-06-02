from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os

from common.observability.metrics import setup_metrics

app = FastAPI(title="Email Service")

# Prometheus metrics
setup_metrics(app)

class EmailPayload(BaseModel):
    to: str
    subject: str
    body: str
    html: bool = False

@app.get('/health')
async def health():
    return {"status": "ok"}

@app.post('/send')
async def send_email(payload: EmailPayload):
    # En desarrollo: soporta SendGrid si está configurado
    sendgrid_key = os.getenv('SENDGRID_API_KEY')
    if sendgrid_key:
        # Evitar dependencia pesada: solo mostrar que se enviaría
        return {"status": "queued", "provider": "sendgrid", "to": payload.to}

    smtp_host = os.getenv('SMTP_HOST')
    if smtp_host:
        return {"status": "queued", "provider": "smtp", "to": payload.to}

    raise HTTPException(status_code=503, detail='No provider configured')
