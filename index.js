require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const shortid = require("shortid");
const isUrl = require('is-url');
const isUrlHttp = require('is-url-http');
const app = express();

// Connect DB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define URL schema and model
const urlSchema = new mongoose.Schema({
  originalUrl: { type: String, required: true },
  shortUrl: { type: String, required: true, unique: true },
});

const Url = mongoose.model("Url", urlSchema);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Function to generate a unique short URL
async function generateUniqueShortUrl() {
  let shortUrl;
  let urlExists = true;

  while (urlExists) {
    shortUrl = shortid.generate();
    urlExists = await Url.findOne({ shortUrl });
  }

  return shortUrl;
}

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

app.post("/api/shorturl", async (req, res) => {
  try {
    const originalUrl = req.body.url;
    if (!isUrl(originalUrl) || !isUrlHttp(originalUrl)) {
      return res.json({ error: "invalid url" });
    }

    const shortUrl = await generateUniqueShortUrl();

    const url = new Url({ originalUrl, shortUrl });
    await url.save();

    res.json({ original_url: originalUrl, short_url: shortUrl });
  } catch (err) {
    res.json("Internal Server Error");
  }
});

app.get("/api/shorturl/:shortUrl", async (req, res) => {
  try {
    const { shortUrl } = req.params;
    const url = await Url.findOne({ shortUrl });

    if (url) {
      res.redirect(url.originalUrl);
    } else {
      res.json({ error: "invalid url" });
    }
  } catch (err) {
    res.json("Internal Server Error");
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
