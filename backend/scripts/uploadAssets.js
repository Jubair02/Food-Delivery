/**
 * One-time: upload the bundled food + menu images to Cloudinary with stable
 * public_ids (food-delivery/seed/<name>). Re-runnable (overwrite: true).
 *
 * Usage: node scripts/uploadAssets.js
 */
import "dotenv/config";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { v2 as cloudinary } from "cloudinary";

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error("Missing CLOUDINARY_* env vars in backend/.env");
  process.exit(1);
}
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(__dirname, "..", "..", "fronted", "src", "assets");

const names = [
  ...Array.from({ length: 32 }, (_, i) => `food_${i + 1}`),
  ...Array.from({ length: 8 }, (_, i) => `menu_${i + 1}`),
];

const uploadOne = async (name) => {
  const file = path.join(assetsDir, `${name}.png`);
  if (!fs.existsSync(file)) throw new Error(`missing ${file}`);
  const res = await cloudinary.uploader.upload(file, {
    public_id: `food-delivery/seed/${name}`,
    overwrite: true,
    resource_type: "image",
  });
  return { name, url: res.secure_url };
};

const run = async () => {
  const results = [];
  // small concurrency
  for (let i = 0; i < names.length; i += 8) {
    const batch = names.slice(i, i + 8);
    const done = await Promise.all(batch.map(uploadOne));
    results.push(...done);
    console.log(`uploaded ${results.length}/${names.length}`);
  }
  console.log("\nUnversioned base URL pattern:");
  console.log(`https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/food-delivery/seed/<name>.png`);
  console.log("\nSample:", results[0]?.url);
  console.log("\nAll done. Cloud name:", CLOUDINARY_CLOUD_NAME);
};

run().catch((e) => { console.error("Upload failed:", e.message); process.exit(1); });
