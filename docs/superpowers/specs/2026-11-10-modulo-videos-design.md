# Módulo de Videos — Diseño

**Fecha:** 2026-11-10
**Estado:** Implementado y probado en local (S3 real, bucket privado). Falta desplegar.

> ## Arquitectura final (prevalece sobre el resto del documento)
>
> Las secciones 2 a 10 describen el diseño inicial con CloudFront y subida directa a S3, que **se descartó**. Lo que quedó:
>
> | Pieza | Cómo funciona |
> |---|---|
> | Subida | Navegador → `POST /api/videos/subir` → servidor → S3 `videos/originales/{id}` (sin CORS) |
> | Conversión | Worker en el proceso de Next con ffmpeg: 1 núcleo por defecto, prioridad baja, formatos de entrada restringidos |
> | Almacenamiento | `videos/convertidos/{id}/video.mp4` y `poster.jpg`. **Todo el bucket sigue privado** (no se tocan los bloqueos de acceso público) |
> | Reproductor | `GET /embed/{id}` en Autogestión (público, sin sesión): un HTML de pocos KB con CSS y JS adentro, autorizados por hash en la CSP, y con `frame-ancestors` real |
> | Video para el lector | URL **firmada y temporal** de S3 (6 h, o menos si las credenciales del servidor vencen antes). El video nunca pasa por Autogestión ni por Cloudflare |
> | Caché | En memoria, 10 min por video (nunca más de la mitad de lo que dura la firma) + `Cache-Control: public, max-age=60, s-maxage=<restante>` para Cloudflare. Con `?r=` se regenera solo si la entrada tiene más de 1 min |
> | Firma vencida | El reproductor recarga una sola vez con `?r=`; si sigue fallando muestra "Video no disponible" |
> | Código para la nota | `<iframe src="https://autogestion.tiempo.hn/embed/{id}">`, con la proporción del video |
>
> **Por qué no CloudFront ni S3 público:** tiempo.hn y Autogestión están detrás de **Cloudflare**, cuyos términos (planes no Enterprise) no permiten servir video por su CDN. Con la URL firmada el video va directo de S3 al lector y el bucket, que también guarda vouchers y facturas, queda privado.
>
> **Variables:** `VIDEOS_FRAME_ANCESTORS` (por defecto `https://tiempo.hn https://*.tiempo.hn`; siempre se suman el origen de `NEXT_PUBLIC_APP_URL` y `'self'`), `VIDEOS_FFMPEG_HILOS` (por defecto 1), `FFMPEG_PATH`/`FFPROBE_PATH`, `AWS_VIDEOS_BUCKET`/`AWS_VIDEOS_PREFIX` (opcionales). Ya **no** existen `VIDEOS_PUBLIC_URL`, `VIDEOS_CDN_PROXY` ni `VIDEOS_CLOUDFRONT_DISTRIBUTION_ID`.
>
> **Cloudflare (recomendado, lo configura quien administre Cloudflare):** una Cache Rule para `autogestion.tiempo.hn/embed/*` con "Eligible for cache" y Edge TTL "Use cache-control header". Sin ella funciona igual, pero cada vista llega al servidor (barato gracias al caché en memoria). Después de desplegar, revisar en Safari o en incógnito que Cloudflare no muestre un desafío anti-bots dentro del iframe; si pasa, excluir `/embed/*` de los desafíos.
>
> ### Historial de decisiones al implementar
> - Variable `VIDEOS_FRAME_ANCESTORS`, explicada arriba.
> - Los permisos los inserta la propia migración (`INSERT IGNORE`) y también están en `seed.ts`.
> - Eliminar: con `eliminar_videos` se borra cualquier video. Sin ese permiso, cada quien puede borrar **sus propias** subidas que no llegaron a `LISTO`.
> - Si la subida falla o se cancela, el registro se borra solo.
> - **La subida ya no va directo del navegador a S3 (§3.1 queda reemplazado).** Sigue el mismo patrón que facturas y firmas: navegador → `POST /api/videos/subir` → servidor → S3. Así **no hace falta CORS en el bucket** y se quitó `@aws-sdk/s3-presigned-post`. A diferencia de facturas (base64 por server action), la ruta recibe el archivo crudo por *streaming* a un archivo temporal, porque las server actions aceptan 1 MB por defecto y 1 GB en base64 no cabe en memoria. Título y nombre van en las cabeceras `X-Video-Titulo` y `X-Video-Nombre`. Hay chequeo de `Origin` y la cabecera propia funciona como defensa CSRF.
> - En producción, si hay un proxy delante (nginx, ALB), debe aceptar cuerpos de hasta 1 GB (`client_max_body_size 1100m;`) y timeouts de lectura largos para subidas lentas.
> - **Endurecimiento de ffmpeg:** todas las llamadas a ffmpeg y ffprobe llevan `-protocol_whitelist file -format_whitelist mov,matroska,avi,mpegts,mpeg`. Un archivo que en realidad es una playlist HLS o un concat se rechaza antes de abrir nada. Se verificó con una playlist disfrazada: sin la restricción ffprobe intenta abrir el segmento referido; con ella responde "Format not on whitelist".
> - El `ffprobe-static` empaquetado es **ffprobe 4.0.2 (2018)**. En producción usar ffmpeg/ffprobe actuales del sistema (`apt install ffmpeg`) con `FFMPEG_PATH` y `FFPROBE_PATH`.
> - Se probaron y descartaron: una ruta que imitaba a CloudFront (`/api/videos-cdn`) y servir desde S3 público con el reproductor en S3. Se reemplazaron por `/embed/{id}` con URL firmada (ver tabla arriba).
> - **CPU de la conversión:** `VIDEOS_FFMPEG_HILOS`, por defecto **1** (`-threads` al decodificar y codificar, más prioridad baja). Medido en la PC de desarrollo con un clip HEVC de iPhone de 39 s: unos 20 s con todos los núcleos y unos 182 s con 1 hilo.
> - **Límite de Cloudflare:** las peticiones a autogestion.tiempo.hn tienen tope de 100 MB en planes Free/Pro. Las subidas de más de 100 MB fallan en producción hasta implementar la subida por partes (pendiente).

