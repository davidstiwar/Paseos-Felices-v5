# ============================================
# Script para iniciar Paseos Felices v5
# ============================================

$ErrorActionPreference = "Continue"

# Obtener ruta raiz
$rootPath = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
$serviciosPath = Join-Path $rootPath "servicios"
$frontendPath = Join-Path $rootPath "frontend"
$venvPython = Join-Path $rootPath ".venv\Scripts\python.exe"

Write-Host ""
Write-Host "===== Paseos Felices v5 =====" -ForegroundColor Cyan
Write-Host "Iniciando aplicacion desde cero" -ForegroundColor Cyan
Write-Host ""

# 1. VERIFICAR VENV
Write-Host "[1/5] Verificando Python virtual environment..." -ForegroundColor Yellow
if (Test-Path $venvPython) {
    Write-Host "OK: venv encontrado" -ForegroundColor Green
}
else {
    Write-Host "ERROR: venv no encontrado en $venvPython" -ForegroundColor Red
    Write-Host "Ejecuta primero: python -m venv .venv" -ForegroundColor Yellow
    exit 1
}

# Configurar PYTHONPATH para todos los servicios
$env:PYTHONPATH = $serviciosPath
$env:PYTHONUNBUFFERED = 1

# Encontrar MySQL en XAMPP si no esta en PATH
$mysqlPath = "mysql"
if (-not (Get-Command mysql -ErrorAction SilentlyContinue)) {
    Write-Host "  Buscando MySQL en XAMPP..." -ForegroundColor Gray
    $xamppPaths = @(
        "C:\xampp\mysql\bin\mysql.exe",
        "C:\XAMPP\mysql\bin\mysql.exe",
        "C:\Program Files\XAMPP\mysql\bin\mysql.exe",
        "C:\Program Files (x86)\XAMPP\mysql\bin\mysql.exe"
    )
    
    foreach ($path in $xamppPaths) {
        if (Test-Path $path) {
            $mysqlPath = $path
            Write-Host "  OK: MySQL encontrado en $path" -ForegroundColor Green
            break
        }
    }
}

# 2. MIGRACIONES Y BASE DE DATOS
Write-Host ""
Write-Host "[2/5] Configurando base de datos (MySQL)..." -ForegroundColor Yellow

# Verificar si MySQL esta disponible
$mysqlAvailable = $false

# Opcion 1: Intentar con el comando mysql directamente
Write-Host "  Buscando MySQL..." -ForegroundColor Gray
try {
    $testCmd = & $mysqlPath -u root -e "SELECT 1;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        $mysqlAvailable = $true
        Write-Host "OK: MySQL esta disponible (puerto 3306)" -ForegroundColor Green
    }
}
catch {
    # Opcion 2: Intentar con localhost explícito
    try {
        $testCmd = & $mysqlPath -h localhost -u root -e "SELECT 1;" 2>&1
        if ($LASTEXITCODE -eq 0) {
            $mysqlAvailable = $true
            Write-Host "OK: MySQL esta disponible (localhost)" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "ERROR: No se puede conectar a MySQL" -ForegroundColor Red
        Write-Host "  Verifica que:" -ForegroundColor Yellow
        Write-Host "    1. XAMPP MySQL esta corriendo" -ForegroundColor Yellow
        Write-Host "    2. MySQL esta en el PATH o en: C:\xampp\mysql\bin\" -ForegroundColor Yellow
        Write-Host "    3. Usuario root existe sin contraseña" -ForegroundColor Yellow
        exit 1
    }
}

# Ejecutar migraciones (ahora es obligatorio)
if ($mysqlAvailable) {
    Write-Host ""
    Write-Host "  Ejecutando migraciones SQL..." -ForegroundColor Cyan
    
    # Ejecutar setup de base de datos
    $setupScript = Join-Path $serviciosPath "mysql-setup.sql"
    if (Test-Path $setupScript) {
        Write-Host "  > Inicializando esquema de BD..." -ForegroundColor Gray
        $setupContent = Get-Content $setupScript -Raw
        & $mysqlPath -u root -e $setupContent 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  OK: Esquema de BD creado/actualizado" -ForegroundColor Green
        }
        else {
            Write-Host "  Aviso: Error al ejecutar setup SQL" -ForegroundColor Yellow
        }
    }
    
    # Ejecutar migraciones adicionales
    $migrationDir = Join-Path $serviciosPath "migrations"
    if (Test-Path $migrationDir) {
        $sqlFiles = Get-ChildItem $migrationDir -Filter "*.sql" -ErrorAction SilentlyContinue
        if ($sqlFiles.Count -gt 0) {
            Write-Host "  > Aplicando migraciones..." -ForegroundColor Gray
            foreach ($sqlFile in $sqlFiles) {
                Write-Host "    * $($sqlFile.Name)" -ForegroundColor Gray
                $content = Get-Content $sqlFile.FullName -Raw
                & $mysqlPath -u root -e $content 2>$null
            }
            Write-Host "  OK: Migraciones aplicadas" -ForegroundColor Green
        }
    }
}

