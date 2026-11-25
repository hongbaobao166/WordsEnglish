$ErrorActionPreference = "Stop"
Push-Location $PSScriptRoot
try {
    docker compose up -d --build
    if ($LASTEXITCODE -ne 0) { throw "Docker Compose failed ($LASTEXITCODE)" }
    Write-Host "Open http://localhost:8080"
} finally { Pop-Location }
