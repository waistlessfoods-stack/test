import "server-only";
import postgres from "postgres";
import { createAgreementService, type WorkflowDatabase, type WorkflowQuery } from "@/lib/service-agreements";

const connection = postgres(process.env.DATABASE_URL!, { max: 2, idle_timeout: 5, connect_timeout: 10, prepare: false });
const query: WorkflowQuery = async (text, values = []) => Array.from(await connection.unsafe(text, values));
export const workflowDatabase: WorkflowDatabase = {
  query,
  transaction: async work => {
    const result = await connection.begin(async transaction => ({ value: await work(async (text, values = []) => Array.from(await transaction.unsafe(text, values))) }));
    return result.value;
  },
};
export const agreements = createAgreementService(workflowDatabase);
