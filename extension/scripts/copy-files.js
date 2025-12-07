// scripts/copy-files.js
// Copies manifest and icons to dist folder after build
import { copyFileSync, mkdirSync, existsSync, readdirSync, renameSync, rmSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const distDir = join(rootDir, "dist");
const publicDir = join(rootDir, "public");

// Ensure directories exist
if (!existsSync(distDir)) mkdirSync(distDir, { recursive: true });
if (!existsSync(join(distDir, "icons"))) mkdirSync(join(distDir, "icons"), { recursive: true });
if (!existsSync(join(distDir, "popup"))) mkdirSync(join(distDir, "popup"), { recursive: true });

// Copy manifest.json
const manifestSrc = join(publicDir, "manifest.json");
const manifestDest = join(distDir, "manifest.json");
if (existsSync(manifestSrc)) {
  copyFileSync(manifestSrc, manifestDest);
  console.log("✓ Copied manifest.json");
}

// Copy icons
const iconsDir = join(publicDir, "icons");
if (existsSync(iconsDir)) {
  const icons = readdirSync(iconsDir);
  icons.forEach((icon) => {
    if (icon.endsWith(".png") || icon.endsWith(".svg")) {
      copyFileSync(join(iconsDir, icon), join(distDir, "icons", icon));
      console.log(`✓ Copied ${icon}`);
    }
  });
}

// Fix popup HTML location - move from dist/src/popup to dist/popup
const wrongPopupDir = join(distDir, "src", "popup");
const correctPopupDir = join(distDir, "popup");
if (existsSync(wrongPopupDir)) {
  const files = readdirSync(wrongPopupDir);
  files.forEach((file) => {
    const src = join(wrongPopupDir, file);
    const dest = join(correctPopupDir, file);
    copyFileSync(src, dest);
    console.log(`✓ Moved popup/${file}`);
  });
  // Clean up src directory
  rmSync(join(distDir, "src"), { recursive: true, force: true });
  console.log("✓ Cleaned up src directory");
}

console.log("\n✅ All files copied successfully!");
