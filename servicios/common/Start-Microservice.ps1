param(
  [Parameter(Mandatory = $true)]
  [string]$ServiceName,

  [Parameter(Mandatory = $true)]
  [int]$Port
)

$ErrorActionPreference = "Stop"

# Salida sin buffer (útil para ver logs en tiempo real)
$env:PYTHONUNBUFFERED = 1

# Asegura que los imports "common.*" funcionen (common vive en ../common dentro de /servicios)
if (-not $env:PYTHONPATH) {
  $env:PYTHONPATH = (Resolve-Path "$PSScriptRoot\..").Path
} else {
  # Evita duplicados simples y preserva el PYTHONPATH existente
  $serviciosRoot = (Resolve-Path "$PSScriptRoot\..").Path
  if ($env:PYTHONPATH -notmatch [regex]::Escape($serviciosRoot)) {
    $env:PYTHONPATH = "$serviciosRoot;$env:PYTHONPATH"
  }
}

Write-Host "==> $ServiceName"
Write-Host "    Port: $Port"
Write-Host "    PYTHONPATH: $env:PYTHONPATH"

# Preferir el venv del repositorio si existe (evita usar un Python global sin dependencias)
$repoRoot = (Resolve-Path "$PSScriptRoot\..\..").Path
$venvPython = Join-Path $repoRoot ".venv\Scripts\python.exe"

# Nota: este script asume que se ejecuta desde la carpeta del microservicio
# (es decir, donde existe main.py). Ejemplo:
#   cd servicios/auth-service
#   .\start.ps1
if (Test-Path $venvPython) {
  & $venvPython -m uvicorn main:app --reload --port $Port
} else {
  python -m uvicorn main:app --reload --port $Port
}
