// Generates simple on-brand SVG banners for workout cards (dark bg, red
// diagonal stripes, a barbell glyph, bold italic category label) so the
// app has real images without needing photography or an upload feature.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BG = "#0E0F10";
const ACCENT = "#FF2800";
const OUT_DIR = path.resolve(import.meta.dirname, "../public/images/workouts");

function banner(label) {
  return `
<svg width="400" height="220" viewBox="0 0 400 220" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="220" fill="${BG}" />
  <g opacity="0.5">
    <path d="M-20 40 L60 -20 M-20 90 L110 -20 M-20 140 L160 -20 M-20 190 L210 -20 M-20 240 L260 -20" stroke="#2A2C2F" stroke-width="6" />
  </g>
  <rect x="0" y="0" width="10" height="220" fill="${ACCENT}" />
  <g transform="translate(60,110)" stroke="#F5F5F0" stroke-width="7" stroke-linecap="round">
    <line x1="-90" y1="0" x2="90" y2="0" />
    <line x1="-90" y1="-22" x2="-90" y2="22" stroke-width="12" />
    <line x1="-70" y1="-16" x2="-70" y2="16" stroke-width="12" />
    <line x1="90" y1="-22" x2="90" y2="22" stroke-width="12" />
    <line x1="70" y1="-16" x2="70" y2="16" stroke-width="12" />
  </g>
  <text x="200" y="185" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-style="italic"
    font-size="30" fill="${ACCENT}" text-anchor="middle" transform="skewX(-6)">${label}</text>
</svg>`.trim();
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const banners = {
    "leg-day.svg": "LEG DAY",
    "push-day.svg": "PUSH DAY",
    "pull-day.svg": "PULL DAY",
    "custom.svg": "CUSTOM",
  };
  for (const [file, label] of Object.entries(banners)) {
    await writeFile(path.join(OUT_DIR, file), banner(label));
    console.log("wrote", file);
  }
}

main();
