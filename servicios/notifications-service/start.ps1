# Notifications Service - Thin wrapper for the common starter
$ServiceName = "Notifications Service"
$Port = 3008
. "$PSScriptRoot\..\common\Start-Microservice.ps1" -ServiceName $ServiceName -Port $Port
