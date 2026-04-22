# Sistema Balanza — Documentación Técnica Actual

> Última actualización: 2026-04-22

---

## Índice

1. [Stack Tecnológico](#stack)
2. [Arquitectura General](#arquitectura)
3. [Base de Datos](#base-de-datos)
4. [Roles y Permisos](#roles-y-permisos)
5. [API Endpoints](#api-endpoints)
6. [Flujo de Pesadas](#flujo-de-pesadas)
7. [WebSocket — Balanza en Tiempo Real](#websocket)
8. [Cámaras / NVR](#camaras)
9. [Archivos y Documentos](#archivos)
10. [Frontend](#frontend)
11. [Variables de Entorno](#variables-de-entorno)
12. [Estructura de Carpetas](#estructura-de-carpetas)

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | Node.js + Express 4.18 |
| Base de datos | PostgreSQL 18 |
| Driver DB | `pg` 8.11 (raw SQL, sin ORM) |
| WebSocket | `ws` 8.19 |
| Archivos | Multer 2.1 |
| Frontend | React 19 + Vite 7 |
| Estilos | Tailwind CSS 4 |
| Iconos | Lucide React |
| Gráficos | Recharts |

---

## Arquitectura

```
Cliente (Browser)
    │
    ├── HTTP  ──► Express (puerto 3000)
    │                ├── /api/*         → Controllers
    │                ├── /capturas/*    → Fotos NVR (disco)
    │                ├── /documentos/*  → PDFs subidos (disco)
    │                └── /*             → Frontend/dist (React build)
    │
    └── WS   ──► WebSocket Server (mismo puerto 3000)
                     └── Datos balanza en tiempo real

Express
    └── PostgreSQL (pool de conexiones)
         └── Database: balanza

Backend
    └── TCP Socket ──► Hardware Balanza (IP:Puerto configurable desde DB)
```

El backend sirve el frontend compilado. En desarrollo, Vite corre en puerto 5173 con proxy hacia 3000.

---

## Base de Datos

### Enums

| Enum | Valores |
|------|---------|
| `rol_enum` | admin, gerente, restriccion, balancero, subalancero |
| `tipo_pesada_enum` | BRUTO, TARA |
| `estado_ticket_enum` | ABIERTO, CERRADO, ANULADO |
| `tipo_vehiculo_enum` | CHASIS, SEMI_REMOLQUE, FURGON, CAMION_TANQUE, CHASIS_ACOPLADO, JAULA_DOBLE, BATEA, OTRO |
| `tipo_dispositivo_enum` | grabadora, balanza |
| `marca_dispositivo_enum` | hikvision, dahua |

### Tablas

#### `usuario`
| Columna | Tipo | Notas |
|---------|------|-------|
| id | serial PK | |
| username | varchar(50) | unique |
| password_hash | text | |
| rol | rol_enum | default: gerente |
| localidad_id | int FK | → localidad |
| activo | boolean | default: true |
| created_at, updated_at | timestamp | |

#### `chofer`
| Columna | Tipo | Notas |
|---------|------|-------|
| id | serial PK | |
| apellido_nombre | varchar(150) | not null, unique |
| codigo | varchar(50) | unique |
| tipo_documento | varchar(20) | |
| nro_documento | varchar(30) | unique |
| nacionalidad | varchar(50) | |
| activo | boolean | default: true |

#### `productor`
| Columna | Tipo |
|---------|------|
| id | serial PK |
| nombre | varchar(150) not null unique |
| codigo | varchar(50) unique |
| activo | boolean |

#### `producto`
| Columna | Tipo |
|---------|------|
| id | serial PK |
| nombre | varchar(150) not null unique |
| codigo | varchar(50) unique |
| activo | boolean |

#### `transporte`
| Columna | Tipo |
|---------|------|
| id | serial PK |
| nombre | varchar(150) not null unique |
| codigo | varchar(50) unique |
| cuit | varchar(20) unique |
| activo | boolean |

#### `vehiculo`
| Columna | Tipo | Notas |
|---------|------|-------|
| id | serial PK | |
| patente | varchar(15) | not null, unique |
| patente_acoplado | varchar(15) | |
| tipo_vehiculo | tipo_vehiculo_enum | not null |
| activo | boolean | |
| observaciones | text | |

#### `provincia` / `localidad`
- `provincia`: id, nombre (unique)
- `localidad`: id, nombre, provincia_id FK — unique(nombre, provincia_id)

#### `operacion_pesaje`
Agrupa par BRUTO + TARA de un mismo vehículo.

| Columna | Tipo | Notas |
|---------|------|-------|
| id | serial PK | |
| vehiculo_patente | varchar(15) | FK → vehiculo.patente CASCADE |
| sentido | varchar(10) | INGRESO \| SALIDA |
| abierta | boolean | default: true |
| created_at | timestamp | |

- **Constraint único:** solo una operación abierta por patente (`vehiculo_patente WHERE abierta=true`)

#### `pesada` ← tabla principal
| Columna | Tipo | Notas |
|---------|------|-------|
| id | serial PK | |
| operacion_id | int | FK → operacion_pesaje CASCADE |
| tipo | tipo_pesada_enum | BRUTO \| TARA |
| peso | numeric(12,2) | >= 0 |
| chofer_id | int | FK → chofer |
| productor_id | int | FK → productor |
| transporte_id | int | FK → transporte |
| producto_id | int | FK → producto |
| vehiculo_patente | varchar(15) | FK → vehiculo CASCADE |
| neto | numeric(12,2) | calculado por trigger |
| fecha_hora | timestamp | default now() |
| balancero | text | nombre del operador |
| nro_remito | text | |
| ruta | varchar(255) | path al PDF |
| fotos | jsonb | array de capturas de cámaras |
| es_contenedor | boolean | |
| nro_contenedor | varchar(100) | obligatorio si es_contenedor=true |
| peso_vgm | integer | kg |
| tara_contenedor | numeric(12,2) | kg |
| cantidad_bultos | integer | |
| nro_proforma | varchar(100) | |
| nro_permiso_embarque | varchar(100) | |
| created_at | timestamp | |

- **Constraint único:** una sola pesada por operación por tipo `(operacion_id, tipo)`
- **Trigger `calcular_neto()`:** cuando la operación tiene BRUTO y TARA → calcula `neto = BRUTO - TARA`, cierra operación (`abierta = false`)

#### `ticket`
| Columna | Tipo |
|---------|------|
| id | serial PK |
| numero_ticket | bigint unique auto-increment |
| estado | estado_ticket_enum (default: ABIERTO) |
| observaciones | text |
| cantidad_ops | int |
| created_at, updated_at | timestamp |

#### `ticket_operacion` (junction)
- ticket_id FK + operacion_id FK — unique(ticket_id, operacion_id)

#### `reporte`
| Columna | Tipo |
|---------|------|
| id | serial PK |
| numero_reporte | bigint unique |
| cantidad_pesadas | int |
| total_bruto, total_tara, total_neto | numeric(14,2) |
| pesadas_data | jsonb |
| observaciones | text |

#### `configuracion_dispositivos`
| Columna | Tipo | Notas |
|---------|------|-------|
| id | serial PK | |
| tipo_dispositivo | tipo_dispositivo_enum | unique por tipo |
| ip | varchar(15) | |
| puerto | int | |
| usuario | varchar(100) | |
| contraseña | varchar(255) | |
| activo | boolean | |
| marca | marca_dispositivo_enum | solo para grabadora |

---

## Roles y Permisos

### Roles disponibles

| Rol | Descripción |
|-----|-------------|
| `admin` | Acceso total a todo |
| `gerente` | ABM maestros + reportes + tickets + dashboard. Sin pesaje |
| `restriccion` | Rol logística — mismos permisos que gerente pero sin acceso a pesaje |
| `balancero` | Solo pesaje (BRUTO/TARA). Sin ingreso manual de peso |
| `subalancero` | Pesaje + ingreso manual de peso + backup |

### Mapa de permisos por rol

| Permiso | admin | gerente | restriccion (logística) | balancero | subalancero |
|---------|-------|---------|------------------------|-----------|-------------|
| pesaje:view/create/update | ✅ | ❌ | ❌ | ✅ | ✅ |
| pesaje:delete | ✅ | ❌ | ❌ | ❌ | ❌ |
| **pesaje:manual** | ✅ | ❌ | ❌ | ❌ | ✅ |
| usuarios:* | ✅ | view | view | ❌ | ❌ |
| choferes/productores/productos/transportes/vehiculos:CRUD | ✅ | ✅ | ✅ | view | view |
| reportes:view/create | ✅ | ✅ | ✅ | ❌ | ❌ |
| dashboard:view | ✅ | ✅ | ✅ | ❌ | ❌ |
| tickets:view/create/close | ✅ | ✅ | ✅ | ❌ | ❌ |
| camaras:view/capture | ✅ | ✅ | ✅ | ✅ | ✅ |
| backup:manage | ✅ | ❌ | ❌ | ❌ | ✅ |

### Autenticación

- Login: `POST /api/usuarios/login` → devuelve `{ id, username, rol }`
- Se guarda en `localStorage` con key `balanza_user`
- Todas las requests incluyen headers: `x-user-id` y `x-username`
- Backend valida con middleware `requireAuth` / `optionalAuth` / `requirePermission`

---

## API Endpoints

Base URL: `http://localhost:3000/api`

### Autenticación
| Método | Ruta | Notas |
|--------|------|-------|
| POST | `/usuarios/login` | Sin auth. Body: `{ username, password }` |

### Pesadas ← núcleo del sistema
| Método | Ruta | Permiso |
|--------|------|---------|
| GET | `/pesadas` | PESAJE_VIEW — últimas 200 |
| GET | `/pesadas/agrupadas` | PESAJE_VIEW — paginado. Params: page, limit, sentido, fecha, mes, anio |
| GET | `/pesadas/activa/:patente` | PESAJE_VIEW — operación abierta para patente |
| GET | `/pesadas/ticket/:ticketId` | PESAJE_VIEW |
| GET | `/pesadas/:id` | PESAJE_VIEW |
| POST | `/pesadas` | PESAJE_CREATE — multipart/form-data |
| PUT | `/pesadas/:id` | PESAJE_UPDATE |
| PUT | `/pesadas/operacion/:operacionId` | PESAJE_UPDATE — actualiza PDF |
| DELETE | `/pesadas/operacion/:operacionId` | PESAJE_DELETE |
| POST | `/pesadas/operaciones/delete-masivo` | PESAJE_DELETE — body: `{ ids: [] }` |

**Campos POST /pesadas (form-data):**
```
vehiculo_patente   (requerido)
sentido            INGRESO | SALIDA (requerido)
peso               number (requerido, > 0)
chofer_id          int
productor_id       int
transporte_id      int
producto_id        int
balancero          text
nro_remito         text
es_manual          boolean — requiere permiso PESAJE_MANUAL
fotos              JSON string (array de capturas)
archivo            File PDF (opcional)
es_contenedor      boolean
nro_contenedor     text (requerido si es_contenedor=true)
peso_vgm           integer kg
tara_contenedor    numeric kg
cantidad_bultos    integer
nro_proforma       text
nro_permiso_embarque text
```

### Operaciones
| Método | Ruta | Notas |
|--------|------|-------|
| GET | `/operaciones` | Lista todas |
| GET | `/operaciones/abierta/:patente` | Operación abierta para patente |
| POST | `/operaciones/:id/cerrar` | Cierre manual |

### Maestros (mismo patrón para todos)
| Recurso | Ruta base | Permisos |
|---------|-----------|---------|
| Choferes | `/choferes` | CHOFERES_* |
| Productores | `/productores` | PRODUCTORES_* |
| Productos | `/productos` | PRODUCTOS_* |
| Transportes | `/transportes` | TRANSPORTES_* |
| Vehículos | `/vehiculos` | VEHICULOS_* |
| Provincias | `/provincias` | PROVINCIAS_* |
| Localidades | `/localidades` | LOCALIDADES_* |
| Usuarios | `/usuarios` | USUARIOS_* |

Todos soportan: `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`

Especial vehículos: `GET /vehiculos/select-list` (sin auth, para dropdowns)

### Tickets
| Método | Ruta |
|--------|------|
| GET | `/tickets` |
| GET | `/tickets/:id` |
| GET | `/tickets/estado/:estado` |
| GET | `/tickets/fecha/rango` |
| POST | `/tickets` |
| PUT | `/tickets/:id` |
| POST | `/tickets/:id/cerrar` |

### Métricas / Dashboard
| Método | Ruta |
|--------|------|
| GET | `/metricas/dashboard` |
| GET | `/metricas/por-fecha` |
| GET | `/metricas/comparativo-mensual` |

### Cámaras
| Método | Ruta | Notas |
|--------|------|-------|
| GET | `/camaras/config` | Devuelve canales activos detectados |
| GET | `/camaras/capturar-todo?patente=XXX` | Captura de todos los canales. Devuelve `{ status: "ok" \| "sin_camaras", archivos: [] }` |
| POST | `/camaras/limpiar-cache` | Fuerza re-detección de canales |

### Reportes
| Método | Ruta |
|--------|------|
| GET | `/reportes` |
| GET | `/reportes/:id` |
| POST | `/reportes` |
| DELETE | `/reportes/:id` |
| POST | `/reportes/delete-masivo` |

### Backup
| Método | Ruta | Permiso |
|--------|------|---------|
| GET | `/backup/list` | BACKUP_MANAGE |
| GET | `/backup/download/:filename` | BACKUP_MANAGE |
| POST | `/backup/trigger` | BACKUP_MANAGE |

### Sistema
| Método | Ruta |
|--------|------|
| GET | `/health` | Estado DB + scale |
| GET | `/config` | Config dispositivos |
| PUT | `/config/:tipo` | Actualizar config dispositivo |

---

## Flujo de Pesadas

```
Usuario ingresa patente
        │
        ▼
GET /pesadas/activa/:patente
        │
        ├── Sin operación abierta ──► Nueva operación
        │                              sentido = INGRESO → tipo = BRUTO
        │                              sentido = SALIDA  → tipo = TARA
        │
        └── Con operación abierta ──► Reutiliza operación
                                       tipo = opuesto al existente
                                       (si hay BRUTO → agrega TARA, viceversa)

POST /api/pesadas
        │
        ▼
INSERT pesada (operacion_id, tipo, peso, ...)
        │
        ▼
TRIGGER calcular_neto()
        │
        ├── Solo un tipo (BRUTO o TARA) → operación sigue ABIERTA
        │
        └── Ambos tipos presentes →
                neto = BRUTO - TARA
                operacion_pesaje.abierta = FALSE
                pesada.neto actualizado en ambas filas
```

**Reglas de negocio:**
- Un vehículo solo puede tener una operación abierta a la vez
- Ingreso de peso manual requiere rol `subalancero` o `admin`
- Si `es_contenedor = true`, `nro_contenedor` es obligatorio
- Los demás campos de contenedor (peso_vgm, tara_contenedor, cantidad_bultos, nro_proforma, nro_permiso_embarque) son opcionales

---

## WebSocket

Conexión en `ws://host:3000/ws`

**Mensajes del servidor al cliente:**

```json
// Estado de conexión con el hardware
{ "type": "STATUS", "status": "CONNECTED" | "DISCONNECTED", "currentWeight": 0 }

// Peso en tiempo real
{ "type": "WEIGHT", "weight": 15430, "ts": 1714000000000 }
```

El backend mantiene una conexión TCP al hardware de balanza. Cuando llegan datos, los broadcast a todos los clientes WS conectados. El frontend (`PesadaForm`) escucha y actualiza el display en tiempo real sin re-renderizar el formulario completo (usa `useRef` para el peso actual).

---

## Cámaras

**Hardware soportado:** Grabadoras Hikvision / Dahua vía protocolo RTSP/CGI

**Config en DB:** tabla `configuracion_dispositivos` con `tipo_dispositivo = 'grabadora'`

**Flujo de captura:**
1. Backend conecta a NVR vía digest auth HTTP
2. Detecta canales activos (`/cgi-bin/snapshot.cgi?channel=N`) — resultado cacheado 1 minuto
3. Descarga imagen JPEG por canal
4. Guarda en `Backend/capturas/{PATENTE}/{PATENTE}_cam{N}_{timestamp}.jpg`
5. Devuelve array de `{ canal, ruta }` al frontend
6. Frontend guarda rutas en `pesada.fotos` (JSONB)

**Sin grabadora conectada:**
- `GET /camaras/config` → `{ canales: [] }`
- `GET /camaras/capturar-todo` → `{ status: "sin_camaras", archivos: [] }`
- La pesada se registra igual, sin fotos

**URLs de acceso a capturas:** `/capturas/{PATENTE}/{filename}`

---

## Archivos

### PDFs (Carta de Porte / Remito)
- Campo form-data: `archivo`
- Solo acepta `application/pdf`
- Storage: `Backend/src/documentos/`
- Naming: `cpe-{timestamp}-{random}.pdf`
- DB: `pesada.ruta` → `documentos/{filename}`
- URL: `/documentos/{filename}`

### Fotos de cámaras
- Storage: `Backend/capturas/{PATENTE}/`
- DB: `pesada.fotos` → JSONB `[{ canal: 1, ruta: "PATENTE/file.jpg" }]`
- URL: `/capturas/{ruta}`

### Backups DB
- Generado con `pg_dump`
- Automático: domingo 3:00 AM
- Manual: `POST /api/backup/trigger`
- Storage: `Backend/backups/`
- Descarga: `GET /api/backup/download/:filename`

---

## Frontend

### Estructura de navegación

Sin router dedicado. Tabs controlados por estado en `GestionApp.jsx`:

| Tab | Componente | Permiso requerido |
|-----|-----------|------------------|
| dashboard | Dashboard.jsx | DASHBOARD_VIEW |
| pesada | PesadaForm.jsx | PESAJE_CREATE |
| pesadas | ReportePesadas.jsx | PESAJE_VIEW |
| choferes | TablaItems + ModalForm | CHOFERES_VIEW |
| productores | TablaItems + ModalForm | PRODUCTORES_VIEW |
| productos | TablaItems + ModalForm | PRODUCTOS_VIEW |
| transportes | TablaItems + ModalForm | TRANSPORTES_VIEW |
| vehiculos | TablaItems + ModalForm | VEHICULOS_VIEW |
| provincias | TablaItems + ModalForm | PROVINCIAS_VIEW |
| localidades | TablaItems + ModalForm | LOCALIDADES_VIEW |
| reportes-historial | ReportesHistorial.jsx | REPORTES_VIEW |
| configuracion | Configuracion.jsx | BACKUP_MANAGE |

### Componentes clave

**`PesadaForm.jsx`**
- Display balanza en tiempo real (sub-componente `BalanzaDisplay` memoizado, escucha WS)
- Peso via `useRef` para evitar re-renders
- Auto-completa campos si hay pesada activa para la patente
- Checkbox "Es Contenedor" — despliega 6 campos adicionales (nro_contenedor obligatorio)
- Captura fotos automática al registrar
- Upload PDF opcional
- Selector Ingreso/Salida (oculto si hay operación activa)

**`DetallePesadaModal.jsx`**
- Modal full-screen con info completa de operación
- Sección "Datos de Contenedor" visible solo si `es_contenedor = true`
- Galería de fotos de cámaras
- Link a PDF adjunto

**`ReportePesadas.jsx`**
- Lista agrupada por operación (infinite scroll, 50 por página)
- Filtros: sentido, fecha (hoy/mes/año), mes+año específico
- Abre `DetallePesadaModal` al clickear fila

### Hooks

| Hook | Función |
|------|---------|
| `usePermissions` | Verifica permisos del usuario logueado |
| `usePesadasInfinite` | Paginación infinita para lista de pesadas (50/página) |
| `useVehiculosInfinite` | Paginación infinita para vehículos con búsqueda |
| `useGestionAPI` | CRUD genérico (list, create, update, delete) para maestros |
| `useTheme` | Toggle dark/light, persiste en localStorage |

### Contextos

- **`AuthContext`** — usuario, login(), logout(), permisos, rol
- **`ThemeContext`** — isDark, toggle

---

## Variables de Entorno

### Backend (`.env`)
```env
PORT=3000
DB_USER=postgres
DB_PASSWORD=123
DB_HOST=localhost
DB_PORT=5432
DB_NAME=balanza
```

### Frontend (`.env`)
```env
VITE_API_URL=          # vacío = URLs relativas (recomendado en producción)
```

---

## Estructura de Carpetas

```
Balanza/
├── Backend/
│   ├── src/
│   │   ├── server.js                    ← entry point, Express + WS
│   │   ├── config/
│   │   │   ├── database.js              ← pool PostgreSQL
│   │   │   └── rolesConfig.js           ← PERMISSIONS, ROLES, ROLE_PERMISSIONS
│   │   ├── middleware/
│   │   │   └── authMiddleware.js        ← requireAuth, optionalAuth, requirePermission
│   │   ├── controllers/
│   │   │   ├── pesadasController.js     ← createPesada, getPesadasAgrupadas, ...
│   │   │   ├── camarasController.js     ← capturarTodo, detectarCanalesActivos
│   │   │   ├── usuariosController.js    ← authLogin, CRUD usuarios
│   │   │   └── ...resto de controladores
│   │   ├── routes/
│   │   │   ├── pesadas.js
│   │   │   ├── camaras.js
│   │   │   ├── usuarios.js
│   │   │   └── ...resto de rutas
│   │   ├── services/
│   │   │   └── balanzaService.js        ← TCP socket → hardware, broadcast WS
│   │   └── documentos/                  ← PDFs subidos
│   ├── capturas/                        ← Fotos de cámaras
│   └── backups/                         ← Respaldos pg_dump
│
├── Frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx                      ← LoginPage ↔ GestionApp
│   │   ├── GestionApp.jsx               ← Shell principal, tabs
│   │   ├── components/
│   │   │   ├── PesadaForm.jsx           ← Formulario de pesaje
│   │   │   ├── DetallePesadaModal.jsx   ← Modal detalle operación
│   │   │   ├── ReportePesadas.jsx       ← Lista agrupada + filtros
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Configuracion.jsx
│   │   │   ├── SearchableSelect.jsx
│   │   │   ├── TablaItems.jsx
│   │   │   ├── ModalForm.jsx
│   │   │   └── ...resto
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── ThemeContext.jsx
│   │   ├── hooks/
│   │   │   ├── usePermissions.js
│   │   │   ├── usePesadasInfinite.js
│   │   │   ├── useVehiculosInfinite.js
│   │   │   ├── useGestionAPI.js
│   │   │   └── useTheme.js
│   │   └── config/
│   │       ├── rolesConfig.js
│   │       ├── choferesConfig.js
│   │       ├── productoresConfig.js
│   │       └── ...resto de configs
│   └── dist/                            ← Build servido por Express
│
└── estructura.sql                       ← Schema completo DB (referencia)
```
