# Auth Service - Thin wrapper for the common starter
$ServiceName = "Auth Service"
$Port = 8000
. "$PSScriptRoot\..\common\Start-Microservice.ps1" -ServiceName $ServiceName -Port $Port
