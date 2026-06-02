# User Profile Service - Thin wrapper for the common starter
$ServiceName = "User Profile Service"
$Port = 3009
. "$PSScriptRoot\..\common\Start-Microservice.ps1" -ServiceName $ServiceName -Port $Port
