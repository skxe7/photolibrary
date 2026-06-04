const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const ExifParser = require("exif-parser");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_"))
});

const upload = multer({ storage });

function getYearForFile(filename) {
  const filePath = path.join("uploads", filename);
  const ext = path.extname(filename).toLowerCase();

  try {
    const stat = fs.statSync(filePath);

    if ([".jpg", ".jpeg", ".png", ".webp", ".heic"].includes(ext)) {
      const buffer = fs.readFileSync(filePath);
      const parser = ExifParser.create(buffer);
      const exif = parser.parse();

      if (exif?.tags?.DateTimeOriginal) {
        return new Date(exif.tags.DateTimeOriginal * 1000).getFullYear().toString();
      }
    }

    return new Date(stat.mtime).getFullYear().toString();
  } catch {
    return "невідомо";
  }
}

app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ ok: false });
  res.json({ ok: true });
});

app.get("/files", (req, res) => {
  const files = fs.readdirSync("uploads")
    .map((file) => ({
      file,
      year: getYearForFile(file)
    }))
    .sort((a, b) => b.year.localeCompare(a.year) || b.file.localeCompare(a.file));

  res.json(files);
});

app.listen(PORT, () => {
  console.log("running on " + PORT);
});
