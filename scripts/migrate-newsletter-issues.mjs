import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import pg from 'pg';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
const migration = await readFile(new URL('../drizzle/0011_newsletter_issues.sql', import.meta.url), 'utf8');
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query('BEGIN');
  await client.query(migration);
  await client.query('COMMIT');
  console.log('Newsletter issues migration complete. No campaigns published or emails sent.');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally { await client.end(); }
