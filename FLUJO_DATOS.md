# 🔗 Flujo de Datos - Frontend ↔ Backend

## 📊 Arquitectura General

```
┌─────────────────┐
│     Frontend    │
│   React + Vite │
└────────┬────────┘
         │ HTTP Requests
         │ (fetch API)
         ▼
┌─────────────────┐
│     Backend     │
│  Express.js     │
└────────┬────────┘
         │ SQL Queries
         │ (pg/PostgreSQL)
         ▼
┌─────────────────┐
│   PostgreSQL    │
│   Balanza DB    │
└─────────────────┘
```

---

## 🔄 Flujos de Datos

### 1️⃣ **Cargar Datos (GET)**

#### Flujo: Frontend pide Choferes

```
Frontend                    Backend                 Base de Datos
   │                          │                           │
   │─── GET /api/choferes ───>│                           │
   │                          │─── SELECT * FROM chofer ─>│
   │                          │<─── rows returned ────────│
   │<─── JSON response ────────│                           │
   │                          │                           │
```

**Código Frontend:**
```javascript
// En useGestionAPI.js
const response = await fetch(`${API_BASE_URL}/api/choferes`);
const result = await response.json();
// result.data contiene array de choferes
```

**Código Backend:**
```javascript
// En choferesController.js
export const getChoferes = async (req, res) => {
  const result = await pool.query(
    `SELECT id, codigo, apellido_nombre, ... FROM chofer WHERE activo = true`
  );
  res.json({ success: true, data: result.rows });
};
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "codigo": "CHO001",
      "apellido_nombre": "García Juan",
      "tipo_documento": "DNI",
      "nro_documento": "12345678",
      "nacionalidad": "Argentina",
      "activo": true,
      "created_at": "2024-01-15T10:30:00"
    }
  ]
}
```

---

### 2️⃣ **Crear Registro (POST)**

#### Flujo: Frontend crea un Chofer

```
Frontend                    Backend                 Base de Datos
   │                          │                           │
   │─ POST /api/choferes ───>│                           │
   │  (formData JSON)         │─ INSERT INTO chofer ───>│
   │                          │                     <─ OK ─│
   │<─ JSON con ID ───────────│                           │
   │                          │                           │
```

**Código Frontend:**
```javascript
// En useGestionAPI.js / ModalForm
const response = await fetch(`${API_BASE_URL}/api/choferes`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formData)
});
```

**Request Body:**
```json
{
  "codigo": "CHO002",
  "apellido_nombre": "Pérez María",
  "tipo_documento": "DNI",
  "nro_documento": "87654321",
  "nacionalidad": "Argentina"
}
```

**Código Backend:**
```javascript
export const createChofer = async (req, res) => {
  const { codigo, apellido_nombre, ... } = req.body;
  const result = await pool.query(
    `INSERT INTO chofer (...) VALUES (...) RETURNING *`
  );
  res.status(201).json({ 
    success: true, 
    data: result.rows[0] 
  });
};
```

---

### 3️⃣ **Actualizar Registro (PUT)**

#### Flujo: Frontend edita un Chofer

```
Frontend                    Backend                 Base de Datos
   │                          │                           │
   │─ PUT /api/choferes/1 ──>│                           │
   │  (formData actualizado)  │─ UPDATE chofer SET... ─>│
   │                          │<─ OK ─────────────────────│
   │<─ Chofer actualizado ────│                           │
```

**Código Frontend:**
```javascript
const response = await fetch(`${API_BASE_URL}/api/choferes/1`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formData)
});
```

---

### 4️⃣ **Eliminar Registro (DELETE)**

#### Flujo: Frontend elimina un Chofer (Soft Delete)

```
Frontend                    Backend                 Base de Datos
   │                          │                           │
   │─ DELETE /api/choferes/1─>│                           │
   │                          │─ UPDATE chofer ──────────>│
   │                          │  SET activo = false       │
   │                          │<─ OK ─────────────────────│
   │<─ Confirmación ───────────│                           │
```

**Importante:** No se elimina la fila, solo se marca como `activo = false`

