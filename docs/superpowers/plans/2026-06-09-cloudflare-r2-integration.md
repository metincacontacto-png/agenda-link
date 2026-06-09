# Integración de Cloudflare R2 para Almacenamiento de Imágenes

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrar Cloudflare R2 como Object Storage para logos, banners e imágenes de servicios/platos, permitiendo subir archivos decodificados de Base64 directamente a R2 y guardar únicamente URLs de proxies públicos (`/api/media/[key]`) en la base de datos D1.

**Architecture:** Almacenaremos y recuperaremos archivos de forma nativa en Cloudflare R2. Los endpoints existentes recibirán opcionalmente las imágenes en formato Base64 desde el cliente, las procesarán y subirán al bucket R2 mediante el binding `BUCKET` obtenido de `@opennextjs/cloudflare`, guardando la URL `/api/media/[key]` en SQLite. Se creará una ruta de lectura dinámica `/api/media/[key]` para servir los archivos con headers de caché optimizados.

**Tech Stack:** Next.js (App Router), Cloudflare R2 (Wrangler Bindings), `@opennextjs/cloudflare`, Prisma (SQLite/D1).

---

## Cambios Propuestos

### 1. Configuración de Entorno
#### [MODIFY] [wrangler.toml](file:///Users/dekgiovannirepetto/Documents/DEVELOPER/Agenda%20Link/wrangler.toml)
- Agregar la sección `[[r2_buckets]]` para definir el binding `BUCKET` para entornos de desarrollo y producción.

### 2. Utilidades y Helpers
#### [NEW] [r2.ts](file:///Users/dekgiovannirepetto/Documents/DEVELOPER/Agenda%20Link/src/lib/r2.ts)
- Implementar la función `uploadBase64ToR2` para decodificar Base64, subir el archivo y retornar la URL de proxy `/api/media/[key]`.
- Implementar la función `deleteFromR2` para eliminar imágenes antiguas del bucket.

### 3. Rutas y APIs de Next.js
#### [NEW] [route.ts](file:///Users/dekgiovannirepetto/Documents/DEVELOPER/Agenda%20Link/src/app/api/media/%5Bkey%5D/route.ts)
- Implementar la ruta GET para servir archivos desde R2 usando la API de Streams nativa y cabeceras de caché estáticas.

#### [MODIFY] [route.ts (admin)](file:///Users/dekgiovannirepetto/Documents/DEVELOPER/Agenda%20Link/src/app/api/admin/route.ts)
- Importar los helpers de R2.
- Interceptar campos `logoUrl`, `landingCoverUrl` y `landingSecondaryCoverUrl` en el POST.
- Si contienen Base64 (`data:image/`), eliminar imagen previa (si existe) y subir nueva.
- Guardar la URL resultante en la base de datos.

#### [MODIFY] [route.ts (services)](file:///Users/dekgiovannirepetto/Documents/DEVELOPER/Agenda%20Link/src/app/api/services/route.ts)
- Importar helpers de R2.
- Subir `imageUrl` a R2 en el POST (si es Base64).
- Eliminar la imagen previa del R2 al procesar el DELETE de un servicio.

#### [MODIFY] [route.ts (menu)](file:///Users/dekgiovannirepetto/Documents/DEVELOPER/Agenda%20Link/src/app/api/menu/route.ts)
- Importar helpers de R2.
- Subir `imageUrl` a R2 en el POST (si es Base64).
- Eliminar la imagen previa del R2 al procesar el DELETE de un plato del menú.

---

## Tareas Detalladas

### Tarea 1: Configurar Binding de R2
**Archivos:**
- Modificar: `wrangler.toml`

