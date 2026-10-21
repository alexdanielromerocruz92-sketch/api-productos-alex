require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const fs = require('node:fs');
const path = require('node:path');

const app = express();
app.use(express.json({ limit: '1mb' }));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
});

app.get('/', (_req, res) => res.json({ nombre: 'API Productos', estado: 'ok', rutas: ['/health', '/api/maestros', '/api/maestros/1', '/api/productos', '/api/pokemon'] }));
app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ estado: 'ok', baseDeDatos: 'conectada' });
  } catch (error) {
    console.error('Health check falló:', error.message);
    res.status(503).json({ estado: 'error', baseDeDatos: 'no disponible' });
  }
});

app.get('/api/maestros', async (_req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT id, nombre, correo, activo, creado_en FROM maestros ORDER BY id');
    res.json(rows);
  } catch (error) { next(error); }
});
app.get('/api/maestros/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT id, nombre, correo, activo, creado_en FROM maestros WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Maestro no encontrado' });
    res.json(rows[0]);
  } catch (error) { next(error); }
});

app.get('/api/productos', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.id, p.nombre, p.descripcion, p.precio, p.stock, p.maestro_id,
              m.nombre AS maestro, p.creado_en
       FROM productos p LEFT JOIN maestros m ON m.id = p.maestro_id
       ORDER BY p.id`
    );
    res.json(rows);
  } catch (error) { next(error); }
});
app.get('/api/productos/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.id, p.nombre, p.descripcion, p.precio, p.stock, p.maestro_id,
              m.nombre AS maestro, p.creado_en
       FROM productos p LEFT JOIN maestros m ON m.id = p.maestro_id
       WHERE p.id = $1`, [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(rows[0]);
  } catch (error) { next(error); }
});

app.post('/api/productos', async (req, res, next) => {
  const { nombre, descripcion = null, precio, stock = 0, maestro_id = null } = req.body;
  if (typeof nombre !== 'string' || !nombre.trim() || !Number.isFinite(Number(precio)) || Number(precio) < 0 || !Number.isInteger(Number(stock)) || Number(stock) < 0) {
    return res.status(400).json({ error: 'Se requieren nombre, precio >= 0 y stock entero >= 0' });
  }
  try {
    const { rows } = await pool.query(
      'INSERT INTO productos (nombre, descripcion, precio, stock, maestro_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [nombre.trim(), descripcion, precio, stock, maestro_id]
    );
    res.status(201).json(rows[0]);
  } catch (error) { next(error); }
});

app.get('/api/pokemon', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, nombre, tipo, imagen_frontal, imagen_trasera, creado_en, actualizado_en FROM pokemon ORDER BY id'
    );
    res.json(rows);
  } catch (error) { next(error); }
});

app.get('/api/pokemon/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, nombre, tipo, imagen_frontal, imagen_trasera, creado_en, actualizado_en FROM pokemon WHERE id = $1',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Pokémon no encontrado' });
    res.json(rows[0]);
  } catch (error) { next(error); }
});

// Upsert by the stable ID in the Google Sheet so edits update the same Pokémon.
app.post('/api/pokemon', async (req, res, next) => {
  const { id, nombre, tipo, imagen_frontal = '', imagen_trasera = '' } = req.body;
  const pokemonId = Number(id);
  if (!Number.isInteger(pokemonId) || pokemonId < 1 || typeof nombre !== 'string' || !nombre.trim() || typeof tipo !== 'string' || !tipo.trim()) {
    return res.status(400).json({ error: 'Se requieren id entero positivo, nombre y tipo' });
  }
  if (typeof imagen_frontal !== 'string' || typeof imagen_trasera !== 'string') {
    return res.status(400).json({ error: 'Las imágenes deben ser texto con la URL o quedar vacías' });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO pokemon (id, nombre, tipo, imagen_frontal, imagen_trasera)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET
         nombre = EXCLUDED.nombre,
         tipo = EXCLUDED.tipo,
         imagen_frontal = EXCLUDED.imagen_frontal,
         imagen_trasera = EXCLUDED.imagen_trasera,
         actualizado_en = NOW()
       RETURNING id, nombre, tipo, imagen_frontal, imagen_trasera, creado_en, actualizado_en`,
      [pokemonId, nombre.trim(), tipo.trim(), imagen_frontal.trim(), imagen_trasera.trim()]
    );
    res.json(rows[0]);
  } catch (error) { next(error); }
});

app.use((error, _req, res, _next) => {
  console.error(error.message);
  if (error.code === '23503') return res.status(400).json({ error: 'El maestro_id no existe' });
  res.status(500).json({ error: 'Error interno del servidor' });
});

const port = Number(process.env.PORT) || 3000;
let server;
async function start() {
  try {
    const schema = fs.readFileSync(path.join(__dirname, '..', 'db', 'init.sql'), 'utf8');
    await pool.query(schema);
    server = app.listen(port, '0.0.0.0', () => console.log(`API escuchando en el puerto ${port}`));
  } catch (error) {
    console.error('No se pudo preparar la base de datos:', error.message);
    process.exit(1);
  }
}
async function shutdown() {
  if (!server) return pool.end().then(() => process.exit(0));
  server.close(async () => { await pool.end(); process.exit(0); });
}
start();
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

