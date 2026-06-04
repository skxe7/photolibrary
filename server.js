const express = require("express");
const multer = require("multer");
const fs = require("fs");
const ExifParser = require("exif-parser");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads"),
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

// upload
app.post("/upload", upload.single("file"), (req, res) => {
  res.json({ ok: true });
});

// files + year detect
app.get("/files", (req, res) => {
  const files = fs.readdirSync("uploads");

  const result = files.map(f => {
    const path = "uploads/" + f;

    let year = "unknown";

    try {
      const buffer = fs.readFileSync(path);
      const parser = ExifParser.create(buffer);
      const exif = parser.parse();

      if (exif && exif.tags && exif.tags.DateTimeOriginal) {
        year = new Date(exif.tags.DateTimeOriginal * 1000)
          .getFullYear()
          .toString();
      }
    } catch (e) {
      // если нет exif (видео/файлы) — fallback
      year = new Date(parseInt(f.split("-")[0])).getFullYear().toString();
    }

    return { file: f, year };
  });

  res.json(result);
});

app.listen(PORT, () => {
  console.log("running " + PORT);
});
