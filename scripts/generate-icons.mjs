// One-off script: renders a simple "FC" monogram (dark bg, Ferrari-red
// accent, angled notch corner matching the app's card styling) to the PWA
// icon PNGs. Re-run with `node scripts/generate-icons.mjs` if you swap in a
// real logo later — just replace this file's SVG or point elsewhere.
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BG = "#0E0F10";
const ACCENT = "#FF2800";
const OUT_DIR = path.resolve(import.meta.dirname, "../public/icons");

function monogramSvg({ size, notch, glyphScale, applePad = 0 }) {
  const n = notch;
  const cx = size / 2;
  const cy = size / 2 + size * 0.02;
  const fontSize = size * glyphScale;
  const pad = applePad;

  return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="notchClip">
      <polygon points="${pad},${pad} ${size - pad},${pad} ${size - pad},${size - pad - n} ${size - pad - n},${size - pad} ${pad},${size - pad}" />
    </clipPath>
  </defs>
  <rect x="${pad}" y="${pad}" width="${size - pad * 2}" height="${size - pad * 2}" fill="${BG}" clip-path="url(#notchClip)" />
  <rect x="${pad}" y="${pad}" width="${size - pad * 2}" height="${size * 0.045}" fill="${ACCENT}" clip-path="url(#notchClip)" />
  <text
    x="${cx}"
    y="${cy}"
    font-family="Arial Black, Arial, sans-serif"
    font-weight="900"
    font-style="italic"
    font-size="${fontSize}"
    fill="${ACCENT}"
    text-anchor="middle"
    dominant-baseline="middle"
    transform="skewX(-6) translate(${-cy * 0.11} 0)"
  >FC</text>
</svg>`;
}

async function render(name, svg, size) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(path.join(OUT_DIR, name));
  console.log("wrote", name);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  await render("icon-192.png", monogramSvg({ size: 192, notch: 26, glyphScale: 0.46 }), 192);
  await render("icon-512.png", monogramSvg({ size: 512, notch: 70, glyphScale: 0.46 }), 512);
  // Maskable icons get cropped into arbitrary shapes (circle, squircle...) by
  // the OS, so keep the glyph well inside the safe zone with a larger margin.
  await render("icon-512-maskable.png", monogramSvg({ size: 512, notch: 0, glyphScale: 0.34 }), 512);
  await render(
    "apple-touch-icon.png",
    monogramSvg({ size: 180, notch: 0, glyphScale: 0.46, applePad: 0 }),
    180
  );

  const faviconSvg = monogramSvg({ size: 64, notch: 8, glyphScale: 0.46 });
  await writeFile(path.resolve(import.meta.dirname, "../public/favicon.svg"), faviconSvg.trim());
  console.log("wrote favicon.svg");
}

main();
