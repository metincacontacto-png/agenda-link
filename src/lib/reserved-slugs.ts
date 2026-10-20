export const RESERVED_SLUGS = new Set([
  'robots.txt',
  'sitemap.xml',
  'favicon.ico',
  'manifest.webmanifest',
  'icon.png',
  'logo.png',
  'og.png',
  'login',
  'logout',
  'registro',
  'register',
  'signup',
  'panel',
  'admin',
  'api',
  'app',
  'auth',
  'terminos',
  'privacidad',
  'legal',
  'ayuda',
  'soporte',
  'precios',
  'blog',
  'www',
  'mail',
  'agendalink',
  'ganimides',
  'linki',
  'dashboard',
  'settings',
  'cuenta',
  '_next',
  'static',
]);

export const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/;

export function isValidSlug(slug: string): boolean {
  if (!slug) return false;
  const clean = slug.toLowerCase().trim();
  if (!SLUG_REGEX.test(clean)) return false;
  if (RESERVED_SLUGS.has(clean)) return false;
  return true;
}

export function cleanSlugInput(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}
