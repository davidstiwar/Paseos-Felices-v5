# Reviews Service - Thin wrapper for the common starter
$ServiceName = "Reviews Service"
$Port = 3007
. "$PSScriptRoot\..\common\Start-Microservice.ps1" -ServiceName $ServiceName -Port $Port
