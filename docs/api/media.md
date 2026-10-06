# Imágenes y Cloudflare R2

Los uploads Base64 aceptan únicamente PNG, JPEG y WebP hasta 5 MiB. El servidor valida el MIME declarado contra la firma binaria y genera una key propia aleatoria; no usa nombres proporcionados por el cliente.

- En producción, el binding `BUCKET` es obligatorio. Si falta, el upload falla explícitamente y no se guarda Base64 en D1.
- El fallback Base64 solo se permite en `development` cuando no existe un binding local.
- URLs externas, si se usan, deben ser HTTPS. Las referencias internas `/api/media/...` y las keys alfanuméricas heredadas se validan antes de guardar o borrar.
- `GET /api/media/[key]` solo sirve keys de la aplicación, fuerza el MIME de las extensiones admitidas, añade `X-Content-Type-Options: nosniff` y responde `404` ante traversal u otras keys.

El límite `MAX_MEDIA_BYTES` está en `src/lib/media.ts`. Si cambia, actualiza la validación y las pruebas de `tests/media-security.test.mjs` al mismo tiempo.
