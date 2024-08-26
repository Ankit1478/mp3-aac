const express = require('express');
const app = express();
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

app.use(cors());

// Ensure uploads and public directories exist
const uploadsDir = path.join(__dirname, 'uploads');
const publicDir = path.join(__dirname, 'public');
fs.mkdirSync(uploadsDir, { recursive: true });
fs.mkdirSync(publicDir, { recursive: true });

const upload = multer({ dest: uploadsDir });

app.use(express.static(publicDir));

// Set the path to the ffmpeg binary
ffmpeg.setFfmpegPath(ffmpegStatic);

// Function to convert MP3 to AAC
function convertToAAC(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions('-c:a aac')
      .outputOptions('-b:a 192k')
      .save(outputPath)
      .on('end', resolve)
      .on('error', reject);
  });
}

app.post('/convert', upload.single('mp3File'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const inputPath = req.file.path;
  const outputPath = path.join(publicDir, `${req.file.filename}.aac`);

  try {
    await convertToAAC(inputPath, outputPath);
    const downloadUrl = `${req.protocol}://${req.get('host')}/${req.file.filename}.aac`;
    res.json({ success: true, downloadUrl });
  } catch (error) {
    console.error('Conversion error:', error);
    res.status(500).json({ success: false, error: 'Error during conversion' });
  } finally {
    // Clean up the input file
    fs.unlink(inputPath, (err) => {
      if (err) console.error('Error deleting input file:', err);
    });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});