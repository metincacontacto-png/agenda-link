import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AgendaLink',
    short_name: 'AgendaLink',
    description: 'Un link. Todo resuelto. Gestión de citas y reservas para tu negocio.',
    start_url: '/admin',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2563eb',
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/isotype.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
