#!/bin/bash

# Script Bash para backups de Supabase (Free Tier) - AWS Linux
# Uso: ./backup.sh -a <full|incremental> -p "tu_password"

set -e  # Salir en caso de error

# Función para mostrar ayuda
show_help() {
    echo "Uso: $0 -a <full|incremental> -p <password> [opciones]"
    echo ""
    echo "Opciones:"
    echo "  -a, --action     Acción: full o incremental"
    echo "  -p, --password   Contraseña de la base de datos"
    echo "  -d, --dir        Directorio de backups (default: ./backups)"
    echo "  -k, --keep       Número de backups a mantener (default: 5)"
    echo "  -h, --help       Mostrar esta ayuda"
    echo ""
    echo "Ejemplo:"
    echo "  $0 -a full -p 'mi_password'"
    exit 0
}

# Valores por defecto
ACTION=""
PASSWORD=""
BACKUP_DIR="./backups"
KEEP_BACKUPS=5

# Parsear argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        -a|--action)
            ACTION="$2"
            shift 2
            ;;
        -p|--password)
            PASSWORD="$2"
            shift 2
            ;;
        -d|--dir)
            BACKUP_DIR="$2"
            shift 2
            ;;
        -k|--keep)
            KEEP_BACKUPS="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            ;;
        *)
            echo "Error: Opción desconocida $1"
            show_help
            ;;
    esac
done

# Validar argumentos requeridos
if [[ -z "$ACTION" ]]; then
    echo "Error: Acción requerida. Use -a full o -a incremental"
    exit 1
fi

if [[ -z "$PASSWORD" ]]; then
    echo "Error: Contraseña requerida. Use -p 'tu_password'"
    exit 1
fi

# Configuración de conexión
DB_HOST="db.cdrzomyyxyfhazkzuwou.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"

# Crear directorio de backups si no existe
mkdir -p "$BACKUP_DIR"

# Timestamp para el archivo
TIMESTAMP=$(date +"%Y%m%d%H%M%S")

# Función para limpiar backups antiguos
clean_old_backups() {
    local pattern="$1"
    echo "Limpiando backups antiguos ($pattern)..."

    # Contar archivos y eliminar los más antiguos si exceden el límite
    local files=($(ls -t "$BACKUP_DIR"/$pattern 2>/dev/null || true))
    local count=${#files[@]}

    if [[ $count -gt $KEEP_BACKUPS ]]; then
        local to_delete=$((count - KEEP_BACKUPS))
        for ((i=0; i<to_delete; i++)); do
            echo "Eliminando backup antiguo: ${files[$i]}"
            rm -f "${files[$i]}"
        done
    fi
}

# Función para backup completo
backup_full() {
    echo "Generando backup completo..."

    local backup_file="$BACKUP_DIR/backup-full-$TIMESTAMP.dump"

    # Usar formato custom (más eficiente para restore)
    export PGPASSWORD="$PASSWORD"

    if pg_dump -Fc -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$backup_file"; then
        local size_mb=$(du -m "$backup_file" | cut -f1)
        echo "Backup completo generado exitosamente: $backup_file"
        echo "Tamaño: ${size_mb} MB"

        # Limpiar backups antiguos
        clean_old_backups "backup-full-*.dump"

        return 0
    else
        echo "Error al generar backup completo"
        return 1
    fi
}

# Función para backup incremental (explica limitación)
backup_incremental() {
    echo "Backup incremental no disponible en Supabase Free Tier"
    echo "Generando backup completo como alternativa..."
    echo ""
    echo "💡 Estrategias de optimización disponibles:"
    echo "   • Programar backups diarios/semanalmente"
    echo "   • Usar compresión máxima (--compress=9)"
    echo "   • Almacenar en cloud storage (AWS S3, etc.)"
    echo "   • Implementar retención automática de backups"
    echo ""

    # Generar backup completo como alternativa
    backup_full
}

# Verificar que pg_dump esté disponible
if ! command -v pg_dump &> /dev/null; then
    echo "pg_dump no está disponible. Instala PostgreSQL client:"
    echo "  Ubuntu/Debian: sudo apt-get install postgresql-client"
    echo "  CentOS/RHEL: sudo yum install postgresql"
    echo "  Amazon Linux: sudo yum install postgresql"
    exit 1
fi

# Ejecutar acción solicitada
SUCCESS=0
case "$ACTION" in
    "full")
        if backup_full; then
            SUCCESS=1
        fi
        ;;
    "incremental")
        if backup_incremental; then
            SUCCESS=1
        fi
        ;;
    *)
        echo "Error: Acción inválida. Use 'full' o 'incremental'"
        exit 1
        ;;
esac

# Resultado final
if [[ $SUCCESS -eq 1 ]]; then
    echo ""
    echo "EXITO: Backup completado exitosamente!"
    echo "Ubicacion: $BACKUP_DIR"
    echo "Para restaurar: pg_restore -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -v archivo.dump"
else
    echo ""
    echo "ERROR: Backup falló"
    exit 1
fi