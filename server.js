// =============================================
// IMPORTS
// =============================================
import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

import { syncService } from './backend/services/syncService.js';
import { initDatabase } from './database/init.js';
import { query, testConnection } from './database/db.js';

// =============================================
// CONFIGURACIÓN INICIAL
// =============================================
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app); // ✅ Necesario para WebSockets
const PORT = process.env.PORT || 3000;

// =============================================
// MIDDLEWARE
// =============================================
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('frontend'));

// =============================================
// ESTADO DE BASE DE DATOS
// =============================================
let dbInitialized = false;

app.use(async (req, res, next) => {
  if (!dbInitialized && req.path.startsWith('/api')) {
    try {
      await initDatabase();
      dbInitialized = true;
    } catch (error) {
      console.error('❌ Error inicializando base de datos:', error);
      return res.status(500).json({
        error: 'Error de base de datos',
        message: 'La base de datos no está disponible',
      });
    }
  }
  next();
});

// =============================================
// RUTAS
// =============================================

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const dbConnected = await testConnection();
    res.json({
      status: 'ok',
      database: dbConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: error.message,
    });
  }
});

// Productos
app.get('/api/products', async (_req, res) => {
  try {
    const result = await query('SELECT * FROM products ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error obteniendo productos:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM products WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error obteniendo producto:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { name, price, image, description, category, stock } = req.body;
    if (!name || !price) return res.status(400).json({ error: 'Nombre y precio son requeridos' });

    const result = await query(
      `INSERT INTO products (name, price, image, description, category, stock)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, parseFloat(price), image || '📦', description, category || 'General', parseInt(stock) || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creando producto:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, image, description, category, stock } = req.body;
    const result = await query(
      `UPDATE products
       SET name = $1, price = $2, image = $3, description = $4, category = $5, stock = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 RETURNING *`,
      [name, parseFloat(price), image, description, category, parseInt(stock) || 0, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error actualizando producto:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ message: 'Producto eliminado correctamente', product: result.rows[0] });
  } catch (err) {
    console.error('Error eliminando producto:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Pedidos
app.post('/api/orders', async (req, res) => {
  try {
    const { customer, products, total } = req.body;
    if (!products || !total) return res.status(400).json({ error: 'Productos y total son requeridos' });

    const result = await query(
      `INSERT INTO orders (customer_name, customer_phone, customer_address, products, total)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        customer?.name || 'Cliente no especificado',
        customer?.phone || 'No especificado',
        customer?.address || 'No especificado',
        JSON.stringify(products),
        parseFloat(total),
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creando pedido:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/api/orders', async (_req, res) => {
  try {
    const result = await query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error obteniendo pedidos:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Configuración
app.get('/api/settings', async (_req, res) => {
  try {
    const result = await query('SELECT * FROM settings LIMIT 1');
    res.json(result.rows[0] || {});
  } catch (err) {
    console.error('Error obteniendo configuración:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.put('/api/settings', async (req, res) => {
  try {
    const { store_name, whatsapp_number, business_name, whatsapp_welcome, whatsapp_order } = req.body;
    const result = await query(
      `INSERT INTO settings (store_name, whatsapp_number, business_name, whatsapp_welcome, whatsapp_order)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id)
       DO UPDATE SET
         store_name = $1,
         whatsapp_number = $2,
         business_name = $3,
         whatsapp_welcome = $4,
         whatsapp_order = $5,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [store_name, whatsapp_number, business_name, whatsapp_welcome, whatsapp_order]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error actualizando configuración:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =============================================
// FRONTEND
// =============================================
app.get('/', (_req, res) => res.sendFile(path.join(__dirname, 'frontend', 'index.html')));
app.get('/admin.html', (_req, res) => res.sendFile(path.join(__dirname, 'frontend', 'admin.html')));

// 404
app.use('*', (req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    res.status(404).json({ error: 'Ruta API no encontrada' });
  } else {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
  }
});

// Error global
app.use((err, _req, res, _next) => {
  console.error('Error global:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// =============================================
// INICIALIZAR SERVIDOR
// =============================================
async function startServer() {
  try {
    console.log('🔄 Conectando a PostgreSQL...');
    const dbConnected = await testConnection();
    if (!dbConnected) console.log('⚠️  No se pudo conectar a PostgreSQL. Algunas funciones pueden no estar disponibles.');

    // ✅ Inicializar sincronización (WebSockets)
    syncService.start(server);

    server.listen(PORT, () => {
      console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
      console.log(`📊 API disponible en http://localhost:${PORT}/api`);
      console.log(`🔧 Panel admin en http://localhost:${PORT}/admin.html`);
    });

  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
}

startServer();