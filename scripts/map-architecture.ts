import fs from "fs";
import path from "path";

const IGNORE_DIRS = ["node_modules", "dist", ".git", "_quarantine"];

function getFiles(dir: string, fileList: string[] = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (IGNORE_DIRS.includes(file)) continue;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      getFiles(fullPath, fileList);
    } else {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const allSrcFiles = getFiles("src").concat(getFiles("server"));
const moduleMap = new Map<string, string[]>();

allSrcFiles.forEach(f => {
    let mod = "COMMON/UNKNOWN";
    if (f.includes("M01")) mod = "M01 Workspace Hub";
    else if (f.includes("M02")) mod = "M02 Audit Compliance";
    else if (f.includes("M03")) mod = "M03 System Settings";
    else if (f.includes("M04")) mod = "M04 SuperAdmin RBAC";
    else if (f.includes("M05")) mod = "M05 EventBus & EDA";
    else if (f.includes("M06")) mod = "M06 Innovation R&D";
    else if (f.includes("M07")) mod = "M07 Customers Item Master";
    else if (f.includes("M08") || f.includes("Purchase")) mod = "M08 Purchase Orders";
    else if (f.includes("M09") || f.includes("Supplier")) mod = "M09 Suppliers SRM";
    else if (f.includes("M10") || f.includes("Sourcing")) mod = "M10 Strategic Sourcing";
    else if (f.includes("M11")) mod = "M11 SRM Supplier Mgmt";
    else if (f.includes("M12") || f.includes("Crm") || f.includes("Lead")) mod = "M12 CRM";
    else if (f.includes("M13") || f.includes("SalesOrder")) mod = "M13 Sales Orders";
    else if (f.includes("M14") || f.includes("Commission")) mod = "M14 Sales Commission";
    else if (f.includes("M15") || f.includes("Return") || f.includes("RMA")) mod = "M15 Returns RMA";
    else if (f.includes("M16") || f.includes("POS") || f.includes("Cash")) mod = "M16 POS Retail";
    else if (f.includes("M17") || f.includes("InventoryCore")) mod = "M17 Inventory Core";
    else if (f.includes("M18") || f.includes("Warehouse")) mod = "M18 Warehouse Management";
    else if (f.includes("M19") || f.includes("Stocktake")) mod = "M19 Stocktake";
    else if (f.includes("M20") || f.includes("Adjustment")) mod = "M20 Stock Adjustment";
    else if (f.includes("M21") || f.includes("Transfer")) mod = "M21 Internal Transfers";
    else if (f.includes("M22") || f.includes("Lots") || f.includes("Batch")) mod = "M22 Lots & Batches";
    else if (f.includes("M23") || f.includes("Serial")) mod = "M23 Serials & IMEI";
    else if (f.includes("M24") || f.includes("WMSExtended")) mod = "M24 WMS Extended";
    else if (f.includes("M25") || f.includes("Manufacturing") || f.includes("BOM")) mod = "M25 Manufacturing & BOM";
    else if (f.includes("M26") || f.includes("SupplyChain")) mod = "M26 Supply Chain SCM";
    else if (f.includes("M27") || f.includes("AssetMaintenance") || f.includes("eam")) mod = "M27 EAM Asset Maintenance";
    else if (f.includes("M28") || f.includes("HR") || f.includes("hr")) mod = "M28 HR & Payroll";
    else if (f.includes("M29") || f.includes("DMS")) mod = "M29 DMS Documents";
    else if (f.includes("M30") || f.includes("GeneralLedger")) mod = "M30 Finance & GL";
    else if (f.includes("M31") || f.includes("Invoices") || f.includes("ArAp")) mod = "M31 Finance & Accounting";
    else if (f.includes("M32") || f.includes("Payment") || f.includes("Treasury")) mod = "M32 Payments & Cash";
    else if (f.includes("M33") || f.includes("BankRecon")) mod = "M33 Bank Reconciliation";
    else if (f.includes("M34") || f.includes("Consolidation")) mod = "M34 Financial Consolidation";
    else if (f.includes("M35") || f.includes("Project") || f.includes("WBS")) mod = "M35 Projects & WBS";
    else if (f.includes("M36") || f.includes("Logistic") || f.includes("Fleet")) mod = "M36 Logistics & Fleet";
    else if (f.includes("M37") || f.includes("Analytics") || f.includes("BI")) mod = "M37 BI & Analytics Reports";
    else if (f.includes("M38") || f.includes("ServiceDesk") || f.includes("Ticket")) mod = "M38 Service Desk";
    else if (f.includes("M39") || f.includes("Quality") || f.includes("QMS")) mod = "M39 Quality Control QMS";
    else if (f.includes("M40") || f.includes("EHS")) mod = "M40 EHS Safety & Environment";
    else if (f.includes("M41") || f.includes("Pricing") || f.includes("Promotion")) mod = "M41 Pricing & Commercial Management";
    else if (f.includes("M42") || f.includes("CostAllocation") || f.includes("Costing")) mod = "M42 Cost Allocation";
    
    if (f.includes("App.tsx") || f.includes("main.tsx") || f.includes("index.css") || f.includes("moduleRegistry") || f.includes("components/common")) mod = "CORE/SHELL";
    
    if (!moduleMap.has(mod)) moduleMap.set(mod, []);
    moduleMap.get(mod)!.push(f);
});

let report = "## BÁO CÁO ÁNH XẠ HIỆN TRẠNG (MODULE MAP)\n\n";
for (const [mod, files] of moduleMap.entries()) {
    report += `### ${mod} (${files.length} files)\n`;
    files.forEach(f => report += `- ${f}\n`);
    report += "\n";
}

fs.writeFileSync("docs/reports/MODULE_ARCHITECTURE_MAP.md", report);
console.log("Mapped " + allSrcFiles.length + " files. Report written to docs/reports/MODULE_ARCHITECTURE_MAP.md");
