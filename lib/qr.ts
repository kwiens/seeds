import QRCode from "qrcode";

// Favicon paths from app/icon.svg (viewBox 0 0 353 336)
const FAVICON_PATHS = `<path d="M219.205 113.003V0H133.789V113.003L176.5 171.846L219.205 113.003Z" fill="#75BB23"/>
    <path d="M176.5 171.846V244.576L242.853 336L311.96 285.744L245.601 194.32L176.5 171.846Z" fill="#4285F4"/>
    <path d="M245.601 194.32L353 159.392L326.604 78.0753L219.205 113.003L176.5 171.846L245.601 194.32Z" fill="#FF68FF"/>
    <path d="M133.789 113.003L26.3958 78.0753L0 159.392L107.399 194.32L176.5 171.846L133.789 113.003Z" fill="#FFD208"/>
    <path d="M107.399 194.32L41.0404 285.744L110.147 336L176.5 244.576V171.846L107.399 194.32Z" fill="#FE6A46"/>`;

const ICON_W = 353;
const ICON_H = 336;

export function generateQrSvg(url: string): string {
  const qr = QRCode.create(url, { errorCorrectionLevel: "H" });
  const { size, data } = qr.modules;

  const moduleSize = 10;
  const margin = 4;
  const totalSize = (size + margin * 2) * moduleSize;

  // Build single path for all dark modules as rounded dots
  const r = moduleSize / 2;
  let pathData = "";
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (data[y * size + x]) {
        const cx = (x + margin) * moduleSize + r;
        const cy = (y + margin) * moduleSize + r;
        pathData += `M${cx - r},${cy}a${r},${r},0,1,0,${moduleSize},0a${r},${r},0,1,0,-${moduleSize},0`;
      }
    }
  }

  // Center logo area — ~22% of total size, with 1-module padding
  const logoArea = totalSize * 0.22;
  const pad = moduleSize;
  const cx = (totalSize - logoArea) / 2;
  const cy = (totalSize - logoArea) / 2;

  // Scale favicon to fit, preserving aspect ratio
  const scale = logoArea / Math.max(ICON_W, ICON_H);
  const scaledW = ICON_W * scale;
  const scaledH = ICON_H * scale;
  const ox = cx + (logoArea - scaledW) / 2;
  const oy = cy + (logoArea - scaledH) / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${totalSize}" height="${totalSize}">
  <rect width="${totalSize}" height="${totalSize}" fill="white"/>
  <path d="${pathData}" fill="black"/>
  <rect x="${cx - pad}" y="${cy - pad}" width="${logoArea + pad * 2}" height="${logoArea + pad * 2}" rx="${moduleSize}" fill="white"/>
  <g transform="translate(${ox},${oy}) scale(${scale})">
    ${FAVICON_PATHS}
  </g>
</svg>`;
}
