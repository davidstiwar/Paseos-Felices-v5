# Appointments Service - Thin wrapper for the common starter
$ServiceName = "Appointments Service"
$Port = 3023
. "$PSScriptRoot\..\common\Start-Microservice.ps1" -ServiceName $ServiceName -Port $Port
