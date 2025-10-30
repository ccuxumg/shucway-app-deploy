# 🍔 Shucway App - Sistema de Gestión

Sistema completo de gestión para el negocio Shucway con frontend React + Vite y backend Node.js + Express.

## 🚀 Inicio Rápido

### Ejecutar todo el sistema

```bash
npm run dev:all
```

- Frontend: `http://localhost:5173` (o puerto 3000)
- Backend: `http://localhost:3002`

## 👤 Usuarios del Sistema

| Rol | Email | Username | Password | Nivel Permisos |
|-----|-------|----------|----------|----------------|
| **Propietario** (Luis Rene Flores Pivaral) | `luisflores@shucway.com` | `lrflores` | `rene123` | 100 |
| **Cajera** (Ximena Flores) | `ximenaflores@shucway.com` | `xiflores` | `ximena123` | 30 |

💡 **Login flexible:** Puedes usar email O username

### 🔐 Niveles de Permisos

- **Propietario (100)**: Acceso total al sistema
- **Administrador (80)**: Gestión completa del negocio
- **Cajero (30)**: Ventas, inventario básico
- **Cliente (10)**: Solo consultas

Ver [PERMISSIONS_GUIDE.md](./PERMISSIONS_GUIDE.md) para detalles completos.

## 🛠️ Scripts Disponibles

```bash
npm run dev:all       # 🚀 Frontend + Backend
npm run dev           # Frontend solo
npm run dev:backend   # Backend solo
npm run build:all     # Compilar todo
```

## 📦 Instalación

1. Instalar dependencias del frontend:

   ```bash
   npm install
   ```

1. Instalar dependencias del backend:

   ```bash
   cd backend
   npm install
   ```

1. Configurar base de datos:
   - Ejecutar `BD-modificado.sql` en Supabase
   - Ejecutar `backend/init-database.sql` para crear usuarios

## 🔐 Autenticación

- JWT personalizado (no Supabase Auth)
- Login con email O username
- Contraseñas hasheadas con bcrypt

## 📚 Documentación

- [Frontend Migration Guide](./FRONTEND_MIGRATION.md)
- [Backend README](./backend/README.md)
- [Permissions Guide](./PERMISSIONS_GUIDE.md) - Sistema de permisos y roles

## 🔧 Stack Tecnológico

**Frontend:** React 18, TypeScript, Vite, Ant Design, Axios

**Backend:** Node.js, Express, TypeScript, JWT, bcrypt, Supabase (PostgreSQL + Storage)

This project is licensed under the [MIT License](LICENSE).
