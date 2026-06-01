# Sistema Balanza — Opciones de Despliegue en Internet

> Fecha análisis: 2026-05-05

---

## Restricción crítica (leer primero)

El backend necesita acceso **directo por red** a:
- **Balanza física** → TCP socket (IP:puerto configurable en DB, tabla `configuracion_dispositivos`)
- **NVR / Cámaras** → HTTP digest auth (Hikvision/Dahua, mismo origen)

Estos dispositivos viven en la **red local física** (LAN del cliente). Ninguna opción cloud puede ignorar esto. Las dos opciones siguientes resuelven el problema de maneras distintas.

---

## Opción 1 — Cloudflare Tunnel

### Qué es

Cloudflare instala un agente (`cloudflared`) en la PC local que abre un túnel permanente saliente hacia los servidores de Cloudflare. El tráfico de internet entra por Cloudflare y llega al servidor local sin abrir puertos en el router.

### Arquitectura

```
Usuario remoto (browser)
        │
        ▼
Cloudflare Edge (HTTPS / dominio propio)
        │  túnel cifrado saliente
        ▼
cloudflared.exe (corre en PC local como servicio Windows)
        │
        ▼
localhost:3000  ←  Express + WebSocket + PostgreSQL
        │
        ├── TCP ──► Balanza física (LAN)
        └── HTTP ──► NVR Cámaras (LAN)
```

### Cambios de código necesarios

**Ninguno.** El sistema sigue corriendo exactamente igual que en local.

### Pasos de implementación

#### 1. Crear cuenta Cloudflare (gratis)
- Ir a cloudflare.com → crear cuenta free
- Agregar dominio propio (o comprar uno desde Cloudflare ~$10/año)

#### 2. Instalar cloudflared en la PC local

```powershell
# Descargar el instalador MSI desde:
# https://github.com/cloudflare/cloudflared/releases/latest
# Buscar: cloudflared-windows-amd64.msi

# Después de instalar, autenticar:
cloudflared tunnel login
```

#### 3. Crear el túnel

```powershell
cloudflared tunnel create balanza
# Guarda el tunnel-id y credencial JSON en C:\Users\<usuario>\.cloudflared\
```

#### 4. Crear archivo de configuración

Crear `C:\Users\<usuario>\.cloudflared\config.yml`:

```yaml
tunnel: <TUNNEL-ID-aqui>
credentials-file: C:\Users\<usuario>\.cloudflared\<TUNNEL-ID>.json

ingress:
  - hostname: balanza.tudominio.com
    service: http://localhost:3000
    originRequest:
      noTLSVerify: false
  - service: http_status:404
```

> **WebSocket:** cloudflared soporta upgrade HTTP→WS automáticamente. No requiere config extra.

#### 5. Agregar DNS en Cloudflare

```powershell
cloudflared tunnel route dns balanza balanza.tudominio.com
```

#### 6. Instalar como servicio Windows (arranque automático)

```powershell
cloudflared service install
# Inicia con Windows, no requiere login de usuario
```

#### 7. Iniciar / verificar

```powershell
cloudflared tunnel run balanza
# O via servicio:
Start-Service cloudflared
```

#### 8. Cambio en Frontend (único ajuste)

En `Frontend/.env` (producción) asegurarse:
```env
VITE_API_URL=
```
*(vacío = URLs relativas, correcto para producción)*

### Costos

| Item | Precio/mes |
|------|-----------|
| Cloudflare Tunnel | **$0** (plan free) |
| Dominio .com | ~$1.20 |
| **Total** | **~$1.20/mes** |

> Plan free de Cloudflare incluye: SSL automático, DDoS protection, hasta 50 workers. Para este sistema es más que suficiente.

### Ventajas

- Costo casi cero
- Sin cambios de código
- HTTPS automático (certificado SSL incluido)
- Balanza y cámaras siguen funcionando sin tocar nada
- Fácil de implementar (2-3 horas)

### Desventajas

- **Si la PC local se apaga → sistema caído**
- Depende de la conexión a internet del local
- Los archivos (fotos, PDFs, backups) viven solo en esa PC local
- No escala para múltiples sedes

### Cuándo usar esta opción

Sistema de una sola sede, presupuesto ajustado, PC local siempre encendida con buena conexión.

---

## Opción 3 — VPS en la nube + WireGuard VPN

### Qué es

El sistema completo corre en un servidor en la nube (VPS). La PC local corre solo WireGuard, que crea un túnel VPN entre el VPS y la red local. El VPS puede alcanzar la balanza y cámaras **como si estuviera en la misma red física**.

### Arquitectura

