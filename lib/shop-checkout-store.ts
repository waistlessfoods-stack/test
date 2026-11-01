import 'server-only';
import postgres from 'postgres';
import { createShopCheckout, type CheckoutDatabase } from '@/lib/shop-checkout';

const connection = postgres(process.env.DATABASE_URL!, { max: 2, idle_timeout: 5, connect_timeout: 10, prepare: false });
const database: CheckoutDatabase = { transaction: async work => {
  const result = await connection.begin(async transaction => {
    await transaction`SET LOCAL lock_timeout = '10s'`;
    await transaction`SET LOCAL statement_timeout = '45s'`;
    return { value: await work(async (statement, values = []) => Array.from(await transaction.unsafe(statement, values))) };
  });
  return result.value;
} };
export const shopCheckout = createShopCheckout(database);
