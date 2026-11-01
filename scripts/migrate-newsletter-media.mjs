import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import pg from 'pg';

if (!process.argv.includes('--apply')) throw new Error('Pass --apply to add newsletter image storage. No issues are published or emailed.');
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');
const url = new URL(process.env.DATABASE_URL); url.searchParams.set('sslmode', 'verify-full');
const client = new pg.Client({ connectionString: url.href, connectionTimeoutMillis: 15000 });
await client.connect();
try {
  await client.query('BEGIN');
  await client.query(await readFile(new URL('../drizzle/0014_newsletter_media.sql', import.meta.url), 'utf8'));
  await client.query('COMMIT');
  console.log('Newsletter image storage is ready. Existing text, campaign snapshots, publication, and subscriber state are unchanged. No email sent.');
} catch (error) { await client.query('ROLLBACK'); throw error; }
finally { await client.end(); }
