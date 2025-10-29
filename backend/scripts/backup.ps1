# Script PowerShell para backups de Supabase (Free Tier)
# Uso: .\backup.ps1 -Action <full|incremental> -Password "tu_password"

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("full", "incremental")]
    [string]$Action,

    [Parameter(Mandatory=$true)]
    [string]$Password,

    [Parameter(Mandatory=$false)]
    [int]$KeepBackups = 5,

    [Parameter(Mandatory=$false)]
    [string]$BackupDir = ".\backups"
)

# Configuración de conexión
$DbHost = "db.cdrzomyyxyfhazkzuwou.supabase.co"
$Port = "5432"
$Database = "postgres"
$User = "postgres"

# Crear directorio de backups si no existe
if (!(Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

# Timestamp para el archivo
$Timestamp = (Get-Date).ToString("yyyyMMddHHmmss")

# Función para limpiar backups antiguos
function Clean-OldBackups {
    param([string]$Pattern)

    $Files = Get-ChildItem -Path $BackupDir -Filter $Pattern | Sort-Object LastWriteTime -Descending
    if ($Files.Count -gt $KeepBackups) {
        $FilesToDelete = $Files | Select-Object -Skip $KeepBackups
        foreach ($File in $FilesToDelete) {
            Remove-Item $File.FullName -Force
            Write-Host "Eliminado backup antiguo: $($File.Name)" -ForegroundColor Yellow
        }
    }
}

# Función para backup completo
function Backup-Full {
    Write-Host "Generando backup completo..." -ForegroundColor Green

    $BackupFile = Join-Path $BackupDir "backup-full-$Timestamp.sql"

    try {
        # Usar formato plain (SQL legible)
        $env:PGPASSWORD = $Password
        & pg_dump -Fp -h $DbHost -p $Port -U $User -d $Database -f $BackupFile

        if ($LASTEXITCODE -eq 0) {
            Write-Host "Backup completo generado exitosamente: $BackupFile" -ForegroundColor Green
            Write-Host "Tamaño: $((Get-Item $BackupFile).Length / 1MB) MB" -ForegroundColor Cyan

            # Limpiar backups antiguos
            Clean-OldBackups "backup-full-*.sql"

            return $true
        } else {
            Write-Host "Error al generar backup completo" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
    finally {
        # Limpiar variable de entorno
        Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
    }
}

# Función para backup incremental (explica limitación)
function Backup-Incremental {
    Write-Host "Backup incremental no disponible en Supabase Free Tier" -ForegroundColor Yellow
    Write-Host "Generando backup completo como alternativa..." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "💡 Estrategias de optimización disponibles:" -ForegroundColor Green
    Write-Host "   • Programar backups diarios/semanalmente" -ForegroundColor White
    Write-Host "   • Usar compresión máxima (--compress=9)" -ForegroundColor White
    Write-Host "   • Almacenar en cloud storage (AWS S3, etc.)" -ForegroundColor White
    Write-Host "   • Implementar retención automática de backups" -ForegroundColor White
    Write-Host ""

    # Generar backup completo como alternativa
    Backup-Full
}

# Verificar que pg_dump esté disponible
try {
    $null = & pg_dump --version 2>$null
}
catch {
    Write-Host "pg_dump no está disponible. Instala PostgreSQL o las herramientas del cliente." -ForegroundColor Red
    Write-Host "Descarga: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    exit 1
}

# Ejecutar acción solicitada
switch ($Action) {
    "full" {
        $Success = Backup-Full
    }
    "incremental" {
        $Success = Backup-Incremental
    }
}

if ($Success) {
    Write-Host ""
    Write-Host "EXITO: Backup completado exitosamente!" -ForegroundColor Green
    Write-Host "Ubicacion: $BackupDir" -ForegroundColor Cyan
    Write-Host "Para restaurar: pg_restore -h $DbHost -p $Port -U $User -d $Database -v archivo.dump" -ForegroundColor Magenta
} else {
    Write-Host ""
    Write-Host "ERROR: Backup fallo" -ForegroundColor Red
    exit 1
}