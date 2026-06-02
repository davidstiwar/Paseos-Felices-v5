# Groomer Service - Thin wrapper for the common starter
$ServiceName = "Groomer Service"
$Port = 3025
. "$PSScriptRoot\..\common\Start-Microservice.ps1" -ServiceName $ServiceName -Port $Port
