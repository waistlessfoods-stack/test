import "server-only";
import { createInvoiceWorkflow } from "@/lib/service-invoice-workflow";
import { workflowDatabase } from "@/lib/service-workflow-store";

export const invoiceWorkflow = createInvoiceWorkflow(workflowDatabase);
