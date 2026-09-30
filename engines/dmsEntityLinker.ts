import { db } from "../db/index";
import * as schema from "../db/schema";
import { eq } from "drizzle-orm";

export const ENTITY_MODULE_MAPPING: Record<string, { table: any; idField: string; codeField?: string }> = {
  "M31_INVOICE": { table: schema.invoices, idField: "id", codeField: "invoiceNumber" },
  "M30_LEDGER": { table: schema.accountingEntries, idField: "id", codeField: "entryCode" },
  "M32_PAYMENT": { table: schema.cashVouchers, idField: "id", codeField: "voucherCode" },
  "M08_PO": { table: schema.purchaseOrders, idField: "id", codeField: "code" },
  "M13_ORDER": { table: schema.salesOrders, idField: "id", codeField: "code" },
  "M17_STOCK": { table: schema.stockLedger, idField: "id", codeField: "referenceNo" },
  "M09_CONTRACT": { table: schema.suppliers, idField: "id", codeField: "code" }, 
  "M35_PROJECT": { table: schema.projects, idField: "id", codeField: "code" },
  "M28_APPROVAL": { table: schema.businessProcesses, idField: "id", codeField: "processCode" },
  "M28_PAYROLL": { table: schema.payrolls, idField: "id", codeField: "periodCode" },
  "M06_FORMULA": { table: schema.rdFormulas, idField: "id", codeField: "formulaCode" },
  "M06_PROJECT": { table: schema.rdProjects, idField: "id", codeField: "projectCode" },
  "M39_QUALITY": { table: schema.qualityInspections, idField: "id", codeField: "inspectionCode" },
  "M36_ASSET": { table: schema.fixedAssets, idField: "id", codeField: "assetCode" },
};

export class DmsEntityLinker {
  static async verifyEntity(entityType: string, entityId: string | number) {
    const mapping = ENTITY_MODULE_MAPPING[entityType];
    if (!mapping) return false;

    const { table, idField, codeField } = mapping;
    
    // Check by numeric ID if entityId is number or numeric string
    const numId = typeof entityId === "number" ? entityId : (!isNaN(Number(entityId)) && Number(entityId) > 0 ? Number(entityId) : null);
    if (numId !== null) {
      const result = await db.select().from(table).where(eq(table[idField], numId)).get();
      if (result) return true;
    }

    // Check by Code if available
    if (codeField && typeof entityId === "string") {
      if (!table[codeField]) {
        console.error(`[DmsEntityLinker] Missing field ${codeField} on table for entityType ${entityType}`);
        return false;
      }
      const result = await db.select().from(table).where(eq(table[codeField], entityId)).get();
      if (result) return true;
    }

    return false;
  }

  static async validateEntity(entityType: string, entityId: string | number) {
    const exists = await this.verifyEntity(entityType, entityId);
    return { valid: exists, entityType, entityId };
  }
}
