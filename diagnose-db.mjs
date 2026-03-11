import 'dotenv/config';
import postgres from 'postgres';

const client = postgres(process.env.DATABASE_URL);

try {
  const indexes = await client`
    SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'session';
  `;
  
  console.log('Session table indexes:');
  indexes.forEach(idx => console.log('-', idx.indexname));
  
  const hasTokenIndex = indexes.some(idx => idx.indexdef.includes('token'));
  
  if (!hasTokenIndex) {
    console.log('\n⚠️  NO INDEX on token column - creating it now...');
    await client`CREATE INDEX IF NOT EXISTS idx_session_token ON "session"("token");`;
    console.log('✅ Index created!');
  } else {
    console.log('\n✅ Token index exists');
  }
  
  await client.end();
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
