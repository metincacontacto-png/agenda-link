# Contrato público de disponibilidad

`GET /api/availability?slug=<slug>&date=YYYY-MM-DD` es una ruta pública. Al elegir servicio y profesional también recibe `serviceId` y `professionalId`, y calcula slots en la zona horaria del negocio.

Respuesta `200`:

```json
{
  "business": {
    "id": "...",
    "name": "...",
    "slug": "...",
    "category": "...",
    "currency": "CLP",
    "timezone": "America/Santiago",
    "logoUrl": null,
    "landingTitle": null,
    "landingSubtitle": null,
    "landingAbout": null,
    "landingCoverUrl": null,
    "landingSecondaryCoverUrl": null,
    "landingPhone": null,
    "landingAddress": null,
    "landingHours": null,
    "landingFeaturesJson": null,
    "landingTestimonialsJson": null,
    "services": [{ "id": "...", "name": "...", "duration": 60, "price": 25000, "imageUrl": null }],
    "professionals": [{ "id": "...", "name": "...", "avatar": null }]
  },
  "availableSlots": ["09:00", "09:30"]
}
```

Los horarios se expresan como `HH:mm` en `business.timezone`; las citas se guardan como instantes UTC. La respuesta omite email, owner, plan, información de billing, registros internos y citas/clientes existentes. Sin `serviceId`/`professionalId`, devuelve los datos públicos de landing y una lista de slots vacía.

Errores esperados: `400` para parámetros inválidos, `404` para negocio/servicio/profesional desconocido y `500` para fallo de servidor.
