# DOCUMENTACIÓN TÉCNICA - SISTEMA DE BALANZAS AGROINDUSTRIALES

**Versión:** 1.0  
**Fecha:** 30 de marzo de 2026  
**Proyecto:** Balanza  

## 1. INTRODUCCIÓN

Esta documentación técnica describe la arquitectura, implementación y funcionamiento del Sistema de Gestión de Balanzas Agroindustriales. El sistema está diseñado para operar en entornos locales con acceso a red, permitiendo la gestión integral de operaciones de pesaje, control de calidad y generación de reportes.

## 2. ARQUITECTURA DEL SISTEMA

### 2.1 Arquitectura General

El sistema sigue una arquitectura cliente-servidor con separación clara entre frontend y backend:

```
┌─────────────────┐    HTTP/WebSocket    ┌─────────────────┐
│   Frontend      │◄──────────────────► │   Backend       │
│   (React)       │                     │   (Node.js)     │
│                 │                     │                 │
│ - UI/UX         │                     │ - API REST      │
│ - Dashboard     │                     │ - WebSockets    │
│ - Formularios   │                     │ - Autenticación │
└─────────────────┘                     └─────────────────┘
         │                                     │
         │                                     │
         ▼                                     ▼
┌─────────────────┐                     ┌─────────────────┐
│   Navegador     │                     │   PostgreSQL    │
│   Web           │                     │   Base de Datos │
└─────────────────┘                     └─────────────────┘
                                               │
                                               ▼
                                    ┌─────────────────┐
                                    │   Balanza       │
                                    │   Física        │
                                    │   (TCP/IP)      │
                                    └─────────────────┘
```

### 2.2 Componentes Principales

#### Backend (Node.js + Express)
- **Framework:** Express.js v4.18.2
- **Lenguaje:** JavaScript (ES Modules)
- **Base de Datos:** PostgreSQL v14+
- **Autenticación:** JWT (JSON Web Tokens)
- **WebSockets:** ws v8.19.0 para comunicación en tiempo real
- **File Upload:** Multer v2.1.1

#### Frontend (React + Vite)
- **Framework:** React v19.2.0
- **Build Tool:** Vite v7.2.4
- **UI Framework:** Tailwind CSS v4.1.18
- **Gráficos:** Recharts v3.8.0
- **Iconos:** Lucide React v0.563.0

#### Base de Datos
- **Motor:** PostgreSQL
- **Conexión:** pg v8.11.3 (node-postgres)
- **Pool de Conexiones:** Para manejo eficiente de conexiones

## 3. INSTALACIÓN Y CONFIGURACIÓN

### 3.1 Prerrequisitos

#### Requisitos del Sistema
- **SO:** Windows 10/11, Linux (Ubuntu 20.04+), macOS
- **Node.js:** v16 o superior (recomendado v18+)
- **PostgreSQL:** v14 o superior
- **Navegador:** Chrome 90+, Firefox 88+, Edge 90+
- **RAM:** 4GB mínimo, 8GB recomendado
- **CPU:** Dual-core 2.5GHz+
- **Almacenamiento:** 50GB disponible

#### Hardware Adicional
- Balanza digital con interfaz TCP/IP
- Cámaras IP (opcional)

### 3.2 Instalación del Backend

1. **Instalar dependencias:**
   ```bash
   cd Backend
   npm install
   ```

2. **Configurar variables de entorno:**
   Crear archivo `.env` en la raíz del backend:
   ```env
   DB_USER=postgres
   DB_PASSWORD=tu_password
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=Balanza

   NODE_ENV=development
   PORT=3000

   # Configuración de balanza
   BALANZA_IP=192.168.1.100
   BALANZA_PORT=3000

   # JWT Secret (generar uno seguro)
   JWT_SECRET=tu_jwt_secret_seguro
   ```

3. **Crear base de datos:**
   ```bash
   # Crear base de datos
   createdb -U postgres Balanza

   # Ejecutar script SQL (asegúrate de tener balanza_db_improved.sql)
   psql -U postgres -d Balanza -f balanza_db_improved.sql
   ```

4. **Iniciar servidor:**
   ```bash
   # Desarrollo
   npm run dev

   # Producción
   npm start
   ```

### 3.3 Instalación del Frontend

1. **Instalar dependencias:**
   ```bash
   cd Frontend
   npm install
   ```

2. **Configurar proxy (desarrollo):**
   El archivo `vite.config.js` ya está configurado para proxy a `localhost:3000`.

3. **Iniciar servidor de desarrollo:**
   ```bash
   npm run dev  # Puerto 5173 por defecto
   ```

4. **Build para producción:**
   ```bash
   npm run build
   # Los archivos se generan en Frontend/dist
   ```

### 3.4 Configuración de Producción

Para despliegue en producción:

1. **Build del frontend:**
   ```bash
   cd Frontend
   npm run build
   ```

