const express = require('express');
const path = require('node:path');
const { Pool } = require('pg');

const app = express();
const PORT = Number(process.env.PORT || 4000);

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 5433),
  database: process.env.POSTGRES_DB || 'rewear_db',
  user: process.env.POSTGRES_USER || 'rewear_user',
  password: process.env.POSTGRES_PASSWORD || 'change_this_password_for_local_development',
  max: 10,
  connectionTimeoutMillis: 5000
});

app.use(express.json({ limit: '100kb' }));

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id BIGSERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      category VARCHAR(40) NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      price NUMERIC(12, 2) NOT NULL CHECK (price > 0),
      condition VARCHAR(20) NOT NULL CHECK (condition IN ('Like New', 'Good', 'Fair')),
      seller_name VARCHAR(80) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  const countResult = await pool.query('SELECT COUNT(*)::int AS count FROM products');
  if (countResult.rows[0].count === 0) {
    await pool.query(
      `INSERT INTO products (name, category, description, price, condition, seller_name)
       VALUES
         ($1, $2, $3, $4, $5, $6),
         ($7, $8, $9, $10, $11, $12),
         ($13, $14, $15, $16, $17, $18)`,
      [
        'Jaket Denim Vintage', 'Outerwear', 'Jaket denim preloved, masih nyaman dipakai. Cocok untuk daily outfit.', 85000, 'Good', 'Nadia',
        'Tote Bag Kanvas', 'Tas', 'Tote bag kanvas yang ringan untuk kuliah dan kegiatan sehari-hari.', 35000, 'Like New', 'Raka',
        'Kemeja Flanel', 'Atasan', 'Kemeja flanel secondhand dengan kondisi baik dan warna netral.', 60000, 'Good', 'Alya'
      ]
    );
    console.log('Inserted demo products into the database.');
  }
}

function toProduct(row) {
  return {
    ...row,
    price: Number(row.price)
  };
}

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    return res.status(200).json({ status: 'ok', database: 'connected' });
  } catch (error) {
    console.error('Health check failed:', error.message);
    return res.status(503).json({ status: 'error', database: 'unavailable' });
  }
});

app.get('/api/products', async (_req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, name, category, description, price, condition, seller_name, created_at
       FROM products
       ORDER BY created_at DESC, id DESC`
    );
    return res.status(200).json(result.rows.map(toProduct));
  } catch (error) {
    return next(error);
  }
});

app.post('/api/products', async (req, res, next) => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const category = typeof req.body.category === 'string' ? req.body.category.trim() : '';
    const description = typeof req.body.description === 'string' ? req.body.description.trim() : '';
    const condition = typeof req.body.condition === 'string' ? req.body.condition : '';
    const sellerName = typeof req.body.sellerName === 'string' ? req.body.sellerName.trim() : '';
    const price = Number(req.body.price);

    const allowedConditions = ['Like New', 'Good', 'Fair'];
    if (!name || name.length > 120) {
      return res.status(400).json({ message: 'Nama produk wajib diisi (maksimal 120 karakter).' });
    }
    if (!category || category.length > 40) {
      return res.status(400).json({ message: 'Kategori produk wajib dipilih.' });
    }
    if (!Number.isFinite(price) || price <= 0) {
      return res.status(400).json({ message: 'Harga harus berupa angka lebih besar dari 0.' });
    }
    if (!allowedConditions.includes(condition)) {
      return res.status(400).json({ message: 'Kondisi produk tidak valid.' });
    }
    if (!sellerName || sellerName.length > 80) {
      return res.status(400).json({ message: 'Nama penjual wajib diisi (maksimal 80 karakter).' });
    }

    const result = await pool.query(
      `INSERT INTO products (name, category, description, price, condition, seller_name)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, category, description, price, condition, seller_name, created_at`,
      [name, category, description, price, condition, sellerName]
    );

    return res.status(201).json({
      message: 'Produk berhasil ditambahkan.',
      product: toProduct(result.rows[0])
    });
  } catch (error) {
    return next(error);
  }
});

// In production, Express serves the React build from the same application container.
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../client/dist');
  app.use(express.static(frontendPath));
  app.get(/.*/, (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ message: 'Endpoint tidak ditemukan.' });
    }
    return res.sendFile(path.join(frontendPath, 'index.html'));
  });
} else {
  app.use((_req, res) => res.status(404).json({ message: 'Route tidak ditemukan.' }));
}

app.use((error, _req, res, _next) => {
  console.error('Request error:', error.message);
  return res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
});

async function startServer() {
  try {
    await initializeDatabase();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`ReWear Campus API is listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start application:', error);
    await pool.end();
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await pool.end();
  process.exit(0);
});

startServer();
