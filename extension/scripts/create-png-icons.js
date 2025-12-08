// scripts/create-png-icons.js
// Creates PNG icons using pure Node.js (no external dependencies)
// Run: node scripts/create-png-icons.js

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import zlib from "zlib";

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, "..", "public", "icons");

if (!existsSync(iconsDir)) {
  mkdirSync(iconsDir, { recursive: true });
}

// CRC32 lookup table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(data) {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = crcTable[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const typeBytes = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);

  const crcData = Buffer.concat([typeBytes, data]);
  const crcValue = crc32(crcData);
  const crcBytes = Buffer.alloc(4);
  crcBytes.writeUInt32BE(crcValue);

  return Buffer.concat([length, typeBytes, data, crcBytes]);
}

function createPNG(size) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr.writeUInt8(8, 8); // bit depth
  ihdr.writeUInt8(6, 9); // color type (RGBA)
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace

  // Generate image data (RGBA)
  const rawData = [];
  const center = size / 2;
  const radius = size / 2 - 1;

  for (let y = 0; y < size; y++) {
    rawData.push(0); // Filter byte (None)
    for (let x = 0; x < size; x++) {
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= radius) {
        // Inside circle - gradient blue
        const t = dist / radius;

        // Water blue gradient: from #0ea5e9 to #3b82f6
        const r1 = 14,
          g1 = 165,
          b1 = 233;
        const r2 = 59,
          g2 = 130,
          b2 = 246;

        const r = Math.round(r1 + (r2 - r1) * t);
        const g = Math.round(g1 + (g2 - g1) * t);
        const b = Math.round(b1 + (b2 - b1) * t);

        // Check if inside water drop shape
        const dropCx = center;
        const dropCy = center;
        const dropScale = 0.45;
        const dropWidth = size * dropScale;
        const dropHeight = size * dropScale * 1.3;

        // Simple oval/drop detection
        const normalizedX = (x - dropCx) / (dropWidth * 0.8);
        const normalizedY = (y - dropCy + dropHeight * 0.2) / dropHeight;
        const inDrop = normalizedX * normalizedX + normalizedY * normalizedY < 1 && y > center - dropHeight * 0.6;

        if (inDrop) {
          // White drop
          rawData.push(255, 255, 255, 230);
        } else {
          rawData.push(r, g, b, 255);
        }
      } else {
        // Outside - transparent
        rawData.push(0, 0, 0, 0);
      }
    }
  }

  // Compress data
  const compressed = zlib.deflateSync(Buffer.from(rawData), { level: 9 });

  // Build PNG
  const ihdrChunk = createChunk("IHDR", ihdr);
  const idatChunk = createChunk("IDAT", compressed);
  const iendChunk = createChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Generate icons
const sizes = [16, 32, 48, 128];

console.log("Creating PNG icons...\n");

for (const size of sizes) {
  const png = createPNG(size);
  const filename = `icon${size}.png`;
  writeFileSync(join(iconsDir, filename), png);
  console.log(`✓ Created ${filename} (${png.length} bytes)`);
}

console.log("\n✅ All icons created successfully!");
