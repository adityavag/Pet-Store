const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const multer = require('multer');
const crypto = require('crypto');
const redis = require('redis');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
app.use(morgan('dev'));
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
  const bucketName = process.env.S3_BUCKET_NAME;

  await s3Client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: fileKey,
    Body: file.buffer,
    ContentType: file.mimetype
  }));

  return `https://${bucketName}.s3.${REGION}.amazonaws.com/${fileKey}`;
}

async function getSignedDownloadUrl(imageUrl) {
  if (!imageUrl) return null;
  try {
    const parsed = new URL(imageUrl);
    const key = decodeURIComponent(parsed.pathname.substring(1));
    const bucketName = process.env.S3_BUCKET_NAME;

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key
    });

    return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  } catch (err) {
    console.error('Error generating pre-signed GET URL:', err);
    return imageUrl;
  }
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

// Configure Redis Client for ElastiCache / Local Redis
const redisClient = redis.createClient({
  url: `redis://${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || 6379}`,
  socket: {
    connectTimeout: 1000 // fast timeout for initial connection attempts
  }
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('Successfully connected to Redis cache');
});

// Establish initial async connection to Redis
(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error('Failed to connect to Redis initially:', err);
  }
})();

// Helper function to read from cache with fallback
async function getCache(key) {
  if (!redisClient.isReady) {
    return null;
  }
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error(`Error reading key ${key} from Redis cache:`, err);
    return null;
  }
}

// Helper function to write to cache with TTL
async function setCache(key, value, expiration = 3600) {
  if (!redisClient.isReady) {
    return;
  }
  try {
    await redisClient.set(key, JSON.stringify(value), {
      EX: expiration
    });
  } catch (err) {
    console.error(`Error writing key ${key} to Redis cache:`, err);
  }
}

// Helper function to delete from cache
async function delCache(key) {
  if (!redisClient.isReady) {
    return;
  }
  try {
    await redisClient.del(key);
  } catch (err) {
    console.error(`Error deleting key ${key} from Redis cache:`, err);
  }
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'pet_store',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

app.get('/pets/presign-upload', async (req, res) => {
  try {
    const { fileName, contentType } = req.query;
    if (!fileName || !contentType) {
      return res.status(400).json({ error: 'fileName and contentType are required' });
    }
    const fileExtension = fileName.split('.').pop();
    const fileKey = `pets/${crypto.randomBytes(16).toString('hex')}.${fileExtension}`;
    const bucketName = process.env.S3_BUCKET_NAME;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      ContentType: contentType
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
    const publicUrl = `https://${bucketName}.s3.${REGION}.amazonaws.com/${fileKey}`;

    res.json({ presignedUrl, publicUrl });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate pre-signed URL: ' + err.message });
  }
});

app.get('/pets', async (req, res) => {
  try {
    const cacheKey = 'pets:all';
    const cachedPets = await getCache(cacheKey);
    if (cachedPets) {
      console.log('Cache hit for all pets');
      const petsWithSignedUrls = await Promise.all(
        cachedPets.map(async (pet) => ({
          ...pet,
          image_url: await getSignedDownloadUrl(pet.image_url)
        }))
      );
      return res.json(petsWithSignedUrls);
    }

    console.log('Cache miss for all pets. Querying MySQL database...');
    const [rows] = await pool.query('SELECT * FROM pets');
    await setCache(cacheKey, rows);
    const petsWithSignedUrls = await Promise.all(
      rows.map(async (pet) => ({
        ...pet,
        image_url: await getSignedDownloadUrl(pet.image_url)
      }))
    );
    res.json(petsWithSignedUrls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/pets/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const cacheKey = `pets:id:${id}`;
    const cachedPet = await getCache(cacheKey);
    if (cachedPet) {
      console.log(`Cache hit for pet ID ${id}`);
      const signedUrl = await getSignedDownloadUrl(cachedPet.image_url);
      return res.json({ ...cachedPet, image_url: signedUrl });
    }

    console.log(`Cache miss for pet ID ${id}. Querying MySQL database...`);
    const [rows] = await pool.query('SELECT * FROM pets WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Pet not found' });
    }
    await setCache(cacheKey, rows[0]);
    const signedUrl = await getSignedDownloadUrl(rows[0].image_url);
    res.json({ ...rows[0], image_url: signedUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/pets', upload.single('image'), async (req, res) => {
  const { name, species, age, imageUrl: bodyImageUrl } = req.body;
  if (!name || !species || age === undefined) {
    return res.status(400).json({ error: 'Name, species, and age are required' });
  }

  let imageUrl = bodyImageUrl || null;
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
    // Invalidate list cache
    await delCache('pets:all');
    const signedUrl = await getSignedDownloadUrl(imageUrl);
    res.status(201).json({ id: result.insertId, name, species, age: parseInt(age), image_url: signedUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/pets/:id', upload.single('image'), async (req, res) => {
  const { name, species, age, imageUrl: bodyImageUrl } = req.body;
  if (!name || !species || age === undefined) {
    return res.status(400).json({ error: 'Name, species, and age are required' });
  }
  try {
    const [existing] = await pool.query('SELECT image_url FROM pets WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Pet not found' });
    }

    let finalImageUrl = bodyImageUrl !== undefined ? bodyImageUrl : existing[0].image_url;
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
    // Invalidate both the list cache and the specific pet cache
    const id = req.params.id;
    await delCache('pets:all');
    await delCache(`pets:id:${id}`);
    const signedUrl = await getSignedDownloadUrl(finalImageUrl);
    res.json({ id: parseInt(id), name, species, age: parseInt(age), image_url: signedUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/pets/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const [result] = await pool.query('DELETE FROM pets WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Pet not found' });
    }
    // Invalidate both the list cache and the specific pet cache
    await delCache('pets:all');
    await delCache(`pets:id:${id}`);
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