2. **Configurar backend para servir frontend:**
   El backend ya está configurado para servir archivos estáticos desde `Frontend/dist`.

3. **Configurar firewall:**
   - Abrir puerto 3000 (o el configurado) en el firewall
   - Permitir conexiones entrantes

## 4. API REST

### 4.1 Autenticación

Todas las rutas protegidas requieren:
- **Header:** `Authorization: Bearer <jwt_token>`
- **Headers adicionales:** `x-user-id` y `x-username` (automáticos desde frontend)

### 4.2 Endpoints Principales

#### Usuarios (`/api/usuarios`)
- `POST /api/usuarios/login` - Login (público)
- `GET /api/usuarios` - Listar usuarios
- `GET /api/usuarios/:id` - Obtener usuario por ID
- `POST /api/usuarios` - Crear usuario
- `PUT /api/usuarios/:id` - Actualizar usuario
- `DELETE /api/usuarios/:id` - Eliminar usuario

#### Pesadas (`/api/pesadas`)
- `GET /api/pesadas` - Listar pesadas
- `GET /api/pesadas/agrupadas` - Pesadas agrupadas por operación
- `GET /api/pesadas/ticket/:ticketId` - Pesadas por ticket
- `GET /api/pesadas/activa/:patente` - Pesada activa por patente
- `GET /api/pesadas/:id` - Obtener pesada por ID
- `POST /api/pesadas` - Crear pesada (con archivo PDF opcional)
- `PUT /api/pesadas/:id` - Actualizar pesada
- `PUT /api/pesadas/operacion/:operacionId` - Actualizar PDF de operación
- `DELETE /api/pesadas/:id` - Eliminar pesada

#### Otras Entidades
- **Choferes:** `/api/choferes` (CRUD completo)
- **Productores:** `/api/productores` (CRUD completo)
- **Productos:** `/api/productos` (CRUD completo)
- **Transportes:** `/api/transportes` (CRUD completo)
- **Vehículos:** `/api/vehiculos` (CRUD completo)
- **Provincias:** `/api/provincias` (solo lectura)
- **Localidades:** `/api/localidades` (solo lectura)

#### Reportes (`/api/reportes`)
- `GET /api/reportes` - Listar reportes históricos
- `POST /api/reportes` - Crear reporte
- `GET /api/reportes/:id` - Obtener reporte por ID

#### Métricas (`/api/metricas`)
- `GET /api/metricas/dashboard` - Datos para dashboard

#### Cámaras (`/api/camaras`)
- `GET /api/camaras` - Listar cámaras
- `POST /api/camaras` - Capturar imagen

#### Backups (`/api/backup`)
- `POST /api/backup` - Crear backup de base de datos

### 4.3 Códigos de Respuesta

- **200:** Éxito
- **201:** Creado
- **400:** Error de solicitud
- **401:** No autorizado
- **403:** Prohibido (sin permisos)
- **404:** No encontrado
- **500:** Error interno del servidor

### 4.4 Formato de Respuestas

Todas las respuestas siguen el formato:
```json
{
  "success": true|false,
  "data": {...},
  "error": "mensaje de error",
  "count": 123
}
```

## 5. BASE DE DATOS

### 5.1 Esquema Principal

#### Tabla: `usuario`
```sql
CREATE TABLE usuario (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol VARCHAR(50) NOT NULL,
  nombre VARCHAR(100),
  apellido VARCHAR(100),
  email VARCHAR(100),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Tabla: `pesada`
```sql
CREATE TABLE pesada (
  id SERIAL PRIMARY KEY,
  operacion_id INTEGER REFERENCES operacion_pesaje(id),
  tipo VARCHAR(20) CHECK (tipo IN ('ENTRADA', 'SALIDA')),
  bruto DECIMAL(10,2),
  tara DECIMAL(10,2),
  neto DECIMAL(10,2),
  fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  chofer_id INTEGER REFERENCES chofer(id),
  producto_id INTEGER REFERENCES producto(id),
  productor_id INTEGER REFERENCES productor(id),
  transporte_id INTEGER REFERENCES transporte(id),
  observaciones TEXT
);
```

#### Otras Tablas Principales
- `chofer` - Información de choferes
- `productor` - Datos de productores
- `producto` - Catálogo de productos
- `transporte` - Empresas de transporte
- `vehiculo` - Vehículos registrados
- `operacion_pesaje` - Operaciones de pesaje
- `ticket` - Tickets generados
- `reporte` - Reportes históricos
- `provincia` y `localidad` - Datos geográficos

### 5.2 Conexión

La conexión se maneja mediante un pool de conexiones en `config/database.js`:
```javascript
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  max: 20, // máximo de conexiones
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export default pool;
```

## 6. AUTENTICACIÓN Y AUTORIZACIÓN

### 6.1 JWT Authentication

- **Login:** `POST /api/usuarios/login` con `{username, password}`
- **Token:** Se devuelve en respuesta de login
- **Validación:** Middleware `requireAuth` valida token en header `Authorization`

### 6.2 Sistema de Roles y Permisos

Permisos definidos en `config/rolesConfig.js`:
- `PESAJE_VIEW`, `PESAJE_CREATE`, `PESAJE_UPDATE`, `PESAJE_DELETE`
- `USUARIOS_VIEW`, `USUARIOS_CREATE`, etc.
- `ADMIN` - acceso completo

### 6.3 Middleware de Autorización

```javascript
// authMiddleware.js
export const requireAuth = (req, res, next) => {
  // Validar JWT token
};

