# API Productos con Node.js, PostgreSQL y Docker

API REST lista para ejecutar localmente con Docker Compose. PostgreSQL guarda sus datos en el volumen persistente `postgres_data`. Incluye rutas para maestros, productos y Pokémon, con una ruta de sincronización para las filas de Pokémon de Google Sheets.

## Requisitos

- Docker Desktop con Docker Compose
- Para ejecutar Node fuera de Docker: Node.js 20 o superior y npm
- DBeaver Community para inspeccionar PostgreSQL

## Inicio local con Docker

Desde esta carpeta, ejecuta:

```bash
docker compose up --build -d
```

Compose construye la imagen de la API, inicia PostgreSQL, crea las tablas y agrega datos de demostración. La API espera a que PostgreSQL esté listo antes de iniciar.

Prueba las rutas desde el navegador, curl o Postman:

```text
http://localhost:3000/health
http://localhost:3000/api/maestros/1
http://localhost:3000/api/productos
http://localhost:3000/api/productos/1
http://localhost:3000/api/pokemon
```

La ruta de ejemplo equivalente a la solicitada es `GET /api/maestros/1`. Para apagar los contenedores conservando los datos: `docker compose down`. Para borrar también la base persistida: `docker compose down -v`.

### Agregar 20 maestros a una base existente

Desde la carpeta del proyecto, ejecuta en Warp/PowerShell:

```powershell
Get-Content .\db\migrations\002-agregar-20-maestros.sql | docker compose exec -T db psql -U api_user -d productos
```

Después consulta `http://localhost:3000/api/maestros`. Los 20 registros de prueba usan IDs del 3 al 22; junto con Alex y María quedan 22 maestros.

## Ejecución de Node local contra PostgreSQL en Docker

Si quieres ejecutar el servidor Node directamente en tu computadora mientras PostgreSQL permanece en Docker:

1. Inicia solo la base: `docker compose up -d db`.
2. Copia `.env.example` como `.env` y deja `DATABASE_URL=postgres://api_user:api_password@localhost:5432/productos` (o ajusta la contraseña si definiste `POSTGRES_PASSWORD`).
3. Ejecuta `npm install` y después `npm start`.

La base del contenedor y el servidor local comparten la configuración por el puerto `5432`.

## Rutas disponibles

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/health` | Comprueba API y conexión a PostgreSQL |
| GET | `/api/maestros` | Lista maestros |
| GET | `/api/maestros/:id` | Devuelve un maestro por ID |
| GET | `/api/productos` | Lista productos con el nombre del maestro |
| GET | `/api/productos/:id` | Devuelve un producto por ID |
| POST | `/api/productos` | Crea un producto desde JSON |
| GET | `/api/pokemon` | Lista los Pokémon sincronizados |
| GET | `/api/pokemon/:id` | Devuelve un Pokémon por el ID de la hoja |
| POST | `/api/pokemon` | Crea o actualiza un Pokémon usando su ID como clave |

Para sincronizar una fila de la hoja, envía `ID`, `Nombre`, `Tipo`, `Imagen Frontal` e `Imagen Trasera` desde Google Sheets al nodo HTTP Request como JSON con estas propiedades:

```json
{
  "id": 1,
  "nombre": "bulbasaur",
  "tipo": "grass",
  "imagen_frontal": "https://.../1.png",
  "imagen_trasera": "https://.../back/1.png"
}
```

El ID de la hoja es la clave única. Si una fila vuelve a enviarse tras editarse, el endpoint actualiza el registro existente en vez de crear un duplicado. La ruta no importa automáticamente las filas que ya estaban en la hoja; n8n enviará cada fila cuando ocurra una alta o edición que detecte el disparador.

Ejemplo para registrar un producto:

```bash
curl -X POST http://localhost:3000/api/productos \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Audífonos","precio":599,"stock":8,"maestro_id":1}'
```

## Inspección con DBeaver

Crea una conexión PostgreSQL con estos valores mientras usas Docker local:

| Campo | Valor |
| --- | --- |
| Host | `localhost` |
| Puerto | `5432` |
| Base de datos | `productos` |
| Usuario | `api_user` |
| Contraseña | `api_password` (o la definida en `POSTGRES_PASSWORD`) |

Al conectarte, abre `Schemas > public > Tables` y revisa `maestros`, `productos` y `pokemon`. En Render puedes usar la conexión externa de la base, si está habilitada, junto con SSL. No uses la URL interna de Render desde tu computadora; esa URL solo se resuelve en la red privada de Render.

## Automatización con n8n

El archivo `n8n/flujo-consumir-api.json` consulta cada hora `GET /api/maestros/1` en la API local. Para el contenedor n8n ejecutado por separado en Docker Desktop, la URL es `http://host.docker.internal:3000/api/maestros/1`; desde el navegador en la computadora, abre `http://localhost:3000/api/maestros/1`. Importa el JSON en n8n, guarda y activa el workflow. Las ejecuciones aparecerán en el historial de n8n.

El flujo entrega el JSON al siguiente nodo de n8n; agrega nodos posteriores (por ejemplo, hoja de cálculo, correo o CRM) para automatizar acciones con los productos.

## Publicación en GitHub y Render

El archivo `render.yaml` define el servicio Docker de la API y una base PostgreSQL. Al crear un Blueprint en Render desde el repositorio, Render puede aprovisionar ambos recursos y vincular `DATABASE_URL` automáticamente. El servicio ejecuta `db/init.sql` al iniciar, creando las tablas y los datos de demostración.

Después de enviar el repositorio a GitHub:

1. En Render abre **New > Blueprint** y selecciona `api-productos-alex`.
2. Revisa los recursos y el plan antes de aplicar el Blueprint. Este ejemplo selecciona planes gratuitos para la API y la base.
3. Cuando termine el despliegue, comprueba `/health`, `/api/maestros` y `/api/productos` en el dominio `onrender.com` que Render asigne.
4. En n8n, configura el nodo HTTP Request para consultar la URL pública de Render.

**Límite del plan gratuito:** Render apaga servicios web gratuitos después de 15 minutos sin tráfico, por lo que la primera petición posterior puede tardar en responder. Las bases PostgreSQL gratuitas caducan a los 30 días; mejora la base a un plan pagado antes de esa fecha si necesitas conservar los datos. La API local y PostgreSQL de Render son bases distintas.

## Secretos y persistencia

No subas `.env` ni contraseñas a GitHub. En una instalación local, cambia `POSTGRES_PASSWORD` antes del primer inicio. Los datos locales se conservan en `postgres_data`; Render administra su propia base PostgreSQL y su persistencia fuera del contenedor de la API.

