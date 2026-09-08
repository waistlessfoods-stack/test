import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import pg from 'pg';
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query('BEGIN');
  await client.query(await readFile(new URL('../drizzle/0012_newsletter_campaigns.sql', import.meta.url), 'utf8'));
  await client.query('COMMIT');
  console.log('Campaign tables ready. No campaigns created or emails sent.');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally { await client.end(); }
