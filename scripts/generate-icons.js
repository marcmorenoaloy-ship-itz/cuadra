const { chromium } = require('playwright');
const fs = require('fs');
// Uso: node scripts/generate-icons.js <carpeta-de-salida>  (necesita playwright)
const out = process.argv[2];

// Geometría (lienzo 1024): "C" = anillo de ahorro abierto a la derecha; moneda en la abertura.
function symbol({ cColor = '#ffffff', coin = true, mono = false, scale = 1, dx = -46 }) {
  const cx = 512 + dx, cy = 512, r = 250, w = 112;
  const a0 = (42 * Math.PI) / 180, a1 = (318 * Math.PI) / 180;
  const p = (a) => [cx + r * Math.cos(a), cy - r * Math.sin(a)];
  const [x0, y0] = p(a0), [x1, y1] = p(a1);
  const arc = `<path d="M ${x0} ${y0} A ${r} ${r} 0 1 0 ${x1} ${y1}" fill="none" stroke="${cColor}" stroke-width="${w}" stroke-linecap="round"/>`;
  const kx = cx + r + 4, ky = cy, kr = 100;
  const coinSvg = !coin ? '' : mono
    ? `<circle cx="${kx}" cy="${ky}" r="${kr}" fill="${cColor}"/>`
    : `<circle cx="${kx}" cy="${ky}" r="${kr}" fill="url(#gold)"/>
       <circle cx="${kx}" cy="${ky}" r="${kr - 20}" fill="none" stroke="#fff3c4" stroke-opacity=".6" stroke-width="9"/>
       <text x="${kx}" y="${ky + 36}" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="104" fill="#a8680a">€</text>`;
  return `<g transform="translate(512 512) scale(${scale}) translate(-512 -512)">${arc}${coinSvg}</g>`;
}
const defs = `<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#11604f"/><stop offset="1" stop-color="#1f9677"/></linearGradient>
  <radialGradient id="glow" cx=".28" cy=".2" r=".75"><stop offset="0" stop-color="#ffffff" stop-opacity=".16"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
  <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd970"/><stop offset="1" stop-color="#f0a92c"/></linearGradient>
  <filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="14" stdDeviation="18" flood-color="#062a22" flood-opacity=".35"/></filter>
</defs>`;
const bg = `<rect width="1024" height="1024" fill="url(#bg)"/><rect width="1024" height="1024" fill="url(#glow)"/>`;
const svg = (body, size = 1024) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">${defs}${body}</svg>`;

const files = {
  'icon.png': [svg(bg + `<g filter="url(#sh)">${symbol({})}</g>`), 1024, false],
  'android-icon-background.png': [svg(bg), 1024, false],
  'android-icon-foreground.png': [svg(`<g filter="url(#sh)">${symbol({ scale: 0.62, dx: -30 })}</g>`), 1024, true],
  'android-icon-monochrome.png': [svg(symbol({ scale: 0.62, dx: -30, mono: true })), 1024, true],
  'splash-icon.png': [svg(symbol({})), 400, true],
  'favicon.png': [svg(`<rect width="1024" height="1024" rx="230" fill="url(#bg)"/>` + symbol({ scale: 1.08 })), 48, true],
  'preview.png': [null, 0, false],
};

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const [name, [s, size, transparent]] of Object.entries(files)) {
    if (!s) continue;
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<html><body style="margin:0;background:transparent">${s.replace('width="1024" height="1024" viewBox', `width="${size}" height="${size}" viewBox`)}</body></html>`);
    await page.locator('svg').screenshot({ path: `${out}/${name}`, omitBackground: transparent });
  }
  // Vista previa: icono con esquinas de iPhone en tamaño grande y pequeño, sobre fondo claro y oscuro.
  const icon = fs.readFileSync(`${out}/icon.png`).toString('base64');
  const tile = (bgc, label) => `<div style="background:${bgc};padding:40px;display:flex;gap:40px;align-items:center;font:600 22px -apple-system,Arial;color:${label}">
    <img src="data:image/png;base64,${icon}" style="width:240px;border-radius:54px">
    <div style="display:flex;flex-direction:column;align-items:center;gap:8px"><img src="data:image/png;base64,${icon}" style="width:120px;border-radius:27px">Cuadra</div>
    <img src="data:image/png;base64,${icon}" style="width:60px;border-radius:14px"></div>`;
  await page.setViewportSize({ width: 760, height: 640 });
  await page.setContent(`<body style="margin:0">${tile('#f2f2f7', '#111')}${tile('#111', '#eee')}</body>`);
  await page.screenshot({ path: `${out}/preview.png` });
  await browser.close();
})();