## 1. Objetivo

Reemplazar la plataforma externa (MOW) que hoy usan los periodistas para publicar videos en tiempo.hn.
El periodista sube el video en Autogestión y recibe un código HTML. Lo pega en la nota del CMS de tiempo.hn y ese código **es** el reproductor del video.

### Lo que se acordó con el equipo

| Tema | Decisión |
|---|---|
| Qué significa "HTML seguro" | Un `<iframe>` hacia un reproductor propio, sin scripts en el CMS, que solo se puede incrustar en tiempo.hn |
| Tipo de video | Clips cortos de celular (normalmente < 5 min, < 500 MB, `.MOV`/`.MP4`) |
| Ubicación en Autogestión | Biblioteca de videos aparte (módulo "Videos"), no ligada a las notas de Redacción |
| Servicios AWS permitidos | Solo S3 + CloudFront. La conversión se hace con ffmpeg en el servidor de Autogestión |
| Funciones del reproductor | Solo reproducir (más la portada automática, ver §6) |
| Dónde vive el reproductor | Archivo estático en CloudFront. Los lectores nunca le pegan al servidor de Autogestión |
| Almacenamiento | **El bucket actual** (`AWS_PRIVATE_BUCKET`), dentro de la carpeta `videos/` |

### Fuera de alcance (YAGNI)

- Contador de vistas, logo o marca de agua, publicidad.
- Calidad adaptativa (HLS), varias resoluciones.
- Evitar la descarga del video (DRM o cifrado). El `.mp4` es una URL pública: alguien técnico podría descargarlo.
- Vincular videos a notas de Redacción.
- Editar o recortar videos.

## 2. Arquitectura

```
Periodista (Autogestión → /videos)
  │ 1. iniciarSubida() → registro Video (SUBIENDO) + POST prefirmado de S3
  │ 2. el navegador sube el archivo DIRECTO a S3 (barra de progreso)
  ▼
S3  {bucket}/videos/originales/{id}            ← privado, solo el servidor
  │ 3. confirmarSubida() → EN_COLA → arranca el worker
  ▼
Worker ffmpeg (dentro del proceso de Next, 1 video a la vez, CPU en baja prioridad)
  │ 4. convierte y sube:
  ▼
S3  {bucket}/videos/publico/v/{id}/video.mp4   ← lo lee CloudFront
S3  {bucket}/videos/publico/v/{id}/poster.jpg
  │ 5. estado LISTO
  ▼
Lector en tiempo.hn ──► <iframe> ──► CloudFront ──► /player.html?v={id} ──► /v/{id}/video.mp4
```

### 2.1 Estructura dentro del bucket actual

