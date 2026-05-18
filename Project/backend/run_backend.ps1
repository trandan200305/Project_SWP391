[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

Write-Host "============================================"
Write-Host "  LancerPro Backend - Compile and Run"
Write-Host "============================================"

# Kill old process on port 8080
Write-Host ""
Write-Host "[0/3] Stopping old backend..."
try {
    $conns = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
    foreach ($c in $conns) {
        if ($c.OwningProcess -gt 0) {
            Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
        }
    }
} catch {}
Start-Sleep -Seconds 2

$javaHome = "C:\Program Files\Java\jdk-17"
$javac = Join-Path $javaHome "bin\javac.exe"
$java = Join-Path $javaHome "bin\java.exe"

$project = Split-Path -Parent $MyInvocation.MyCommand.Definition
$classes = Join-Path $project "target\classes"
$m2 = Join-Path $env:USERPROFILE ".m2\repository"
$srcAuth = Join-Path $project "src\main\java\com\cny\backend\controller\AuthController.java"

# Build classpath by scanning .m2 repository
Write-Host ""
Write-Host "[1/3] Building classpath..."
$dirs = @(
    "org\springframework",
    "com\microsoft\sqlserver",
    "org\hibernate",
    "jakarta",
    "org\apache\tomcat",
    "com\fasterxml",
    "ch\qos\logback",
    "org\slf4j",
    "com\zaxxer",
    "org\yaml",
    "net\bytebuddy",
    "org\antlr",
    "org\jboss\logging",
    "io\micrometer",
    "org\projectlombok",
    "org\apache\logging",
    "org\latencyutils",
    "org\hdrhistogram",
    "org\glassfish",
    "org\aspectj"
)

$jars = @($classes)
foreach ($d in $dirs) {
    $fullDir = Join-Path $m2 $d
    if (Test-Path $fullDir) {
        $found = Get-ChildItem -Path $fullDir -Recurse -Filter "*.jar" -File
        foreach ($j in $found) {
            $jars += $j.FullName
        }
    }
}
$classpath = $jars -join ";"
Write-Host "     OK - $($jars.Count) entries."

# Compile AuthController
Write-Host ""
Write-Host "[2/3] Compiling AuthController.java..."
# Only need a few jars for compilation
$compileCP = @(
    $classes,
    (Get-ChildItem "$m2\org\springframework\spring-web" -Recurse -Filter "spring-web-6.1.6.jar" | Select-Object -First 1).FullName,
    (Get-ChildItem "$m2\org\springframework\spring-beans" -Recurse -Filter "spring-beans-6.1.6.jar" | Select-Object -First 1).FullName,
    (Get-ChildItem "$m2\org\springframework\spring-context" -Recurse -Filter "spring-context-6.1.6.jar" | Select-Object -First 1).FullName,
    (Get-ChildItem "$m2\org\springframework\spring-jdbc" -Recurse -Filter "spring-jdbc-6.1.6.jar" | Select-Object -First 1).FullName,
    (Get-ChildItem "$m2\org\springframework\spring-core" -Recurse -Filter "spring-core-6.1.6.jar" | Select-Object -First 1).FullName,
    (Get-ChildItem "$m2\org\springframework\spring-tx" -Recurse -Filter "spring-tx-6.1.6.jar" | Select-Object -First 1).FullName
) -join ";"

& $javac -encoding UTF-8 -cp $compileCP -d $classes $srcAuth
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Compilation failed!"
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "     OK - AuthController.class created."

# Run Spring Boot from classpath
Write-Host ""
Write-Host "[3/3] Starting Spring Boot on port 8080..."
Write-Host "     Press Ctrl+C to stop the server."
Write-Host "============================================"
& $java -cp $classpath com.cny.backend.BackendApplication
