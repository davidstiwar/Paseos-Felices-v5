# Pets Service - Thin wrapper for the common starter
$ServiceName = "Pets Service"
$Port = 3022
. "$PSScriptRoot\..\common\Start-Microservice.ps1" -ServiceName $ServiceName -Port $Port