- [ ] **Paso 1: Agregar el bucket R2 al archivo de configuración de Wrangler**
  Insertar al final de [wrangler.toml](file:///Users/dekgiovannirepetto/Documents/DEVELOPER/Agenda%20Link/wrangler.toml) el binding para `BUCKET`:
  ```toml
  [[r2_buckets]]
  binding = "BUCKET"
  bucket_name = "agenda-link-uploads"
  ```
  Esto permite que `wrangler` exponga de forma automática el bucket en el entorno local (usando SQLite local) y en producción al desplegar en Cloudflare.

- [ ] **Paso 2: Confirmar configuración de wrangler**
  Ejecutar el linter para asegurar que el archivo no contenga errores de sintaxis TOML.

---

### Tarea 2: Implementar Helpers de Almacenamiento R2
**Archivos:**
- Crear: `src/lib/r2.ts`

- [ ] **Paso 1: Escribir funciones para guardar y borrar imágenes en R2**
  Crear el archivo [r2.ts](file:///Users/dekgiovannirepetto/Documents/DEVELOPER/Agenda%20Link/src/lib/r2.ts) con la decodificación de Base64, el uso del binding de Cloudflare R2 y el formateo de URLs:
  ```typescript
  import { getCloudflareContext } from "@opennextjs/cloudflare";

  /**
   * Sube una imagen en formato base64 a Cloudflare R2 y devuelve su URL de proxy local.
   * Si no es base64, la retorna sin cambios.
   */
  export async function uploadBase64ToR2(
    base64Str: string | null | undefined,
    prefix: string
  ): Promise<string | null | undefined> {
    if (!base64Str || !base64Str.startsWith("data:image/")) {
      return base64Str;
    }

    try {
      const { env } = getCloudflareContext();
      const bucket = (env as any).BUCKET;
      if (!bucket) {
        console.warn("R2 bucket binding 'BUCKET' no encontrado, usando Base64 original.");
        return base64Str;
      }

      // Extraer extensión de archivo e información de datos
      const matches = base64Str.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        throw new Error("Formato Base64 inválido");
      }

      const extension = matches[1] === "jpeg" ? "jpg" : matches[1];
      const data = matches[2];
      const buffer = Buffer.from(data, 'base64');
      
      // Nombre de archivo único
      const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${extension}`;

      await bucket.put(filename, buffer, {
        httpMetadata: {
          contentType: `image/${extension === "jpg" ? "jpeg" : extension}`
        }
      });

      return `/api/media/${filename}`;
    } catch (error) {
      console.error("Error al subir imagen a R2:", error);
      return base64Str;
    }
  }

  /**
   * Elimina un archivo de Cloudflare R2 dada su URL de proxy local.
   */
  export async function deleteFromR2(url: string | null | undefined): Promise<void> {
    if (!url || !url.startsWith("/api/media/")) {
      return;
    }

    try {
      const { env } = getCloudflareContext();
      const bucket = (env as any).BUCKET;
      if (!bucket) return;

      const key = url.replace("/api/media/", "");
      await bucket.delete(key);
    } catch (error) {
      console.error("Error al eliminar imagen de R2:", error);
    }
  }
  ```

---

### Tarea 3: Crear el Endpoint de Lectura de Media (Proxy R2)
**Archivos:**
- Crear: `src/app/api/media/[key]/route.ts`

- [ ] **Paso 1: Implementar el endpoint dynamic route GET para servir imágenes desde R2**
  Crear el archivo [route.ts](file:///Users/dekgiovannirepetto/Documents/DEVELOPER/Agenda%20Link/src/app/api/media/%5Bkey%5D/route.ts):
  ```typescript
  import { getCloudflareContext } from "@opennextjs/cloudflare";

  export async function GET(
    request: Request,
    { params }: { params: Promise<{ key: string }> }
  ) {
    try {
      const { key } = await params;
      if (!key) {
        return new Response("Missing key", { status: 400 });
      }

      const { env } = getCloudflareContext();
      const bucket = (env as any).BUCKET;
      if (!bucket) {
        return new Response("R2 Bucket not bound", { status: 500 });
      }

      const object = await bucket.get(key);
      if (!object) {
        return new Response("Not Found", { status: 404 });
      }

      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set("etag", object.httpEtag);
      headers.set("Cache-Control", "public, max-age=31536000, immutable");

      return new Response(object.body, {
        headers,
      });
    } catch (error) {
      console.error("Error al obtener recurso de R2:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  }
  ```

---

### Tarea 4: Actualizar API de Administración para Integrar R2
**Archivos:**
- Modificar: `src/app/api/admin/route.ts`

- [ ] **Paso 1: Interceptar y procesar las imágenes en Base64 en la API de configuración**
  Modificar el método `POST` de [route.ts](file:///Users/dekgiovannirepetto/Documents/DEVELOPER/Agenda%20Link/src/app/api/admin/route.ts) para subir los banners y el logotipo a R2 si se reciben como Base64, eliminando las fotos antiguas correspondientes:
  Importaciones al principio del archivo:
  ```typescript
  import { uploadBase64ToR2, deleteFromR2 } from "@/lib/r2";
  ```
  Modificar la lógica dentro del `try` de `POST` para que recupere la información actual, procese la subida y limpie los archivos previos:
  ```typescript
    // Obtener valores actuales en la base de datos para controlar la sobreescritura de archivos
    const existing = await prisma.business.findUnique({
      where: { slug },
      select: { logoUrl: true, landingCoverUrl: true, landingSecondaryCoverUrl: true }
    });

    let finalLogoUrl = logoUrl;
    let finalCoverUrl = landingCoverUrl;
    let finalSecondaryCoverUrl = landingSecondaryCoverUrl;

    if (logoUrl && logoUrl.startsWith("data:image/")) {
      if (existing?.logoUrl) await deleteFromR2(existing.logoUrl);
      finalLogoUrl = await uploadBase64ToR2(logoUrl, `logo_${slug}`);
    } else if (logoUrl === null && existing?.logoUrl) {
      await deleteFromR2(existing.logoUrl);
    }

    if (landingCoverUrl && landingCoverUrl.startsWith("data:image/")) {
      if (existing?.landingCoverUrl) await deleteFromR2(existing.landingCoverUrl);
      finalCoverUrl = await uploadBase64ToR2(landingCoverUrl, `cover_${slug}`);
    } else if (landingCoverUrl === null && existing?.landingCoverUrl) {
      await deleteFromR2(existing.landingCoverUrl);
    }

    if (landingSecondaryCoverUrl && landingSecondaryCoverUrl.startsWith("data:image/")) {
      if (existing?.landingSecondaryCoverUrl) await deleteFromR2(existing.landingSecondaryCoverUrl);
      finalSecondaryCoverUrl = await uploadBase64ToR2(landingSecondaryCoverUrl, `seccover_${slug}`);
    } else if (landingSecondaryCoverUrl === null && existing?.landingSecondaryCoverUrl) {
      await deleteFromR2(existing.landingSecondaryCoverUrl);
    }
  ```
  En la consulta `prisma.business.update`, reemplazar `logoUrl`, `landingCoverUrl` y `landingSecondaryCoverUrl` por los valores finales sanitizados:
  ```typescript
        logoUrl: finalLogoUrl === undefined ? undefined : finalLogoUrl,
        landingCoverUrl: finalCoverUrl === undefined ? undefined : finalCoverUrl,
        landingSecondaryCoverUrl: finalSecondaryCoverUrl === undefined ? undefined : finalSecondaryCoverUrl,
  ```

---

### Tarea 5: Actualizar APIs de Servicios y Menú
**Archivos:**
- Modificar: `src/app/api/services/route.ts`
- Modificar: `src/app/api/menu/route.ts`

- [ ] **Paso 1: Aplicar carga de R2 y borrado al eliminar en la API de Servicios**
  En [route.ts](file:///Users/dekgiovannirepetto/Documents/DEVELOPER/Agenda%20Link/src/app/api/services/route.ts), importar helpers:
  ```typescript
  import { uploadBase64ToR2, deleteFromR2 } from "@/lib/r2";
  ```
  En el método `POST`, subir la imagen a R2 si es Base64:
  ```typescript
      const finalImageUrl = await uploadBase64ToR2(imageUrl, `service_${slug}`);
  ```
  Pasar `finalImageUrl || null` al campo `imageUrl` de la creación.
  
  En el método `DELETE`, recuperar el servicio por ID para eliminar su imagen antes de borrar el registro de la base de datos:
  ```typescript
      const service = await prisma.service.findUnique({ where: { id } });
      if (service?.imageUrl) {
        await deleteFromR2(service.imageUrl);
      }
      await prisma.service.delete({ where: { id } });
  ```

- [ ] **Paso 2: Aplicar carga de R2 y borrado al eliminar en la API del Menú**
  En [route.ts](file:///Users/dekgiovannirepetto/Documents/DEVELOPER/Agenda%20Link/src/app/api/menu/route.ts), importar helpers:
  ```typescript
  import { uploadBase64ToR2, deleteFromR2 } from "@/lib/r2";
  ```
  En el método `POST`, subir la imagen a R2 si es Base64:
  ```typescript
      const finalImageUrl = await uploadBase64ToR2(imageUrl, `menu_${slug}`);
  ```
  Pasar `finalImageUrl || null` al campo `imageUrl` de la creación.

  En el método `DELETE`, recuperar el plato por ID para eliminar su imagen antes de borrar el registro de la base de datos:
  ```typescript
      const menuItem = await prisma.menuItem.findUnique({ where: { id } });
      if (menuItem?.imageUrl) {
        await deleteFromR2(menuItem.imageUrl);
      }
      await prisma.menuItem.delete({ where: { id } });
  ```

---

### Tarea 6: Compilación y Verificación
- [ ] **Paso 1: Ejecutar la compilación del proyecto para asegurar que no hay errores de tipo o referencias rotas**
  Ejecutar: `npm run build`
  Resultado esperado: Compilación exitosa, sin errores de tipado o de dependencias de Next.js.
- [ ] **Paso 2: Ejecutar el linter para asegurar estilo limpio**
  Ejecutar: `npm run lint`
  Resultado esperado: 0 errores de ESLint.

---

## Plan de Verificación

### Pruebas Automatizadas
*   Correr la compilación: `npm run build`
*   Correr el linter: `npm run lint`

### Pruebas Manuales
1.  **Carga de Imágenes (Administrador):** Ir a la vista `/admin/estudio-creativo` -> pestaña "Personalizar Landing". Subir un nuevo logotipo o banner y hacer clic en "Guardar Cambios".
2.  **Verificación del Almacenamiento:** Inspeccionar la base de datos SQLite o los logs para confirmar que el campo no contiene la string Base64 gigante, sino una URL estructurada `/api/media/logo_estudio-creativo_xxxx.png`.
3.  **Verificación de Visualización:** Cargar la landing page pública `/estudio-creativo` y verificar que la imagen del logo y banner carguen perfectamente y sean servidas a través del endpoint `/api/media/...`.
4.  **Verificación de Eliminación:** Reemplazar un banner por otro, guardar, y confirmar que la imagen antigua es eliminada del almacenamiento local/R2 sin dejar archivos huérfanos.
