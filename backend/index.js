const express = require("express");
const fs = require("fs");
const multer = require("multer");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const upload = multer({ dest: "uploads/" });

// ✅ GET site.json
app.get("/api/site", (req, res) => {
  try {
    const data = fs.readFileSync("site.json", "utf8");
    res.json(JSON.parse(data));
  } catch (err) {
    res.status(500).json({ error: "Error reading site.json" });
  }
});

// ✅ UPDATE site.json
app.post("/api/site", (req, res) => {
  try {
    fs.writeFileSync("site.json", JSON.stringify(req.body, null, 2));
    res.json({ message: "Site updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Error writing site.json" });
  }
});

// ✅ Upload gallery images
app.post("/api/gallery", upload.single("image"), (req, res) => {
  try {
    const data = fs.readFileSync("site.json", "utf8");
    const site = JSON.parse(data);

    site.gallery.push({
      image: req.file.path, // Render will serve this from /uploads
      caption: req.body.caption
    });

    fs.writeFileSync("site.json", JSON.stringify(site, null, 2));
    res.json({ message: "Gallery updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Error updating gallery" });
  }
});

app.listen(3000, () => console.log("✅ API running on http://localhost:3000"));