```
{AWS_PRIVATE_BUCKET}/
├── (pdfs de vouchers, facturas, firmas de insumos — sin cambios)
└── videos/                          ← AWS_VIDEOS_PREFIX (por defecto "videos")
    ├── originales/{id}              ← archivo tal como lo subió el periodista
    └── publico/                     ← ÚNICA carpeta que CloudFront puede leer
        ├── player.html
        ├── player.js
        ├── player.css
        └── v/{id}/
            ├── video.mp4
            └── poster.jpg
```

### 2.2 Cómo se protege el resto del bucket

En el bucket conviven los vouchers de planilla y las facturas, así que CloudFront no debe poder leer nada fuera de `videos/publico/`. Para eso hay dos barreras independientes:

1. **Origin path de CloudFront = `/videos/publico`.** CloudFront antepone ese prefijo a cada petición, así que ninguna URL pública puede apuntar a otra carpeta.
2. **Bucket policy restringida al prefijo.** Al acceso de CloudFront (OAC) solo se le da `s3:GetObject` sobre `arn:aws:s3:::{bucket}/videos/publico/*`, condicionado al ARN de esa distribución. Aunque alguien cambie la configuración de CloudFront, S3 rechaza cualquier otra ruta.

El bucket sigue con *Block Public Access* activado. Nada del bucket se vuelve público directamente.

## 3. Flujo detallado

### 3.1 Subida (navegador → S3)

1. El periodista abre "Subir video" y escribe el título (obligatorio, máx. 200 caracteres) y elige el archivo.
   El cliente valida antes de subir que `file.size ≤ 1 GB` y que `file.type` empiece con `video/` o esté vacío.
2. La server action `iniciarSubida({ titulo, nombreArchivo, tamanoBytes })`:
   - verifica el permiso `subir_videos`;
   - crea el `Video` con estado `SUBIENDO`, `id = randomUUID()` y `claveOriginal = videos/originales/{id}`;
   - devuelve un **POST prefirmado** (`@aws-sdk/s3-presigned-post`) con:
     - `Key` exacto `videos/originales/{id}`;
     - condición `content-length-range` de 1 byte a 1 GB (la hace cumplir S3, no el navegador);
     - `Content-Type: application/octet-stream` (el tipo real lo decide `ffprobe`, no la extensión);
     - vencimiento de 15 minutos.
3. El navegador envía el `FormData` directo a S3 con `XMLHttpRequest`, para tener progreso de subida.
4. La server action `confirmarSubida(id)`:
   - verifica que el video sea del usuario y esté en `SUBIENDO`;
   - hace `HeadObject` sobre la clave original (que exista y que el tamaño ≤ 1 GB);
   - guarda `tamanoBytes` real, cambia el estado a `EN_COLA` y arranca el worker (sin esperar).

Si el navegador se cierra a mitad de la subida, el video queda en `SUBIENDO`. La lista lo muestra como "Subida incompleta" y se puede eliminar.

### 3.2 Conversión (worker)

**Arranque.** El worker es un singleton guardado en `globalThis`, para que sobreviva al *hot reload* de desarrollo. Se arranca desde `confirmarSubida`, desde `reintentarVideo` y al iniciar el servidor (`instrumentation.ts`).

**Ciclo.** Mientras haya trabajo:

1. **Rescate de huérfanos.** Los videos en `PROCESANDO` con `actualizadoAt` de más de 2 minutos vuelven a `EN_COLA`, siempre que `intentos < 3`; si no, pasan a `ERROR`.
2. **Reclamo atómico.** Se busca el `EN_COLA` más antiguo y se hace
   `updateMany({ where: { id, estado: "EN_COLA" }, data: { estado: "PROCESANDO", intentos: { increment: 1 } } })`.
   Si `count === 0`, otro proceso lo tomó y se pasa al siguiente. Así dos instancias nunca convierten el mismo video.