```
Usuario remoto (browser)
        │
        ▼
VPS Cloud (IP pública, puerto 443)
  ├── nginx (reverse proxy + SSL)
  ├── Node.js Express (puerto 3000)
  ├── PostgreSQL (localhost)
  └── Archivos: /capturas, /documentos, /backups
        │
        │  WireGuard VPN (túnel cifrado)
        ▼
PC Local (WireGuard client)
  └── Enruta la red local (192.168.1.0/24) hacia el VPS
        │
        ├── Balanza física (192.168.1.X:puerto)
        └── NVR Cámaras (192.168.1.X)
```

El backend en VPS ve la balanza y las cámaras igual que si estuviera en el local. Solo hay que actualizar las IPs en la tabla `configuracion_dispositivos`.

### Cambios de código necesarios

**Ninguno.** Solo cambios de configuración:
- IPs de balanza y cámaras en DB (si cambian en la LAN)
- Variables de entorno `.env` en VPS

### Proveedor recomendado: Hetzner Cloud

Mejor relación precio/rendimiento para Europa/Latinoamérica:

| Plan | vCPU | RAM | Disco | Precio/mes |
|------|------|-----|-------|-----------|
| CX22 | 2 shared | 4 GB | 40 GB NVMe | ~€3.79 (~$4.20) |
| CX32 | 4 shared | 8 GB | 80 GB NVMe | ~€5.77 (~$6.40) |

> Recomendado: **CX22** para empezar. Node.js + PostgreSQL + archivos medianos caben bien en 4 GB RAM.

Alternativas: DigitalOcean ($12/mes), Vultr ($12/mes), Linode ($12/mes) — más caros que Hetzner.

### Pasos de implementación

#### PARTE A — Preparar el VPS

```bash
# Conectarse al VPS (Ubuntu 24.04 LTS recomendado)
ssh root@IP_DEL_VPS

# Actualizar sistema
apt update && apt upgrade -y

# Instalar Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

# Instalar PostgreSQL
apt install -y postgresql postgresql-contrib

# Instalar nginx + certbot (SSL)
apt install -y nginx certbot python3-certbot-nginx

# Instalar PM2 (gestor de procesos Node.js)
npm install -g pm2

# Instalar WireGuard
apt install -y wireguard
```

#### PARTE B — Configurar PostgreSQL en VPS

```bash
# Crear usuario y base de datos
sudo -u postgres psql
```
```sql
CREATE USER balanza_user WITH PASSWORD 'password_seguro_aqui';
CREATE DATABASE balanza OWNER balanza_user;
\q
```

```bash
# Restaurar la base de datos desde backup local
# (Primero en la PC local: pg_dump -U postgres balanza > balanza_backup.sql)
# Copiar al VPS:
# scp balanza_backup.sql root@IP_DEL_VPS:/tmp/

psql -U balanza_user -d balanza < /tmp/balanza_backup.sql
```

#### PARTE C — Deployar el Backend

```bash
# Crear usuario de app (no root)
adduser balanza
su - balanza

# Crear estructura
mkdir -p ~/app/Backend/src
mkdir -p ~/app/Backend/capturas
mkdir -p ~/app/Backend/documentos
mkdir -p ~/app/Backend/backups

# Copiar código (desde PC local vía scp o git)
# Opción git: subir el proyecto a un repo privado y clonar
git clone <repo_url> ~/app

# O copiar directo:
# scp -r Backend/ root@IP_DEL_VPS:/home/balanza/app/
```

Crear `/home/balanza/app/Backend/.env`:
```env
PORT=3000
DB_USER=balanza_user
DB_PASSWORD=password_seguro_aqui
DB_HOST=localhost
DB_PORT=5432
DB_NAME=balanza
```

```bash
cd ~/app/Backend
npm install --production

# Compilar frontend
cd ~/app/Frontend
npm install
npm run build
# Copiar dist al Backend
cp -r dist/ ../Backend/dist/

# Iniciar con PM2
cd ~/app/Backend
pm2 start src/server.js --name balanza
pm2 startup  # configura arranque automático
pm2 save
```

#### PARTE D — Configurar nginx + SSL

Crear `/etc/nginx/sites-available/balanza`:
```nginx
server {
    listen 80;
    server_name balanza.tudominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;

        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeout para WebSocket
        proxy_read_timeout 86400s;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/balanza /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# SSL gratuito con Let's Encrypt
certbot --nginx -d balanza.tudominio.com
```

#### PARTE E — Configurar WireGuard en VPS

