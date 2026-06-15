const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
app.use(express.json());

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

app.post('/pets', async (req, res) => {
  const { name, species, age } = req.body;
  if (!name || !species || age === undefined) {
    return res.status(400).json({ error: 'Name, species, and age are required' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO pets (name, species, age) VALUES (?, ?, ?)',
      [name, species, age]
    );
    res.status(201).json({ id: result.insertId, name, species, age });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/pets/:id', async (req, res) => {
  const { name, species, age } = req.body;
  if (!name || !species || age === undefined) {
    return res.status(400).json({ error: 'Name, species, and age are required' });
  }
  try {
    const [result] = await pool.query(
      'UPDATE pets SET name = ?, species = ?, age = ? WHERE id = ?',
      [name, species, age, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Pet not found' });
    }
    res.json({ id: parseInt(req.params.id), name, species, age });
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
