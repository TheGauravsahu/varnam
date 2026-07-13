import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema.js';
import 'dotenv/config';

if (!process.env.DATABASE_URL) {
  throw new Error('❌ DATABASE_URL is missing in your .env file! Please connect your Neon PostgreSQL cloud database.');
}

// Neon PostgreSQL requires SSL connections
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const db = drizzle(pool, { schema });
console.log('✅ Connected to Neon PostgreSQL Database via Drizzle ORM');

export { db, schema };
export * from './schema.js';
