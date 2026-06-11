[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

Write-Host "============================================"
Write-Host "  LancerPro Backend - Booting up via Maven  "
Write-Host "============================================"

# Kill old process on port 8080
Write-Host ""
Write-Host "[1/2] Stopping old backend on port 8080..."
try {
    $conns = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
    foreach ($c in $conns) {
        if ($c.OwningProcess -gt 0) {
            Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
        }
    }
} catch {}
Start-Sleep -Seconds 2

# Set JAVA_HOME and run Maven wrapper
Write-Host ""
Write-Host "[2/2] Launching Spring Boot App..."
Write-Host "============================================"
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
& .\mvnw clean spring-boot:run