3. **Latido.** Mientras ffmpeg corre, se actualiza `actualizadoAt` cada 30 s.
4. **Pasos de la conversión:**
   1. Descargar el original a `os.tmpdir()/autogestion-videos/{id}/original` como *stream*, sin cargarlo en memoria.
   2. Correr `ffprobe` y validar que haya al menos una pista de video. Si no hay, es `ERROR` con el mensaje "El archivo no es un video válido" y **no** se reintenta.
   3. Convertir con `ffmpeg`, con prioridad baja (`os.setPriority(pid, 10)`) y un *timeout* de 20 min:
      ```
      -i original
      -map 0:v:0 -map 0:a:0?
      -c:v libx264 -preset veryfast -crf 23 -profile:v high -pix_fmt yuv420p
      -vf scale=<lado corto máx. 720 px, nunca agrandar, dimensiones pares>
      -c:a aac -b:a 128k -ac 2
      -movflags +faststart
      video.mp4
      ```
      ffmpeg aplica solo la rotación que trae el celular, así que los videos verticales salen verticales.
   4. Sacar la portada con `-ss min(1, duración/2) -frames:v 1 poster.jpg`.
   5. Correr `ffprobe` sobre el `video.mp4` final y guardar `ancho`, `alto` y `duracionSeg`. Se miden ya rotados, que es lo que usa el código embebido.
   6. Subir a `videos/publico/v/{id}/` con estos encabezados:
      - `video.mp4`: `Content-Type: video/mp4` y `Cache-Control: public, max-age=31536000, immutable`;
      - `poster.jpg`: `Content-Type: image/jpeg` y el mismo `Cache-Control`.
   7. Pasar a `LISTO`, borrar el original de S3 y borrar la carpeta temporal (en `finally`, siempre).
5. **Si falla:** si `intentos < 3`, vuelve a `EN_COLA`; si no, queda en `ERROR` con `errorMensaje`. El original se conserva para poder reintentar.

**Concurrencia.** Un video a la vez por proceso. Un clip de 3 min tarda aproximadamente 1–2 min en 2 vCPU.

### 3.3 Reproductor (estático en CloudFront)

Los archivos viven en el repo en `video-player/` (`player.html`, `player.js`, `player.css`). Se suben a `videos/publico/` con el script `pnpm videos:subir-player`, con `Cache-Control: public, max-age=300`.

`player.html` no usa librerías externas:

```html
<video controls playsinline preload="metadata"></video>
```

`player.js` hace lo siguiente:

- Lee `v` de `location.search` y valida que sea un UUID (`/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`). Si no cumple, muestra "Video no disponible".
- Asigna `poster = /v/{id}/poster.jpg` y `src = /v/{id}/video.mp4`. Son rutas del mismo origen, sin concatenar nada que no esté validado.
- En el evento `error` del `<video>`, muestra "Video no disponible" (por ejemplo, si el video se eliminó).
- El video ocupa todo el iframe con `object-fit: contain` y fondo negro.

### 3.4 Código embebido (lo que copia el periodista)

Lo genera la función pura `generarCodigoEmbed({ id, titulo, ancho, alto, baseUrl })` en `lib/videos/embed.ts`:

```html
<div style="position:relative;width:100%;max-width:{MAX}px;aspect-ratio:{ancho}/{alto};margin:0 auto">
  <iframe src="{baseUrl}/player.html?v={id}" title="{titulo escapado}"
    style="position:absolute;inset:0;width:100%;height:100%;border:0"
    allow="fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe>
</div>
```

- `MAX` es 720 si `ancho ≥ alto` (horizontal o cuadrado) y 360 si es vertical.
- `id` debe ser un UUID válido, y `ancho` y `alto` enteros positivos. Si no, la función lanza error.
- `titulo` se escapa para atributo HTML (`& < > " '`). Es el único texto libre que entra al código.
- `baseUrl` sale de la variable de entorno `VIDEOS_PUBLIC_URL`, por ejemplo `https://videos.tiempo.hn`.

### 3.5 Eliminar

Requiere el permiso `eliminar_videos` y que el video **no** esté en `PROCESANDO`. Los pasos son:

1. Borrar `videos/publico/v/{id}/video.mp4`, `poster.jpg` y `videos/originales/{id}` (ignora si no existen).
2. Crear una invalidación de CloudFront para `/v/{id}/*` (`@aws-sdk/client-cloudfront`).
3. Borrar el registro `Video`.

Las notas viejas que tenían el código muestran "Video no disponible" en unos minutos.

## 4. Seguridad

| Riesgo | Mitigación |
|---|---|
| Exponer vouchers o facturas del mismo bucket | Origin path `/videos/publico` + bucket policy limitada a `videos/publico/*` (§2.2) |
| Inyectar código en el CMS de tiempo.hn | El código embebido sale de una plantilla fija: UUID validado, enteros y título escapado |
| Inyección en el reproductor | `player.js` solo acepta UUID y usa rutas del mismo origen. CSP estricta (abajo) |
| Otros sitios incrustan el video | `frame-ancestors` en `player.html` |
| Archivos enormes o falsos | `content-length-range` en el POST prefirmado, `HeadObject` al confirmar y `ffprobe` antes de convertir |
| Subidas no autorizadas | Permiso `subir_videos` en cada server action. La URL prefirmada vence en 15 min y solo sirve para una clave |
| Saturar el servidor | Un video a la vez, prioridad baja de CPU y *timeout* de 20 min |

