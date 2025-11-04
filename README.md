# 🍔 Shucway App - Sistema de Gestión

Sistema completo de gestión para el negocio Shucway con frontend React + Vite y backend Node.js + Express.

## 🚀 Inicio Rápido

### Ejecutar todo el sistema

```bash

```

- Frontend: `http://localhost:5173` (o puerto 3000)
- Backend: `http://localhost:3002`

## 📦 Instalación

1. Instalar dependencias del frontend:

   ```bash
   npm install
   ```

2. Instalar dependencias del backend:

   ```bash
   cd backend
   npm install
   ```

3. Configurar variables de entorno:
   - **Frontend**: Copiar `frontend/.env.example` a `frontend/.env` y configurar las variables `VITE_*` para Supabase y API.
   - **Backend**: Copiar `backend/.env.example` a `backend/.env` y configurar las variables de producción.
   - **Variables Globales**: Ver `config/shared.ts` para constantes compartidas (URLs de Supabase, permisos, etc.).

4. Configurar base de datos:
   - Ejecutar `BD-modificado.sql` en Supabase
   - Ejecutar `backend/init-database.sql` para crear usuarios

## 🔧 Configuración de Entorno

### Variables de Entorno

Cada proyecto (frontend y backend) tiene su propio archivo `.env`:

- **Frontend** (`.env` en raíz): Variables con prefijo `VITE_` para configuración del cliente (Supabase, API URL). Estas se exponen al navegador.
- **Backend** (`backend/.env`): Variables del servidor (JWT, BD, CORS, etc.). Estas permanecen en el servidor.
npm run dev:all
### Archivo de Configuración Compartida

Para constantes globales (como URLs de Supabase cuando la BD es compartida), usa `config/shared.ts`. Este archivo puede ser importado en ambos proyectos para mantener consistencia y tiene una función `getEnvVar()` para obtener variables con fallback.

### Ejemplo de Configuración

1. Copiar ejemplos:

   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   ```

2. Configurar las variables según tu entorno (desarrollo/producción).

## 🚀 Despliegue en Producción

### Preparación

1. Configurar variables de entorno:
   - Copiar `backend/.env.example` a `backend/.env`
   - Configurar las variables para producción (URLs de Supabase, JWT secrets, etc.)
   - Establecer `NODE_ENV=production`

2. Construir la aplicación:

   ```bash
   # En Linux/Mac
   ./build.sh

   # O manualmente
   npm install
   npm run build:all
   ```

### Despliegue

1. Ejecutar el script de despliegue:

   ```bash
   # En Linux/Mac
   ./deploy.sh

   # En Windows PowerShell
   .\deploy.ps1
   ```

2. Iniciar el servidor:

   ```bash
   cd backend
   npm start
   ```

El servidor estará disponible en el puerto configurado (por defecto 3002) y servirá tanto la API en `/api` como el frontend estático.

### Despliegue en AWS (Futuro)

- **Backend:** EC2 con Node.js o AWS Lambda
- **Frontend:** S3 + CloudFront para archivos estáticos
- **Base de datos:** Supabase (PostgreSQL)

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

## 📚 Documentación

- [Frontend Migration Guide](./FRONTEND_MIGRATION.md)
- [Backend README](./backend/README.md)
- [Permissions Guide](./PERMISSIONS_GUIDE.md) - Sistema de permisos y roles

## 🔧 Stack Tecnológico

**Frontend:** React 18, TypeScript, Vite, Ant Design, Axios

**Backend:** Node.js, Express, TypeScript, JWT, bcrypt, Supabase (PostgreSQL + Storage)

This project is licensed under the [MIT License](LICENSE).

## 📁 Estructura del Proyecto

```bash
shucway-app/
├── backend/                 # API Node.js + Express
│   ├── src/
│   ├── package.json
│   ├── .env                 # Variables del servidor
│   ├── .env.example
│   └── node_modules/        # Dependencias del backend
├── frontend/                # Frontend React + Vite
│   ├── src/                 # Código fuente
│   ├── public/              # Archivos estáticos
│   ├── package.json         # Dependencias del frontend
│   ├── .env                 # Variables VITE_* del frontend
│   ├── .env.example
│   ├── vite.config.ts       # Configuración de Vite
│   ├── tailwind.config.js   # Configuración de Tailwind
│   └── node_modules/        # Dependencias del frontend
├── config/
│   └── shared.ts            # Constantes globales compartidas
├── node_modules/            # Solo concurrently para scripts del monorepo
├── package.json             # Scripts del monorepo
├── build.sh & deploy.sh     # Scripts de build y despliegue
└── README.md
```

### Organización de Archivos

- **Frontend**: Todo en `frontend/` con su propio `package.json`, `node_modules/`, `.env`, etc.
- **Backend**: Todo en `backend/` con su propio `package.json`, `node_modules/`, `.env`, etc.
- **Raíz**: Scripts del monorepo, configuración compartida, y `node_modules/` solo para `concurrently`.
- **Compartido**: Constantes globales en `config/shared.ts`.
