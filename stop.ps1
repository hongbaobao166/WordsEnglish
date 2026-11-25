$ErrorActionPreference = "Stop"
Push-Location $PSScriptRoot
try {
    docker compose stop
    if ($LASTEXITCODE -ne 0) { throw "Docker Compose failed ($LASTEXITCODE)" }
} finally { Pop-Location }