**Response headers policy de CloudFront** (se aplica a toda la distribución):

```
Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self';
  media-src 'self'; img-src 'self';
  frame-ancestors https://tiempo.hn https://*.tiempo.hn {URL de Autogestión}
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

La URL de Autogestión está en `frame-ancestors` para que funcione la vista previa dentro del módulo.

## 5. Datos

### 5.1 Modelo Prisma (nueva migración)

```prisma
enum VideoEstado {
  SUBIENDO
  EN_COLA
  PROCESANDO
  LISTO
  ERROR
}

model Video {
  id                String      @id @db.VarChar(36)
  titulo            String      @db.VarChar(200)
  estado            VideoEstado @default(SUBIENDO)
  nombreOriginal    String      @db.VarChar(255)
  tamanoBytes       BigInt
  claveOriginal     String      @db.VarChar(512)
  duracionSeg       Int?
  ancho             Int?
  alto              Int?
  intentos          Int         @default(0)
  errorMensaje      String?     @db.Text
  creadorEmpleadoId String      @db.VarChar(36)
  creador           Empleados   @relation(fields: [creadorEmpleadoId], references: [id])
  creadoAt          DateTime    @default(now())
  actualizadoAt     DateTime    @updatedAt

  @@index([estado])
  @@index([creadoAt])
}
```

Hay que agregar la relación inversa `Video Video[]` en `Empleados`.

### 5.2 Permisos

Se agregan a la lista de `prisma/seed.ts` y se asignan a los roles desde "Configuración de permisos":

| Permiso | Para qué |
|---|---|
| `ver_videos` | Ver el menú "Videos", la lista y copiar el código |
| `subir_videos` | Subir videos y reintentar los que fallaron |
| `eliminar_videos` | Eliminar videos |

### 5.3 Variables de entorno nuevas

| Variable | Ejemplo | Uso |
|---|---|---|
| `AWS_VIDEOS_BUCKET` | (opcional, por defecto `AWS_PRIVATE_BUCKET`) | Bucket de los videos |
| `AWS_VIDEOS_PREFIX` | `videos` | Carpeta raíz dentro del bucket |
| `VIDEOS_PUBLIC_URL` | `https://videos.tiempo.hn` | URL pública de CloudFront para el código embebido |
| `VIDEOS_CLOUDFRONT_DISTRIBUTION_ID` | `E1ABC...` | Para invalidar la caché al eliminar |
| `FFMPEG_PATH` / `FFPROBE_PATH` | (opcional) | Para usar un ffmpeg del sistema en lugar del empaquetado |

## 6. Pantallas en Autogestión

Se sigue el patrón de `app/(protected)/redaccion`: server component que revisa permisos, `actions.ts`, `components/` con data-table.

- **Menú lateral** (`components/app-sidebar.tsx`): entrada "Videos" con el icono `Video` de lucide y el permiso `ver_videos`.
- **`/videos`** (lista):
  - columnas: título, estado (badge), duración, subido por, fecha;
  - búsqueda por título;
  - acciones por fila: "Copiar código" (solo `LISTO`), "Vista previa" (diálogo con el iframe real), "Reintentar" (`ERROR`, con `subir_videos`) y "Eliminar" (`eliminar_videos`);
  - mientras haya videos en `SUBIENDO`, `EN_COLA` o `PROCESANDO`, la lista se refresca cada 5 s.
- **Subir** (diálogo o `/videos/subir`):
  - título + archivo → barra de progreso → "Procesando…";
  - cuando pasa a `LISTO`, muestra la vista previa y el código con el botón "Copiar".
- **`middleware.ts`**: agregar `"/videos/:path*"` al `matcher`.

**Portada.** Es la única adición a "solo play": un fotograma del video como `poster`. Sin ella, en iPhone el reproductor se ve como un rectángulo negro dentro de la nota hasta que le dan play. Cuesta un comando de ffmpeg. Si no se quiere, se quitan el paso 4.4 de §3.2 y el atributo `poster`.

## 7. Dependencias nuevas

