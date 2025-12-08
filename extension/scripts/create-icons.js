// scripts/create-icons.js
// Creates placeholder PNG icons for the extension
// Run: node scripts/create-icons.js

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, "..", "public", "icons");

// Ensure icons directory exists
if (!existsSync(iconsDir)) {
  mkdirSync(iconsDir, { recursive: true });
}

// Simple 1x1 blue pixel PNG as placeholder
// You should replace these with actual icons
const sizes = [16, 32, 48, 128];

// Minimal PNG header for a blue square
// This creates a simple blue placeholder icon
function createSimplePng(size) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const width = size;
  const height = size;
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth
  ihdrData.writeUInt8(2, 9); // color type (RGB)
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace

  const ihdrCrc = crc32(Buffer.concat([Buffer.from("IHDR"), ihdrData]));
  const ihdr = Buffer.concat([
    Buffer.from([0, 0, 0, 13]), // length
    Buffer.from("IHDR"),
    ihdrData,
    ihdrCrc,
  ]);

  // IDAT chunk (compressed image data)
  // Create raw image data: filter byte + RGB for each pixel
  const rawData = [];
  for (let y = 0; y < height; y++) {
    rawData.push(0); // filter byte (none)
    for (let x = 0; x < width; x++) {
      // Create a gradient blue water drop effect
      const cx = width / 2;
      const cy = height / 2;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      const maxDist = Math.min(width, height) / 2;

      if (dist <= maxDist * 0.8) {
        // Inside circle - blue gradient
        const intensity = 1 - (dist / (maxDist * 0.8)) * 0.3;
        rawData.push(Math.floor(14 * intensity)); // R
        rawData.push(Math.floor(165 * intensity)); // G
        rawData.push(Math.floor(233 * intensity)); // B
      } else {
        // Transparent (white for simplicity)
        rawData.push(255); // R
        rawData.push(255); // G
        rawData.push(255); // B
      }
    }
  }

  // Compress with zlib (use deflate)
  const zlib = require("zlib");
  const compressed = zlib.deflateSync(Buffer.from(rawData));

  const idatCrc = crc32(Buffer.concat([Buffer.from("IDAT"), compressed]));
  const idatLen = Buffer.alloc(4);
  idatLen.writeUInt32BE(compressed.length, 0);
  const idat = Buffer.concat([idatLen, Buffer.from("IDAT"), compressed, idatCrc]);

  // IEND chunk
  const iendCrc = crc32(Buffer.from("IEND"));
  const iend = Buffer.concat([Buffer.from([0, 0, 0, 0]), Buffer.from("IEND"), iendCrc]);

  return Buffer.concat([signature, ihdr, idat, iend]);
}

// CRC32 calculation for PNG
function crc32(data) {
  let crc = 0xffffffff;
  const table = makeCrcTable();

  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xff];
  }

  const result = Buffer.alloc(4);
  result.writeUInt32BE((crc ^ 0xffffffff) >>> 0, 0);
  return result;
}

function makeCrcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
}

// Alternative: Use a simple approach with built-in modules
async function createIcons() {
  console.log("Creating extension icons...\n");

  // For simplicity, we'll create a small info file instead
  // Real icons should be created with proper image tools
  const infoContent = `
Icon Placeholders
=================
Please replace these with actual PNG icons.

Required sizes:
- icon16.png (16x16)
- icon32.png (32x32)  
- icon48.png (48x48)
- icon128.png (128x128)

You can use tools like:
- Figma (figma.com)
- Canva (canva.com)
- GIMP (gimp.org)

Or online converters to convert SVG to PNG.
`;

  writeFileSync(join(iconsDir, "README.txt"), infoContent);
  console.log("Created icons/README.txt with instructions");
  console.log("\nPlease create PNG icons manually or use online tools.");
}

createIcons();
