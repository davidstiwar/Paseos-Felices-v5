from fastapi import FastAPI
import os

from common.observability.metrics import setup_metrics

app = FastAPI(title='Search Service')

# Prometheus metrics
setup_metrics(app)

# Modo simple: índice en memoria
index = []

@app.get('/health')
async def health():
    return {"status": "ok"}

@app.post('/index')
async def index_doc(doc: dict):
    index.append(doc)
    return {"status": "indexed", "id": len(index)-1}

@app.get('/search')
async def search(q: str):
    # búsqueda simple por substring en 'name' o 'description'
    results = [d for d in index if q.lower() in (d.get('name','')+d.get('description','')).lower()]
    return {"total": len(results), "hits": results}
