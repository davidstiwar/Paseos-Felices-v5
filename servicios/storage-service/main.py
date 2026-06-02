from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import uuid
from pathlib import Path

from common.observability.metrics import setup_metrics

# Local storage configuration
STORAGE_DIR = os.getenv('STORAGE_DIR', '/tmp/paseos-storage')
Path(STORAGE_DIR).mkdir(parents=True, exist_ok=True)

app = FastAPI(title='Storage Service')

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Prometheus metrics
setup_metrics(app)

@app.get('/health')
async def health():
    return {"status": "ok"}

@app.post('/upload')
async def upload(file: UploadFile = File(...)):
    try:
        # Generate unique filename
        file_extension = Path(file.filename).suffix
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        
        # Save to local storage
        file_path = Path(STORAGE_DIR) / unique_filename
        content = await file.read()
        with open(file_path, 'wb') as f:
            f.write(content)
        
        # Return file path (in production, map to public URL)
        # Use absolute URL with correct port
        public_url = f"http://localhost:3011/uploads/{unique_filename}"
        
        return {
            "status": "stored",
            "filename": unique_filename,
            "url": public_url
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
