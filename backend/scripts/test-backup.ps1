# Script de Prueba para Backups
# Ejecuta este script para verificar que los backups funcionan correctamente

Write-Host "🧪 Probando funcionalidad de backups..." -ForegroundColor Cyan

# Verificar que pg_dump esté disponible
try {
    $version = & pg_dump --version 2>$null
    Write-Host "✅ pg_dump disponible: $version" -ForegroundColor Green
} catch {
    Write-Host "❌ pg_dump no encontrado. Instala PostgreSQL primero." -ForegroundColor Red
    Write-Host "📥 Descarga: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    exit 1
}

# Verificar archivo de configuración
$EnvFile = "..\.env"
if (Test-Path $EnvFile) {
    Write-Host "✅ Archivo .env encontrado" -ForegroundColor Green

    # Verificar variables necesarias
    $Content = Get-Content $EnvFile
    $RequiredVars = @("SUPABASE_DB_HOST", "SUPABASE_DB_USER", "SUPABASE_DB_PASSWORD")

    foreach ($Var in $RequiredVars) {
        if ($Content | Select-String -Pattern "^$Var=") {
            Write-Host "✅ Variable $Var configurada" -ForegroundColor Green
        } else {
            Write-Host "❌ Variable $Var no encontrada en .env" -ForegroundColor Red
        }
    }
} else {
    Write-Host "❌ Archivo .env no encontrado en $EnvFile" -ForegroundColor Red
}

# Verificar script de backup
$BackupScript = ".\backup.ps1"
if (Test-Path $BackupScript) {
    Write-Host "✅ Script backup.ps1 encontrado" -ForegroundColor Green
} else {
    Write-Host "❌ Script backup.ps1 no encontrado" -ForegroundColor Red
}

# Verificar directorio de backups
$BackupDir = ".\backups"
if (!(Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
    Write-Host "📁 Directorio backups creado: $BackupDir" -ForegroundColor Blue
} else {
    Write-Host "✅ Directorio backups existe: $BackupDir" -ForegroundColor Green
}

Write-Host "`n🎯 Para generar un backup completo, ejecuta:" -ForegroundColor Cyan
Write-Host "   .\backup.ps1 -Action full -Password 'TU_PASSWORD'" -ForegroundColor White
Write-Host "`n📖 Lee BACKUP_GUIDE.md para instrucciones completas" -ForegroundColor Cyan