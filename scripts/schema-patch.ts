import fs from "fs";

let content = fs.readFileSync("db/schema.ts", "utf-8");

const newTable = `
// ==========================================
// WORKFLOW & APPROVAL TRACKING
// ==========================================
export const approvalHistory = sqliteTable("approval_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  documentId: text("document_id").notNull(),
  documentType: text("document_type").notNull(),
  step: text("step").notNull(),
  action: text("action").notNull(),
  actorId: integer("actor_id"),
  actorRole: text("actor_role"),
  comments: text("comments"),
  createdAt: text("created_at").notNull().default(sql\`CURRENT_TIMESTAMP\`),
});
`;

if (!content.includes('approvalHistory')) {
  content += newTable;
  fs.writeFileSync("db/schema.ts", content);
}