---

### 5️⃣ **Crear Ticket + Pesadas**

#### Flujo Complejo: PesadaForm crea ticket y pesadas

```
Frontend (PesadaForm)          Backend                    Base de Datos
   │                             │                            │
   │─ 1. POST /api/tickets ───>│                            │
   │     (chofer, producto...)  │─ INSERT INTO ticket ─────>│
   │                             │<─ ticket { id: 5 } ───────│
   │<─ ticket response ──────────│                            │
   │                             │                            │
   │─ 2. POST /api/pesadas ────>│                            │
   │     (ticket_id: 5, BRUTO)  │─ INSERT INTO pesada ──────>│
   │                             │<─ OK ─────────────────────│
   │                             │                            │
   │─ 3. POST /api/pesadas ────>│                            │
   │     (ticket_id: 5, TARA)   │─ INSERT INTO pesada ──────>│
   │                             │ TRIGGER updates ticket ──>│
   │                             │<─ OK ─────────────────────│
   │<─ Confirmación ─────────────│                           │
```

**Request 1 - Crear Ticket:**
```json
POST /api/tickets
{
  "balanza_id": 1,
  "chofer_id": 2,
  "productor_id": 1,
  "transporte_id": 1,
  "producto_id": 3,
  "vehiculo_id": 5,
  "operario_id": 1,
  "nro_remito": "001-00001",
  "observaciones": ""
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "numero_ticket": 1001,
    "estado": "ABIERTO",
    ...
  }
}
```

**Request 2 & 3 - Crear Pesadas:**
```json
POST /api/pesadas
{
  "ticket_id": 5,
  "tipo": "BRUTO",
  "peso": 5000.50,
  "operario_id": 1,
  "observaciones": ""
}
```

---

## 🔐 Estados y Validaciones

### Validaciones Frontend

**En `useGestionAPI.js`:**
```javascript
// Validar campos requeridos
if (!formData.codigo || !formData.apellido_nombre) {
  throw new Error('Campos requeridos faltantes');
}

// Confirmar antes de eliminar
if (!window.confirm('¿Estás seguro?')) return;
```

**En `PesadaForm.jsx`:**
```javascript
// Validar peso positivo
if (peso <= 0) throw new Error('Peso debe ser positivo');

// Validar BRUTO + TARA
if (!tieneBruto || !tieneTara) {
  throw new Error('Requiere BRUTO y TARA');
}
```

### Validaciones Backend

**En `choferesController.js`:**
```javascript
if (!apellido_nombre) {
  return res.status(400).json({
    success: false,
    error: 'El nombre del chofer es requerido'
  });
}
```

**En `pesadasController.js`:**
```javascript
if (peso <= 0) {
  return res.status(400).json({
    success: false,
    error: 'El peso debe ser positivo'
  });
}
```

**En BD (Constraint):**
```sql
CONSTRAINT chk_peso_positivo CHECK (peso > 0)
```

### Validaciones BD (Triggers)

**Trigger para validar pesadas:**
```sql
-- Cuando se cierra un ticket, verifica que tenga BRUTO y TARA
CREATE TRIGGER trg_validar_pesadas
BEFORE UPDATE ON ticket
FOR EACH ROW
WHEN (OLD.estado IS DISTINCT FROM NEW.estado)
EXECUTE FUNCTION fn_validar_pesadas();
```

---

## 🔍 Ejemplo Completo: Crear Chofer

### Paso 1: Usuario hace clic en "Agregar"
```javascript
// En GestionApp.jsx
<ActionBar 
  onAgregar={() => currentGestion.abrirModal()}
/>
```

### Paso 2: Modal se abre
```javascript
// En useGestionAPI.js
const abrirModal = (item = null) => {
  setModal({ abierto: true, item });
};
```

### Paso 3: Usuario completa formulario
```javascript
// En ModalForm.jsx
<InputField
  label="Nombre"
  value={formData.apellido_nombre}
  onChange={(valor) => onFormChange('apellido_nombre', valor)}
/>
```