```bash
# Generar claves en VPS
wg genkey | tee /etc/wireguard/server_private.key | wg pubkey > /etc/wireguard/server_public.key
cat /etc/wireguard/server_public.key  # guardar este valor
```

Crear `/etc/wireguard/wg0.conf` en el VPS:
```ini
[Interface]
PrivateKey = <SERVER_PRIVATE_KEY>
Address = 10.0.0.1/24
ListenPort = 51820

# PC Local del cliente
[Peer]
PublicKey = <PC_LOCAL_PUBLIC_KEY>  # se genera en el paso F
AllowedIPs = 10.0.0.2/32, 192.168.1.0/24
# 192.168.1.0/24 = red local donde están balanza y cámaras
# Ajustar al rango real de la red local del cliente
```

```bash
# Habilitar IP forwarding en VPS
echo "net.ipv4.ip_forward=1" >> /etc/sysctl.conf
sysctl -p

# Habilitar WireGuard
systemctl enable wg-quick@wg0
systemctl start wg-quick@wg0
```

#### PARTE F — Configurar WireGuard en PC Local (Windows)

```powershell
# Descargar WireGuard para Windows desde wireguard.com
# Instalar y abrir la app

# En la app WireGuard → "Add Tunnel" → "Add empty tunnel"
# Se generan las claves automáticamente
# Copiar la Public Key → va al archivo wg0.conf del VPS en [Peer]
```

Configuración del túnel en Windows (pegar en la app):
```ini
[Interface]
PrivateKey = <PC_LOCAL_PRIVATE_KEY>  # generado automáticamente
Address = 10.0.0.2/24

[Peer]
PublicKey = <SERVER_PUBLIC_KEY>  # del paso E
Endpoint = IP_DEL_VPS:51820
AllowedIPs = 10.0.0.1/32
PersistentKeepalive = 25
```

> **Nota:** `AllowedIPs = 10.0.0.1/32` — solo rutea tráfico hacia el VPS por el túnel, no todo internet. La PC sigue navegando normal.

```powershell
# Habilitar IP forwarding en Windows (para que el VPS llegue a la LAN)
# Ejecutar como Administrador:
Set-NetIPInterface -Forwarding Enabled
# O en Regedit:
# HKLM\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters → IPEnableRouter = 1
```

#### PARTE G — Activar el túnel y verificar

```powershell
# Windows: activar el túnel en la app WireGuard (botón Activate)
# Configurar para iniciar con Windows
```

```bash
# Verificar desde VPS que llega a la red local
ping 192.168.1.X  # IP de la balanza o una cámara
```

#### PARTE H — Actualizar config en DB

```sql
-- En PostgreSQL del VPS, actualizar IPs de dispositivos
-- (solo si cambiaron respecto a lo que tenía la DB local)
UPDATE configuracion_dispositivos 
SET ip = '192.168.1.X'  -- IP real de la balanza en la red local
WHERE tipo_dispositivo = 'balanza';

UPDATE configuracion_dispositivos 
SET ip = '192.168.1.Y'  -- IP real del NVR
WHERE tipo_dispositivo = 'grabadora';
```

### Costos

