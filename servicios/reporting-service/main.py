from fastapi import FastAPI
from datetime import date

from common.observability.metrics import setup_metrics

app = FastAPI(title='Reporting Service')

# Prometheus metrics (standard /metrics)
setup_metrics(app)

# Datos de ejemplo en memoria; en producción leer de DB o data warehouse
events = []

@app.get('/health')
async def health():
    return {"status": "ok"}

@app.get('/report')
async def report(from_date: str = None, to_date: str = None):
    return {"from": from_date, "to": to_date, "total_events": len(events)}