- `@aws-sdk/s3-presigned-post`: POST prefirmado con límite de tamaño.
- `@aws-sdk/client-cloudfront`: invalidación al eliminar.
- `ffmpeg-static` y `ffprobe-static`: binarios empaquetados, para no depender de lo que tenga instalado el servidor.
  - Agregar `ffmpeg-static: true` en `allowBuilds` de `pnpm-workspace.yaml`, porque descarga el binario en el *postinstall*.
  - Incluir los binarios en el build `standalone` con `experimental.outputFileTracingIncludes`.
- `vitest` (dev): pruebas unitarias.
- `next.config.mjs`: `experimental.instrumentationHook: true`, para reanudar la cola al iniciar.

## 8. Errores y casos borde

| Caso | Comportamiento |
|---|---|
| El navegador se cierra durante la subida | Queda en `SUBIENDO` ("Subida incompleta") y se puede eliminar. La regla de ciclo de vida limpia el original |
| El archivo no es video | `ffprobe` falla y el video pasa a `ERROR` con "El archivo no es un video válido", sin reintentos automáticos |
| ffmpeg falla o pasa el *timeout* | Se reintenta automáticamente hasta 3 intentos y luego queda en `ERROR`. Se puede "Reintentar" a mano |
| El servidor se reinicia a mitad | Al arrancar, el rescate de huérfanos (latido > 2 min) lo devuelve a `EN_COLA` |
| Dos instancias de la app | El reclamo atómico (`updateMany` condicionado al estado) evita la doble conversión |
| Video eliminado pero pegado en una nota | El reproductor muestra "Video no disponible" |
| Video HDR de iPhone | Puede verse con colores un poco lavados al pasar a SDR. Si pasa en las pruebas, se agrega *tonemapping* al filtro de ffmpeg |

## 9. Pruebas

**Unitarias (Vitest)**, solo funciones puras:

- `generarCodigoEmbed`: horizontal, vertical y cuadrado (proporción y `max-width`), escapado del título con `"<>&'`, error si el id no es UUID o las dimensiones no son válidas.
- Constructor de argumentos de ffmpeg y la expresión `scale` (lado corto ≤ 720, sin agrandar).
- Cálculo del segundo de la portada para videos cortos (< 1 s).
- Construcción de las claves de S3 a partir del prefijo, con y sin `/` final.

**Manual** (checklist en el plan):

1. `.MOV` HEVC vertical de iPhone → sale vertical, se reproduce en Chrome, Safari iOS y Android.
2. `.MP4` horizontal de Android.
3. Un `.pdf` renombrado a `.mp4` → `ERROR` "no es un video válido".
4. Archivo de más de 1 GB → el cliente lo rechaza y, si se fuerza, S3 también.
5. Pegar el código en una página de tiempo.hn → se reproduce. Ponerlo en otro dominio → el iframe se bloquea.
6. `https://{cloudfront}/../vouchers/...` o cualquier ruta fuera de `v/` y `player.*` → 403.
7. Eliminar un video → en unos minutos la nota muestra "Video no disponible".
8. Reiniciar el servidor a mitad de una conversión → el video termina igual.

## 10. Checklist de infraestructura (AWS)

1. **CORS del bucket** (`AWS_PRIVATE_BUCKET`): permitir `POST` desde la URL de Autogestión (`NEXT_PUBLIC_APP_URL`), con encabezados `*`.
2. **CloudFront**, distribución nueva:
   - origin: el bucket, con **Origin Access Control** y **origin path `/videos/publico`**;
   - cache policy: `CachingOptimized`, porque el reproductor lee `?v=` desde JavaScript y no hace falta incluir la query en la caché;
   - response headers policy con la CSP de §4;
   - dominio: `videos.tiempo.hn` con certificado ACM en `us-east-1` y registro DNS, o el dominio `*.cloudfront.net` para empezar.
3. **Bucket policy**: `s3:GetObject` para el *service principal* `cloudfront.amazonaws.com` sobre `arn:aws:s3:::{bucket}/videos/publico/*`, con condición `AWS:SourceArn` = ARN de la distribución.
4. **Regla de ciclo de vida** limitada al prefijo `videos/originales/`: expirar objetos de más de 7 días. **No** aplicarla a todo el bucket.
5. **IAM del servidor** (rol de la instancia):
   - `s3:PutObject`, `s3:GetObject` (también cubre `HeadObject`) y `s3:DeleteObject` sobre `{bucket}/videos/*`;
   - `cloudfront:CreateInvalidation` sobre la distribución.
6. **Servidor**: espacio libre en `/tmp` de al menos 3 GB.
