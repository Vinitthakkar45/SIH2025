// scripts/generate-icons.js
// Run with: node scripts/generate-icons.js
// Requires: npm install sharp

import sharp from "sharp";
import { mkdirSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, "..", "public", "icons");

// Ensure icons directory exists
if (!existsSync(iconsDir)) {
  mkdirSync(iconsDir, { recursive: true });
}

// SVG template for water drop icon with gradient
const createSvg = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0ea5e9;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
    </linearGradient>
  </defs>
  <circle cx="50" cy="50" r="48" fill="url(#grad)"/>
  <path d="M50 15 L70 45 A28 28 0 1 1 30 45 Z" fill="white" fill-opacity="0.9"/>
  <circle cx="38" cy="55" r="4" fill="#0ea5e9" fill-opacity="0.5"/>
  <circle cx="55" cy="62" r="3" fill="#0ea5e9" fill-opacity="0.4"/>
</svg>
`;

const sizes = [16, 32, 48, 128];

async function generateIcons() {
  console.log("Generating extension icons...");

  for (const size of sizes) {
    const svg = Buffer.from(createSvg(size));
    const outputPath = join(iconsDir, `icon${size}.png`);

    await sharp(svg).resize(size, size).png().toFile(outputPath);

    console.log(`✓ Generated icon${size}.png`);
  }

  console.log("\nAll icons generated successfully!");
}

generateIcons().catch(console.error);
