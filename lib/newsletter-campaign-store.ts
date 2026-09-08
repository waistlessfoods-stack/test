import 'server-only';
import postgres from 'postgres';
import { createCampaignService, type CampaignDatabase, type Query } from './newsletter-campaigns';

// Transactions require a session connection, unlike the shared Neon HTTP client.
const connection = postgres(process.env.DATABASE_URL!, { max: 1, idle_timeout: 5, connect_timeout: 10, prepare: false });
const query: Query = async (text, values = []) => Array.from(await connection.unsafe(text, values));
const database: CampaignDatabase = {
  query,
  transaction: async work => {
    // Wrap the value because postgres flattens array transaction return values.
    const result = await connection.begin(async transaction => ({ value: await work(async (text, values = []) => Array.from(await transaction.unsafe(text, values))) }));
    return result.value;
  },
};
export const campaigns = createCampaignService(database);
