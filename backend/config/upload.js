import multer from "multer";
import path from "path";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

// Local fallback dir (used only when Cloudinary isn't configured).
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Cloudinary is used when all three credentials are present; otherwise disk.
const useCloudinary = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

let storage;

if (useCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "food-delivery",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      transformation: [{ width: 800, height: 800, crop: "limit" }], // keep images sane
    },
  });
  console.log("🖼️  Image uploads → Cloudinary");
} else {
  storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || ".png";
      const base = path.basename(file.originalname, ext).replace(/[^a-z0-9]/gi, "_").toLowerCase();
      const unique = `${base}_${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, unique);
    },
  });
  console.log("🖼️  Image uploads → local disk (uploads/). Set CLOUDINARY_* for durable storage.");
}

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Only image files are allowed"));
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

export { UPLOAD_DIR };
export const isCloudinary = useCloudinary;

/**
 * Value to persist in a food document's `image` field:
 *  - Cloudinary → the full secure URL (multer sets file.path)
 *  - Local disk → just the filename (file.filename)
 */
export const storedImageValue = (file) => (useCloudinary ? file.path : file.filename);
