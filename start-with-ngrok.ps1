# Script para iniciar todos los servicios con nginx y ngrok

Write-Host "Iniciando Paseos Felices con ngrok..." -ForegroundColor Green

# Verificar si Docker está instalado
$dockerInstalled = docker --version 2>$null
if (-not $dockerInstalled) {
    Write-Host "Error: Docker no está instalado. Por favor instala Docker primero." -ForegroundColor Red
    exit 1
}

# Iniciar MySQL con Docker
Write-Host "Iniciando MySQL con Docker..." -ForegroundColor Yellow
docker run -d `
    --name paseos-mysql `
    -e MYSQL_ROOT_PASSWORD=root `
    -e MYSQL_DATABASE=paseos_auth `
    -p 3306:3306 `
    mysql:8.0

# Esperar a que MySQL esté listo
Write-Host "Esperando a que MySQL esté listo..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Ejecutar script SQL
Write-Host "Ejecutando script SQL..." -ForegroundColor Yellow
docker exec -i paseos-mysql mysql -uroot -proot paseos_auth < servicios/mysql-setup.sql

# Iniciar nginx
Write-Host "Iniciando nginx..." -ForegroundColor Yellow
nginx -c $(Get-Location)/nginx.conf

# Iniciar servicios
Write-Host "Iniciando microservicios..." -ForegroundColor Yellow

$services = @(
    "auth-service",
    "services-catalog-service",
    "appointments-service",
    "reviews-service",
    "pets-service",
    "groomer-service",
    "user-profile-service",
    "notifications-service",
    "storage-service",
    "email-service",
    "search-service",
    "reporting-service"
)

$ports = @{
    "auth-service" = 8000
    "services-catalog-service" = 3014
    "appointments-service" = 3023
    "reviews-service" = 3007
    "pets-service" = 3022
    "groomer-service" = 3010
    "user-profile-service" = 3015
    "notifications-service" = 3016
    "storage-service" = 3017
    "email-service" = 3018
    "search-service" = 3019
    "reporting-service" = 3020
}

foreach ($service in $services) {
    $port = $ports[$service]
    Write-Host "Iniciando $service en puerto $port..." -ForegroundColor Cyan
    
    Push-Location "servicios/$service"
    
    # Crear entorno virtual si no existe
    if (-not (Test-Path ".venv")) {
        python -m venv .venv
    }
    
    # Activar entorno virtual
    & .venv\Scripts\Activate.ps1
    
    # Instalar dependencias
    pip install -r requirements.txt -q
    
    # Iniciar servicio en background
    $env:DATABASE_URL = "mysql+pymysql://root:root@localhost:3306/paseos_auth"
    $env:FRONTEND_URL = "http://localhost:3000"
    $env:SECRET_KEY = "tu_super_secreto_aqui_cambiar_en_produccion"
    $env:ENVIRONMENT = "development"
    $env:DEBUG = "true"
    $env:PORT = $port
    
    Start-Process python -ArgumentList "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", $port -NoNewWindow
    
    Pop-Location
}

Write-Host "Todos los servicios iniciados." -ForegroundColor Green
Write-Host "Ahora inicia ngrok con: ngrok http 80" -ForegroundColor Yellow
Write-Host "Luego actualiza FRONTEND_URL con la URL de ngrok en cada servicio." -ForegroundColor Yellow