### Paso 4: Usuario presiona "Guardar"
```javascript
// En ModalForm.jsx
<button onClick={onGuardar}>Guardar</button>
```

### Paso 5: Frontend envía datos
```javascript
// En useGestionAPI.js
const guardarItem = async () => {
  const response = await fetch(
    `http://localhost:3000/api/choferes`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    }
  );
  const result = await response.json();
  setItems([...items, result.data]);
  setSuccess('Chofer creado exitosamente');
};
```

### Paso 6: Backend procesa
```javascript
// En choferesController.js
const result = await pool.query(
  'INSERT INTO chofer (...) VALUES (...) RETURNING *'
);
res.status(201).json({
  success: true,
  data: result.rows[0]
});
```

### Paso 7: BD inserta registro
```sql
INSERT INTO chofer (codigo, apellido_nombre, ..., activo)
VALUES ('CHO003', 'López Carlos', ..., true)
RETURNING *;
```

### Paso 8: Frontend recibe y actualiza UI
```javascript
// El array de items se actualiza automáticamente
// La tabla se re-renderiza con el nuevo chofer
// Se muestra mensaje de éxito
```

---

## 🚨 Manejo de Errores

### Flujo de Error

```
Frontend Error                         Backend Error
   │                                      │
   │─ Enviar request ────────────>      │
   │                                    │─ Validar datos
   │                                    │─ Ejecutar query
   │                                    │<─ Error SQL o lógica
   │                                    │
   │                          <─ res.status(400/500)
   │<─ Error JSON ──────────────────────│
   │                                    │
   │─ Mostrar en AlertBox ──────────>  │
   │                                    │
```

**Ejemplo:**

```javascript
// Frontend detecta error
try {
  const response = await fetch(...);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error);
  }
} catch (err) {
  setError(err.message);  // "El CUIT ya existe"
}
```

```javascript
// Backend retorna error
const result = await pool.query(...);
if (result.rows.length === 0) {
  return res.status(404).json({
    success: false,
    error: 'Chofer no encontrado'
  });
}
```

---

## 📱 Estados de Carga

```javascript
// En useGestionAPI.js
const [loading, setLoading] = useState(false);

const guardarItem = async () => {
  setLoading(true);      // ← Muestra spinner
  try {
    // Hacer request
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);   // ← Oculta spinner
  }
};
```

**UI refleja loading:**
```javascript
// En ModalForm.jsx
<button disabled={loading}>
  {loading ? 'Guardando...' : 'Guardar'}
</button>

<input disabled={loading} /> // Deshabilitados
```

---

## 📊 Estructura de Respuestas API

### Éxito (200/201)
```json
{
  "success": true,
  "data": { ... },
  "message": "Operación exitosa",
  "count": 10
}
```

### Error (400/404/500)
```json
{
  "success": false,
  "error": "Descripción del error"
}
```

---

## 🔄 Re-rendering

**Cuando se guarda un chofer:**

```javascript
// El estado items se actualiza
setItems([...items, result.data]);

// React detecta el cambio
// GestionApp se re-renderiza
// TablaItems recibe nuevos items
// Tabla muestra el nuevo chofer
```

**El flujo es automático gracias a React:**

```javascript
const [items, setItems] = useState([]); // Estado

// Cuando items cambia:
// 1. React re-renderiza el componente
// 2. TablaItems recibe nuevos items como prop
// 3. Tabla muestra todos los items (viejo + nuevo)
// 4. Animaciones CSS hacen que se vea smooth
```

---

## 🎯 Resumen

| Acción | Request | Response | Actualización |
|--------|---------|----------|---|
| Cargar | `GET` | Array de registros | `setItems(data)` |
| Crear | `POST` | Nuevo registro | `[...items, newItem]` |
| Editar | `PUT` | Registro actualizado | `map()` reemplaza |
| Eliminar | `DELETE` | Confirmación | `filter()` elimina |

**Todo está conectado automáticamente through React's reactive system!** ⚡

---

¡El flujo de datos es bidireccional y automático! 🔁
