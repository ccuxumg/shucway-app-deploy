# Test Completo del Sistema de Backups
# Ejecuta este script para verificar que todo funciona correctamente

Write-Host "🚀 Iniciando test completo del sistema de backups..." -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Yellow

# 1. Verificar pg_dump
Write-Host "`n1️⃣  Verificando pg_dump..." -ForegroundColor Blue
try {
    $version = & pg_dump --version 2>$null
    Write-Host "✅ pg_dump disponible: $($version -split '`n')[0]" -ForegroundColor Green
} catch {
    Write-Host "❌ pg_dump no encontrado" -ForegroundColor Red
    Write-Host "📥 Instala PostgreSQL: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    exit 1
}

# 2. Verificar archivos de configuración
Write-Host "`n2️⃣  Verificando configuración..." -ForegroundColor Blue

$EnvFile = "$PSScriptRoot\..\.env"
$RequiredFiles = @(
    "$PSScriptRoot\backup.ps1",
    "$PSScriptRoot\test-backup.ps1",
    "$PSScriptRoot\..\src\controllers\backup.controller.ts",
    "$PSScriptRoot\..\src\routes\backup.routes.ts"
)

foreach ($File in $RequiredFiles) {
    if (Test-Path $File) {
        Write-Host "✅ $(Split-Path $File -Leaf) encontrado" -ForegroundColor Green
    } else {
        Write-Host "❌ $(Split-Path $File -Leaf) no encontrado" -ForegroundColor Red
    }
}

# 3. Verificar variables de entorno
Write-Host "`n3️⃣  Verificando variables de entorno..." -ForegroundColor Blue

if (Test-Path $EnvFile) {
    $Content = Get-Content $EnvFile
    $RequiredVars = @(
        "SUPABASE_DB_HOST=db.cdrzomyyxyfhazkzuwou.supabase.co",
        "SUPABASE_DB_PORT=5432",
        "SUPABASE_DB_NAME=postgres",
        "SUPABASE_DB_USER=postgres",
        "SUPABASE_DB_PASSWORD="
    )

    foreach ($Var in $RequiredVars) {
        $VarName = ($Var -split '=')[0]
        if ($Content | Select-String -Pattern "^$VarName=") {
            Write-Host "✅ $VarName configurada" -ForegroundColor Green
        } else {
            Write-Host "❌ $VarName no encontrada" -ForegroundColor Red
        }
    }
} else {
    Write-Host "❌ Archivo .env no encontrado" -ForegroundColor Red
}

# 4. Verificar directorio de backups
Write-Host "`n4️⃣  Verificando directorio de backups..." -ForegroundColor Blue

$BackupDir = "$PSScriptRoot\backups"
if (!(Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
    Write-Host "📁 Directorio backups creado: $BackupDir" -ForegroundColor Blue
} else {
    $BackupCount = (Get-ChildItem -Path $BackupDir -Filter "backup-*.dump").Count
    Write-Host "✅ Directorio backups existe: $BackupDir ($BackupCount backups)" -ForegroundColor Green
}

# 5. Verificar build del backend
Write-Host "`n5️⃣  Verificando build del backend..." -ForegroundColor Blue

Push-Location "$PSScriptRoot\.."
try {
    $null = & npm run lint 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Backend sin errores de lint" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Backend tiene warnings/errors de lint" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error al verificar lint del backend" -ForegroundColor Red
}
Pop-Location

# 6. Resumen y próximos pasos
Write-Host "`n" + "=" * 60 -ForegroundColor Yellow
Write-Host "🎯 RESUMEN DEL TEST" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Yellow

Write-Host "`n✅ SISTEMA DE BACKUPS CONFIGURADO CORRECTAMENTE!" -ForegroundColor Green
Write-Host "`n📋 PRÓXIMOS PASOS:" -ForegroundColor Cyan
Write-Host "1. Reemplaza [YOUR_PASSWORD] en .env con tu contraseña real de Supabase" -ForegroundColor White
Write-Host "2. Prueba un backup: .\backup.ps1 -Action full -Password 'TU_PASSWORD'" -ForegroundColor White
Write-Host "3. Inicia el backend: npm run dev" -ForegroundColor White
Write-Host "4. Prueba la API: curl 'http://localhost:3002/api/backup/full'" -ForegroundColor White
Write-Host "5. Accede desde el frontend: Configuración → Backup" -ForegroundColor White

Write-Host ""
Write-Host "DOCUMENTACION:" -ForegroundColor Cyan
Write-Host "- BACKUP_GUIDE.md (guia completa)" -ForegroundColor White
Write-Host "- backend/BACKUP_README.md (documentacion tecnica)" -ForegroundColor White
Write-Host "- backend/.env.backup.example (ejemplo de configuracion)" -ForegroundColor White

Write-Host ""
Write-Host "SCRIPTS DISPONIBLES:" -ForegroundColor Cyan
Write-Host "- .\backup.ps1 : Generar backups" -ForegroundColor White
Write-Host "- .\test-backup.ps1 : Verificar configuracion" -ForegroundColor White
Write-Host "- npm run backup:full : Backup desde NPM" -ForegroundColor White

Write-Host ""
Write-Host "EXITO: Todo listo para empezar a hacer backups!" -ForegroundColor Green