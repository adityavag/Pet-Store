const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.use(express.json());

const REGION = process.env.AWS_REGION || 'ap-southeast-2';
const s3Client = new S3Client({
  region: REGION
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

async function uploadToS3(file) {
  const fileExtension = file.originalname.split('.').pop();
  const fileKey = `pets/${crypto.randomBytes(16).toString('hex')}.${fileExtension}`;
  const bucketName = process.env.S3_BUCKET_NAME || 'pet-store-v2';

  await s3Client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: fileKey,
    Body: file.buffer,
    ContentType: file.mimetype
  }));

  return `https://${bucketName}.s3.${REGION}.amazonaws.com/${fileKey}`;
}

app.use(cors());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'pet_store',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

app.get('/pets', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM pets');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/pets/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM pets WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Pet not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/pets', upload.single('image'), async (req, res) => {
  const { name, species, age } = req.body;
  if (!name || !species || age === undefined) {
    return res.status(400).json({ error: 'Name, species, and age are required' });
  }
  
  let imageUrl = null;
  if (req.file) {
    try {
      imageUrl = await uploadToS3(req.file);
    } catch (err) {
      return res.status(500).json({ error: 'Failed to upload image to S3: ' + err.message });
    }
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO pets (name, species, age, image_url) VALUES (?, ?, ?, ?)',
      [name, species, parseInt(age), imageUrl]
    );
    res.status(201).json({ id: result.insertId, name, species, age: parseInt(age), image_url: imageUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/pets/:id', upload.single('image'), async (req, res) => {
  const { name, species, age } = req.body;
  if (!name || !species || age === undefined) {
    return res.status(400).json({ error: 'Name, species, and age are required' });
  }
  try {
    const [existing] = await pool.query('SELECT image_url FROM pets WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Pet not found' });
    }
    
    let finalImageUrl = existing[0].image_url;
    if (req.file) {
      try {
        finalImageUrl = await uploadToS3(req.file);
      } catch (err) {
        return res.status(500).json({ error: 'Failed to upload image to S3: ' + err.message });
      }
    } else if (req.body.removeImage === 'true') {
      finalImageUrl = null;
    }

    const [result] = await pool.query(
      'UPDATE pets SET name = ?, species = ?, age = ?, image_url = ? WHERE id = ?',
      [name, species, parseInt(age), finalImageUrl, req.params.id]
    );
    res.json({ id: parseInt(req.params.id), name, species, age: parseInt(age), image_url: finalImageUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/pets/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM pets WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Pet not found' });
    }
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
