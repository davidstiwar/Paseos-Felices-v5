# Services Catalog Service - Thin wrapper for the common starter
$ServiceName = "Services Catalog Service"
$Port = 3014
. "$PSScriptRoot\..\common\Start-Microservice.ps1" -ServiceName $ServiceName -Port $Port