| Item | Precio/mes |
|------|-----------|
| VPS Hetzner CX22 (4GB RAM) | ~$4.50 |
| Dominio .com | ~$1.20 |
| SSL (Let's Encrypt) | **$0** |
| WireGuard | **$0** |
| **Total** | **~$5.70–$8/mes** |

> Si se necesita más disco para fotos/PDFs/backups, Hetzner cobra ~$0.05/GB/mes de volúmenes adicionales o se puede agregar Cloudflare R2 (10GB gratis, luego $0.015/GB).

### Ventajas

- Sistema disponible aunque la PC local se apague
- HTTPS automático y gratuito
- Base de datos en cloud (con backups en cloud)
- VPN cifrada — balanza y cámaras accesibles de forma segura
- Costo muy bajo (~$6/mes)

### Desventajas

- Si la PC local se apaga → balanza y cámaras no accesibles (pero el resto del sistema sí)
- Configuración inicial más larga (4-6 horas)
- Requiere DNS del dominio apuntando al VPS

### Cuándo usar esta opción

Producción seria, gerencia necesita acceso remoto al dashboard, se busca que el sistema no dependa 100% de la PC local para consultas/reportes.

---

## Otras opciones (resumen breve)

### Opción 2 — VPS completo + agente local de hardware

Igual que Opción 3 pero en lugar de VPN se desarrolla un pequeño servicio Node.js local que actúa de bridge: lee la balanza via TCP y las cámaras via HTTP, y envía los datos al VPS via WebSocket/REST. El VPS nunca toca el hardware directamente.

- **Costo:** ~$6–10/mes (mismo VPS, sin VPN)
- **Cambios de código:** Sí — hay que extraer `balanzaService.js` y `camarasController.js` a un proceso separado y agregar comunicación cliente→servidor
- **Ventaja vs Opción 3:** no depende de IP forwarding en Windows, más limpio arquitectónicamente
- **Desventaja:** desarrollo adicional estimado 10–20 horas

---

### Opción 4 — PaaS (Railway / Render / Fly.io)

Plataformas que gestionan toda la infraestructura automáticamente (deploy, SSL, DB, escalado). Sin tocar servidores.

- **Railway:** $5/mes hobby, ~$20–40/mes producción (app + PostgreSQL)
- **Render:** Free tier limitado, $7/mes PostgreSQL, $7/mes web service = ~$14/mes base
- **Fly.io:** Basado en uso, ~$10–25/mes para este stack
- **Cambios de código:** Ninguno de lógica, solo variables de entorno y build config
- **Problema con hardware:** igual que Opción 2 — necesita agente local de bridge para balanza y cámaras
- **Ventaja:** cero administración de servidor, deploys automáticos desde git
- **Desventaja:** más caro, y el bridge local sigue siendo necesario

---

### Opción 5 — DNS dinámico (DDNS) sin VPS

Si el router del local tiene IP pública (aunque cambie), usar servicios como No-IP, DuckDNS o Cloudflare DDNS para apuntar un dominio a esa IP. Abrir puerto en el router hacia la PC local.

- **Costo:** $0–3/mes
- **Cambios de código:** Ninguno
- **Problema principal:** muchos ISP en Argentina asignan IP dinámica (cambia) y algunos bloquean puertos entrantes. Depende del contrato de internet del cliente.
- **Seguridad:** expone el puerto directamente a internet sin proxy — requiere configurar firewall cuidadosamente
- **Recomendado solo si:** el cliente ya tiene IP fija o puede contratarla con su ISP

---

### Opción 6 — Docker + cualquier proveedor

Containerizar el backend (Node.js) y la DB (PostgreSQL) con Docker Compose. Permite desplegar en cualquier VPS o PaaS que soporte Docker con un solo comando.

- **Costo:** según proveedor elegido (mismo rango que Opciones 3/4)
- **Cambios de código:** Ninguno de lógica — solo agregar `Dockerfile` y `docker-compose.yml`
- **Ventaja:** portabilidad total, fácil de mover entre proveedores, entorno reproducible
- **Desventaja:** complejidad operacional adicional si no se conoce Docker
- **Compatible con:** Opción 3 (VPS + VPN) o Opción 4 (PaaS con Docker)

---

## Comparación final (todas las opciones)

| | Op. 1 Tunnel | Op. 2 VPS+Bridge | Op. 3 VPS+VPN | Op. 4 PaaS | Op. 5 DDNS | Op. 6 Docker |
|---|---|---|---|---|---|---|
| **Costo/mes** | ~$1.20 | ~$8–12 | ~$6–8 | ~$14–40 | ~$0–3 | según VPS |
| **Cambios código** | Ninguno | Sí (bridge) | Ninguno | Ninguno* | Ninguno | Config solo |
| **Tiempo impl.** | 2–3 hs | 15–25 hs | 4–6 hs | 3–5 hs | 1–2 hs | 4–8 hs |
| **DB en cloud** | No | Sí | Sí | Sí | No | Sí |
| **Caída si PC apaga** | Todo | Solo hw | Solo hw | Solo hw | Todo | Solo hw |
| **HTTPS** | Sí | Sí | Sí | Sí | Manual | Sí |
| **WebSocket** | Sí | Sí | Sí | Sí | Sí | Sí |
| **Escalabilidad** | Baja | Alta | Media | Alta | Baja | Alta |
| **Recomendado** | Prueba/bajo costo | Prod. limpia | **Prod. recomendada** | Sin DevOps | ISP con IP fija | Multi-proveedor |

---

## Recomendación

**Corto plazo / prueba rápida:** Opción 1 (Cloudflare Tunnel).  
**Producción:** Opción 3 (VPS + WireGuard).

Ambas opciones pueden **combinarse**: empezar con Opción 1 para validar, migrar a Opción 3 cuando se justifique el costo.

---

## Dominio

Registradores recomendados:
- **Cloudflare Registrar** (sin markup, precio de costo): .com ~$10.44/año
- **Namecheap**: .com ~$9-12/año
- **NIC.ar** (dominio .com.ar): ~$450 ARS/año (muy barato)

---

*Documento generado para presentar opciones de infraestructura al cliente.*
