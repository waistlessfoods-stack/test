import 'dotenv/config';
import { sql } from "drizzle-orm";
import { db } from './lib/db/index.ts';

try {
  // Query to check if index exists on session.token
  const result = await db.execute(sql`
    SELECT indexname 
    FROM pg_indexes 
    WHERE tablename = 'session' 
    AND indexdef LIKE '%token%';
  `);
  
  console.log('Indexes on session table:');
  console.log(result);
  
  if (result.length === 0) {
    console.log('\n❌ NO INDEX on session.token found!');
    console.log('This is why queries are timing out.');
    console.log('\nCreating index now...');
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_session_token ON "session"("token");
    `);
    
    console.log('✅ Index created successfully!');
  } else {
    console.log('✅ Index already exists');
  }
  
  process.exit(0);
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}