# 3. CREAR DIRECTORIO DE LOGS
Write-Host ""
Write-Host "[3/5] Configurando logging..." -ForegroundColor Yellow
$logsPath = Join-Path $rootPath "logs"
if (-not (Test-Path $logsPath)) {
    New-Item -ItemType Directory -Path $logsPath | Out-Null
    Write-Host "OK: Directorio de logs creado" -ForegroundColor Green
}
else {
    Write-Host "OK: Directorio de logs existe" -ForegroundColor Green
}

# 4. LEVANTAR SERVICIOS BACKEND
Write-Host ""
Write-Host "[4/5] Levantando Servicios Backend..." -ForegroundColor Yellow

# Función para iniciar un servicio
function Start-Service {
    param (
        [string]$ServiceName,
        [string]$ServicePath,
        [int]$Port
    )
    
    $serviceScript = Join-Path $ServicePath "start.ps1"
    
    if (Test-Path $serviceScript) {
        Write-Host "  > $ServiceName (Puerto $Port)" -ForegroundColor Cyan
        Push-Location $ServicePath
        Start-Process -FilePath "powershell.exe" -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$serviceScript`"" -NoNewWindow:$false
        Pop-Location
        Write-Host "  OK: $ServiceName iniciado" -ForegroundColor Green
        return $true
    }
    else {
        Write-Host "  Aviso: Script de inicio no encontrado: $serviceScript" -ForegroundColor Yellow
        return $false
    }
}

# Iniciar Auth Service
$authPath = Join-Path $serviciosPath "auth-service"
Start-Service -ServiceName "Auth Service" -ServicePath $authPath -Port 8000

# Iniciar Services Catalog Service
$catalogPath = Join-Path $serviciosPath "services-catalog-service"
Start-Service -ServiceName "Services Catalog Service" -ServicePath $catalogPath -Port 3014

# Iniciar Appointments Service
$appointmentsPath = Join-Path $serviciosPath "appointments-service"
Start-Service -ServiceName "Appointments Service" -ServicePath $appointmentsPath -Port 3023

# Iniciar Reviews Service
$reviewsPath = Join-Path $serviciosPath "reviews-service"
Start-Service -ServiceName "Reviews Service" -ServicePath $reviewsPath -Port 3007

# Iniciar Pets Service
$petsPath = Join-Path $serviciosPath "pets-service"
Start-Service -ServiceName "Pets Service" -ServicePath $petsPath -Port 3022

# Esperar a que los servicios estén listos
Write-Host ""
Write-Host "  Esperando que los servicios estén operacionales..." -ForegroundColor Yellow
$maxWait = 30
$waited = 0
$servicesReady = 0
$totalServices = 5

while ($waited -lt $maxWait -and $servicesReady -lt $totalServices) {
    $servicesReady = 0
    
    # Verificar Auth Service
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -TimeoutSec 1 -UseBasicParsing -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) { $servicesReady++ }
    }
    catch { }
    
    # Verificar Services Catalog Service
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3014/health" -TimeoutSec 1 -UseBasicParsing -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) { $servicesReady++ }
    }
    catch { }
    
    # Verificar Appointments Service
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3023/health" -TimeoutSec 1 -UseBasicParsing -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) { $servicesReady++ }
    }
    catch { }
    
    # Verificar Reviews Service
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3007/health" -TimeoutSec 1 -UseBasicParsing -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) { $servicesReady++ }
    }
    catch { }
    
    # Verificar Pets Service
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3022/health" -TimeoutSec 1 -UseBasicParsing -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) { $servicesReady++ }
    }
    catch { }
    
    if ($servicesReady -lt $totalServices) {
        Write-Host "  Servicios listos: $servicesReady/$totalServices (esperando... $($waited)s)" -ForegroundColor Gray
        Start-Sleep -Seconds 2
        $waited += 2
    }
}

Write-Host "  OK: $servicesReady/$totalServices servicios respondiendo" -ForegroundColor Green

# 5. LEVANTAR FRONTEND
Write-Host ""
Write-Host "[5/5] Levantando Frontend..." -ForegroundColor Yellow

if (Test-Path $frontendPath) {
    $packageJson = Join-Path $frontendPath "package.json"
    if (Test-Path $packageJson) {
        Write-Host "  > React Frontend (Puerto 3000)" -ForegroundColor Cyan
        # Cambiar al directorio frontend y ejecutar npm start
        Push-Location $frontendPath
        Start-Process -FilePath "npm" -ArgumentList "start" -NoNewWindow:$false
        Pop-Location
        Write-Host "  OK: Frontend iniciado" -ForegroundColor Green
    }
    else {
        Write-Host "  Error: package.json no encontrado" -ForegroundColor Red
    }
}
else {
    Write-Host "  Error: Carpeta frontend no encontrada: $frontendPath" -ForegroundColor Red
}

# MENSAJE FINAL
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Paseos Felices iniciado" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "DIRECCIONES:" -ForegroundColor Cyan
Write-Host "   Frontend React:           http://localhost:3000" -ForegroundColor White
Write-Host "   Auth Service:             http://localhost:8000" -ForegroundColor White
Write-Host "   Services Catalog Service: http://localhost:3014" -ForegroundColor White
Write-Host "   Appointments Service:     http://localhost:3023" -ForegroundColor White
Write-Host "   Reviews Service:          http://localhost:3007" -ForegroundColor White
Write-Host "   Pets Service:             http://localhost:3022" -ForegroundColor White
Write-Host ""
Write-Host "BASE DE DATOS:" -ForegroundColor Cyan
Write-Host "   Tipo:     MySQL" -ForegroundColor White
Write-Host "   Esquema:  Iniciado automaticamente" -ForegroundColor White
Write-Host "   Estado:   Listo para usar" -ForegroundColor White
Write-Host ""
Write-Host "LOGS:" -ForegroundColor Cyan
Write-Host "   Ubicacion: $logsPath" -ForegroundColor White
Write-Host ""
Write-Host "PROXIMOS PASOS:" -ForegroundColor Yellow
Write-Host "   1. Abre http://localhost:3000 en tu navegador" -ForegroundColor White
Write-Host "   2. Intenta hacer login o registrarte" -ForegroundColor White
Write-Host "   3. Si hay errores, revisa los logs" -ForegroundColor White
Write-Host ""
Write-Host "TIPS:" -ForegroundColor Yellow
Write-Host "   - Base de datos: Migraciones ejecutadas automaticamente" -ForegroundColor Gray
Write-Host "   - MySQL debe estar en ejecucion antes de iniciar" -ForegroundColor Gray
Write-Host "   - Si algun servicio falla, verifica: pip install -r requirements.txt" -ForegroundColor Gray
Write-Host "   - Si npm falla, verifica Node.js: npm --version" -ForegroundColor Gray
Write-Host "   - Para detener todo: presiona Ctrl+C en cada terminal" -ForegroundColor Gray
Write-Host ""