export const requirePermission = (permission) => {
  return (req, res, next) => {
    // Validar permisos del usuario
  };
};
```

## 7. WEBSOCKETS

### 7.1 Conexión

- **URL:** `ws://localhost:3000` (o IP del servidor)
- **Protocolo:** WebSocket nativo

### 7.2 Mensajes

#### Desde Servidor
```json
{
  "type": "STATUS",
  "status": "CONNECTED|DISCONNECTED",
  "currentWeight": 1500.50
}
```

#### Desde Cliente
- El cliente principalmente recibe actualizaciones del peso en tiempo real

## 8. INTEGRACIÓN CON BALANZA

### 8.1 Configuración

Variables de entorno:
```env
BALANZA_IP=192.168.1.100
BALANZA_PORT=3000
```

### 8.2 Protocolo

- **Conexión:** TCP/IP persistente
- **Protocolo:** Comunicación por sockets con buffer de datos
- **Formato:** Datos crudos de la balanza (peso en tiempo real)

### 8.3 Manejo de Conexión

```javascript
// server.js
const BALANZA_IP = process.env.BALANZA_IP;
const BALANZA_PORT = parseInt(process.env.BALANZA_PORT);

const client = net.createConnection(BALANZA_PORT, BALANZA_IP);
// Manejo de datos, reconexión automática, etc.
```

## 9. DESPLIEGUE

### 9.1 Desarrollo

```bash
# Terminal 1 - Backend
cd Backend && npm run dev

# Terminal 2 - Frontend
cd Frontend && npm run dev
```

### 9.2 Producción

```bash
# Build frontend
cd Frontend && npm run build

# Iniciar backend (sirve frontend automáticamente)
cd Backend && npm start
```

### 9.3 Acceso en Red Local

- Backend escucha en `0.0.0.0:3000`
- Frontend accesible en `http://[IP_SERVIDOR]:3000`
- Configurar firewall para permitir puerto 3000

## 10. MONITOREO Y LOGGING

### 10.1 Logs del Servidor

- **Consola:** Logs básicos de Express
- **Errores:** Se registran en consola con `console.error`
- **Conexión BD:** Verificación en `/api/health`

### 10.2 Endpoint de Health Check

`GET /api/health` - Verifica:
- Conexión a PostgreSQL
- Estado de la balanza
- Timestamp del servidor

## 11. SEGURIDAD

### 11.1 Medidas Implementadas

- **Autenticación JWT** con expiración
- **Control de acceso** basado en roles
- **Validación de entrada** en APIs
- **CORS configurado** para origen local
- **Passwords hasheados** (bcrypt recomendado)

### 11.2 Recomendaciones Adicionales

- Cambiar JWT_SECRET por uno seguro
- Usar HTTPS en producción
- Configurar firewall restrictivo
- Actualizar dependencias regularmente

## 12. TROUBLESHOOTING

### 12.1 Problemas Comunes

#### Error de conexión a BD
- Verificar credenciales en `.env`
- Asegurar que PostgreSQL esté ejecutándose
- Verificar puerto y host

#### Frontend no carga
- Verificar que backend esté ejecutándose
- Comprobar configuración de proxy en `vite.config.js`
- Verificar CORS

#### Balanza no conecta
- Verificar IP y puerto en `.env`
- Comprobar conectividad de red
- Revisar logs del servidor

#### Errores de permisos
- Verificar rol del usuario
- Comprobar configuración de permisos

### 12.2 Logs y Debugging

- **Backend:** Logs en consola del terminal
- **Frontend:** Herramientas de desarrollo del navegador
- **Base de datos:** Consultas directas con `psql`

## 13. MANTENIMIENTO

### 13.1 Backups

- **Automáticos:** Endpoint `/api/backup` para respaldo de BD
- **Manual:** Usar `pg_dump` para PostgreSQL
- **Almacenamiento:** Carpeta `Backend/backups/`

### 13.2 Actualizaciones

- **Dependencias:** `npm update` en backend y frontend
- **Base de datos:** Scripts de migración si cambian esquemas
- **Configuración:** Actualizar `.env` según cambios

---

**Fin de la Documentación Técnica**</content>
