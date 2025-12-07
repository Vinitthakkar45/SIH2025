// Icon generation script - creates simple blue circle icons
// Run: node scripts/make-icons.mjs
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { createCanvas } from "canvas";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, "..", "public", "icons");

if (!existsSync(iconsDir)) {
  mkdirSync(iconsDir, { recursive: true });
}

const sizes = [16, 32, 48, 128];

for (const size of sizes) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  // Draw gradient background
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, "#0ea5e9");
  gradient.addColorStop(1, "#3b82f6");

  // Draw circle
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  // Draw water drop shape
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.beginPath();
  const dropSize = size * 0.35;
  const cx = size / 2;
  const cy = size / 2;

  // Simple drop path
  ctx.moveTo(cx, cy - dropSize);
  ctx.bezierCurveTo(cx + dropSize, cy - dropSize * 0.3, cx + dropSize, cy + dropSize * 0.7, cx, cy + dropSize);
  ctx.bezierCurveTo(cx - dropSize, cy + dropSize * 0.7, cx - dropSize, cy - dropSize * 0.3, cx, cy - dropSize);
  ctx.fill();

  // Save PNG
  const buffer = canvas.toBuffer("image/png");
  writeFileSync(join(iconsDir, `icon${size}.png`), buffer);
  console.log(`Created icon${size}.png`);
}

console.log("Done!");
