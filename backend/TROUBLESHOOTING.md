# ✅ Lista de Verificación para el Backend

## 1. Verificar Base de Datos en Supabase

### a) ¿Las tablas están creadas?
Ve a Supabase → SQL Editor y ejecuta:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'perfil_usuario';
```

**Debe retornar**: `perfil_usuario`

Si no retorna nada, ejecuta tu archivo `BD-modificado.sql` completo.

### b) ¿Los roles existen?
```sql
SELECT * FROM rol_usuario;
```

**Debe mostrar**: cliente, cajero, administrador, propietario

Si no existen, ejecuta:
```sql
INSERT INTO rol_usuario (nombre_rol, descripcion, nivel_permisos) VALUES
('cliente', 'Cliente del restaurante', 10),
('cajero', 'Cajero del restaurante', 50),
('administrador', 'Administrador del sistema', 80),
('propietario', 'Propietario del negocio', 100)
ON CONFLICT (nombre_rol) DO NOTHING;
```

## 2. Verificar Credenciales en `.env`

Abre `backend/.env` y verifica:

```env
# ¿Esta es tu URL correcta?
SUPABASE_URL=https://cdrzomyyxyfhazkzuwou.supabase.co

# ⚠️ IMPORTANTE: Debe ser SERVICE_ROLE_KEY (no Anon Key)
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkcnpvbXl5eHlmaGF6a3p1d291Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDI5NjQ4NywiZXhwIjoyMDc1ODcyNDg3fQ.FGptFzHfilX15-myPwcrRAIRiBShow0LwB393En6o-I
```

### ¿Cómo obtener el Service Role Key correcto?

1. Ve a Supabase Dashboard
2. Proyecto → Settings → API
3. Copia el **`service_role`** key (NO el `anon` key)
4. Pégalo en `SUPABASE_SERVICE_KEY` en el archivo `.env`

## 3. Deshabilitar RLS (Row Level Security)

**⚠️ MUY IMPORTANTE**: Supabase por defecto protege las tablas con RLS.

Ejecuta en SQL Editor:

```sql
ALTER TABLE perfil_usuario DISABLE ROW LEVEL SECURITY;
ALTER TABLE rol_usuario DISABLE ROW LEVEL SECURITY;
```

## 4. Probar Conexión Manualmente

En Supabase SQL Editor, ejecuta:

```sql
-- Con el Service Role Key, esto debería funcionar
SELECT id_perfil, email, primer_nombre 
FROM perfil_usuario 
LIMIT 1;
```

Si da error "relation perfil_usuario does not exist":
- ✅ Ejecuta tu archivo `BD-modificado.sql` completo

Si da error "permission denied":
- ✅ Verifica que estás usando el Service Role Key
- ✅ Deshabilita RLS

## 5. Crear Usuario de Prueba

Una vez que las tablas existan, crea un usuario de prueba:

```sql
-- Primero, verifica que el rol propietario exista
SELECT id_rol FROM rol_usuario WHERE nombre_rol = 'propietario';

-- Luego, inserta el usuario (cambia el id_rol si es diferente)
INSERT INTO perfil_usuario (
  email,
  password_hash,
  primer_nombre,
  primer_apellido,
  id_rol,
  estado
) VALUES (
  'admin@shucway.com',
  '$2b$10$rKZK0jqHqPzqQxQxQxQxQeO4YvZ4YvZ4YvZ4YvZ4YvZ4YvZ4Yv', -- Contraseña: admin123
  'Admin',
  'Shucway',
  (SELECT id_rol FROM rol_usuario WHERE nombre_rol = 'propietario'),
  'activo'
);
```

## 6. Reiniciar el Backend

```bash
cd backend
npm run dev
```

Deberías ver:
```
✅ Conexión exitosa con Supabase PostgreSQL
🌐 Servidor corriendo en http://localhost:3001
```

## 7. Probar el Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@shucway.com",
    "password": "admin123"
  }'
```

## Errores Comunes

| Error | Solución |
|-------|----------|
| `relation perfil_usuario does not exist` | Ejecuta `BD-modificado.sql` en Supabase |
| `permission denied for table perfil_usuario` | Usa Service Role Key y deshabilita RLS |
| `column perfil_usuario.id_usuario does not exist` | ✅ Ya corregido - ahora usa `id_perfil` |
| `Token no proporcionado` | Agrega header: `Authorization: Bearer <token>` |

## ¿Todo listo?

Si sigues teniendo problemas, comparte:
1. El error exacto del terminal
2. El resultado de `SELECT * FROM rol_usuario;` en Supabase
3. Confirma que estás usando el Service Role Key correcto
