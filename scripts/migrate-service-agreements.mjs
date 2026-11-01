import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import pg from 'pg';

if (!process.argv.includes('--apply')) throw new Error('Pass --apply to add agreement and invoice-workflow tables. No customer data or email is created.');
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');
const url = new URL(process.env.DATABASE_URL);
url.searchParams.set('sslmode', 'verify-full');
const client = new pg.Client({ connectionString: url.href, connectionTimeoutMillis: 15000 });
await client.connect();
try {
  await client.query('BEGIN');
  await client.query(await readFile(new URL('../drizzle/0013_service_agreements.sql', import.meta.url), 'utf8'));
  await client.query('COMMIT');
  console.log('Agreement and invoice-workflow tables are ready. No agreements, invoices, signatures, charges, or emails were created.');
} catch (error) { await client.query('ROLLBACK'); throw error; }
finally { await client.end(); }
