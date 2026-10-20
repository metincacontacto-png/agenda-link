const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generateOg() {
  const width = 1200;
  const height = 630;

  // Read logo as base64 data URI to embed directly into SVG or composite
  const logoPath = path.join(__dirname, '../public/logo-horizontal-blanco.png');
  const logoBuffer = fs.readFileSync(logoPath);
  const logoResized = await sharp(logoBuffer)
    .resize({ width: 320 })
    .toBuffer();

  const logoBase64 = `data:image/png;base64,${logoResized.toString('base64')}`;

  const svg = `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0052cc" />
      <stop offset="50%" stop-color="#00c6ff" />
      <stop offset="100%" stop-color="#0070f3" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="rgba(0, 30, 90, 0.25)" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#bg)" />

  <!-- Subtle glowing organic background shapes -->
  <circle cx="1080" cy="120" r="380" fill="rgba(255, 255, 255, 0.08)" filter="blur(60px)" />
  <circle cx="150" cy="550" r="300" fill="rgba(0, 82, 204, 0.2)" filter="blur(50px)" />

  <!-- Top Logo (80px margin) -->
  <image href="${logoBase64}" x="80" y="80" width="320" height="58" />

  <!-- Main Headline (tracking -1.5px, 800 weight) -->
  <g fill="#ffffff" font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" font-weight="800" letter-spacing="-1.5">
    <text x="80" y="270" font-size="76" filter="drop-shadow(0 4px 12px rgba(0, 20, 60, 0.2))">¿Tienes hora?</text>
    <text x="80" y="360" font-size="76" filter="drop-shadow(0 4px 12px rgba(0, 20, 60, 0.2))">Pásale el link.</text>
  </g>

  <!-- Subtitle -->
  <text x="80" y="425" fill="rgba(255, 255, 255, 0.92)" font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" font-size="24" font-weight="500">
    Tu agenda online en un solo link · Listo en una tarde, sin contratos
  </text>

  <!-- White 85% pill with agendalink.cl/tunegocio -->
  <g transform="translate(80, 480)" filter="url(#shadow)">
    <rect width="400" height="66" rx="33" fill="rgba(255, 255, 255, 0.85)" />
    <!-- Link Icon inside pill -->
    <path d="M40 33 L48 33 M58 33 L66 33 M44 28 C41.2 28 39 30.2 39 33 C39 35.8 41.2 38 44 38 L49 38 C51.8 38 54 35.8 54 33 M62 38 C64.8 38 67 35.8 67 33 C67 30.2 64.8 28 62 28 L57 28 C54.2 28 52 30.2 52 33" stroke="#0052cc" stroke-width="2.5" stroke-linecap="round" fill="none" transform="translate(0, 0)" />
    <text x="50" y="41" fill="#0052cc" font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" font-size="22" font-weight="700" letter-spacing="-0.3">
      agendalink.cl/<tspan fill="#0f172a">tunegocio</tspan>
    </text>
  </g>

  <!-- Verified Badge on the right side -->
  <g transform="translate(870, 485)">
    <rect width="250" height="56" rx="28" fill="rgba(255, 255, 255, 0.15)" stroke="rgba(255, 255, 255, 0.28)" stroke-width="1.5" />
    <text x="125" y="35" text-anchor="middle" fill="#ffffff" font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" font-size="17" font-weight="600">
      🇨🇱 Hecho para Chile
    </text>
  </g>
</svg>
`;

  const outputPath = path.join(__dirname, '../public/og.png');
  await sharp(Buffer.from(svg))
    .png({ quality: 95 })
    .toFile(outputPath);

  console.log('og.png generated successfully at:', outputPath);
}

generateOg().catch(console.error);
