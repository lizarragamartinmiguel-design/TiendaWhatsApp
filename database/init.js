import { query } from './db.js';

export async function initDatabase() {
  try {
    console.log('🔄 Inicializando base de datos PostgreSQL...');

    await query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        image TEXT,
        description TEXT,
        category VARCHAR(100),
        stock INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_name VARCHAR(255),
        customer_phone VARCHAR(50),
        customer_address TEXT,
        products JSONB NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pendiente',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        store_name VARCHAR(255) DEFAULT 'Tienda WhatsApp',
        whatsapp_number VARCHAR(50),
        business_name VARCHAR(255),
        whatsapp_welcome TEXT,
        whatsapp_order TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      INSERT INTO settings (store_name, whatsapp_number, business_name) 
      VALUES ($1, $2, $3)
      ON CONFLICT (id) DO NOTHING
    `, ['Tienda WhatsApp', '5491112345678', 'Mi Tienda WhatsApp']);

    console.log('✅ Base de datos PostgreSQL inicializada correctamente');

  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
    throw error;
  }
}