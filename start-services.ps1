# Script simplificado para iniciar servicios sin Docker ni nginx
# Requiere: MySQL local instalado y corriendo

Write-Host "Iniciando Paseos Felices (versión simplificada)..." -ForegroundColor Green

# Configuración de variables de entorno (XAMPP MySQL)
$env:DATABASE_URL = "mysql+pymysql://root:@localhost:3306/paseos_auth"
$env:FRONTEND_URL = "http://localhost:3000"
$env:SECRET_KEY = "tu_super_secreto_aqui_cambiar_en_produccion"
$env:ENVIRONMENT = "development"
$env:DEBUG = "true"

# Servicios y puertos
$services = @(
    @{ Name = "auth-service"; Port = 8000 },
    @{ Name = "services-catalog-service"; Port = 3014 },
    @{ Name = "appointments-service"; Port = 3023 },
    @{ Name = "reviews-service"; Port = 3007 },
    @{ Name = "pets-service"; Port = 3022 },
    @{ Name = "groomer-service"; Port = 3010 },
    @{ Name = "user-profile-service"; Port = 3015 },
    @{ Name = "notifications-service"; Port = 3016 },
    @{ Name = "storage-service"; Port = 3017 },
    @{ Name = "email-service"; Port = 3018 },
    @{ Name = "search-service"; Port = 3019 },
    @{ Name = "reporting-service"; Port = 3021 }
)

Write-Host "Iniciando $($services.Count) microservicios..." -ForegroundColor Yellow

foreach ($service in $services) {
    $serviceName = $service.Name
    $port = $service.Port
    
    Write-Host "Iniciando $serviceName en puerto $port..." -ForegroundColor Cyan
    
    Push-Location "servicios/$serviceName"
    
    # Copiar módulo common (siempre forzar copia para evitar corrupción)
    if (Test-Path "common") {
        Remove-Item "common" -Recurse -Force
    }
    Write-Host "  Copiando módulo common..." -ForegroundColor Gray
    Copy-Item "..\common" -Destination "." -Recurse -Force
    
    # Crear entorno virtual si no existe
    if (-not (Test-Path ".venv")) {
        Write-Host "  Creando entorno virtual..." -ForegroundColor Gray
        python -m venv .venv
    }
    
    # Instalar dependencias
    Write-Host "  Instalando dependencias..." -ForegroundColor Gray
    & .venv\Scripts\python.exe -m pip install -r requirements.txt -q
    
    # Configurar puerto específico
    $env:PORT = $port
    
    # Iniciar servicio en background
    Write-Host "  Iniciando servicio..." -ForegroundColor Gray
    $process = Start-Process python -ArgumentList "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", $port -NoNewWindow -PassThru
    
    # Guardar el ID del proceso para poder detenerlo después
    $processId = $process.Id
    Write-Host "  Servicio iniciado (PID: $processId)" -ForegroundColor Green
    
    Pop-Location
}

Write-Host "`nTodos los servicios iniciados." -ForegroundColor Green
Write-Host "`nPara usar ngrok, ejecuta:" -ForegroundColor Yellow
Write-Host "  ngrok http 8000  (para auth-service)" -ForegroundColor White
Write-Host "  ngrok http 3014 (para services-catalog)" -ForegroundColor White
Write-Host "  ngrok http 3023 (para appointments)" -ForegroundColor White
Write-Host "  ...etc para cada servicio" -ForegroundColor White
Write-Host "`nO usa ngrok con múltiples túneles (requiere ngrok Pro):" -ForegroundColor Yellow
Write-Host "  ngrok config add-authtoken YOUR_TOKEN" -ForegroundColor White
Write-Host "  ngrok start --all" -ForegroundColor White
Write-Host "`nPara detener todos los servicios, cierra esta terminal o usa Ctrl+C" -ForegroundColor Yellow

# Esperar a que el usuario presione una tecla para detener
Write-Host "`nPresiona cualquier tecla para detener todos los servicios..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Detener todos los procesos de Python
Write-Host "`nDeteniendo servicios..." -ForegroundColor Yellow
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "Servicios detenidos." -ForegroundColor Green
