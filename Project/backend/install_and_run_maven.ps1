[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$ErrorActionPreference = 'Stop'
$mavenDir = Join-Path $env:USERPROFILE "maven"

if (-Not (Test-Path $mavenDir)) {
    New-Item -ItemType Directory -Path $mavenDir | Out-Null
}

$zipPath = Join-Path $mavenDir "maven.zip"
Write-Host "Downloading Maven 3.9.6 with curl..."
curl.exe -L -o $zipPath "https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/3.9.6/apache-maven-3.9.6-bin.zip"

Write-Host "Extracting Maven..."
Expand-Archive -Path $zipPath -DestinationPath $mavenDir -Force
Remove-Item $zipPath

$binPath = Join-Path $mavenDir "apache-maven-3.9.6\bin"
Write-Host "Adding Maven to User PATH..."
$userPath = [Environment]::GetEnvironmentVariable("PATH", "User")

if (-not $userPath) {
    $userPath = ""
}

if ($userPath -notmatch [regex]::Escape($binPath)) {
    $newPath = $userPath + ";" + $binPath
    [Environment]::SetEnvironmentVariable("PATH", $newPath, "User")
    Write-Host "Successfully added to PATH!"
} else {
    Write-Host "Maven is already in User PATH."
}

Write-Host "Maven installation complete. Starting Spring Boot Backend..."
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location -Path $scriptPath
& $binPath\mvn.cmd spring-boot:run
