import fs from "fs";

let content = fs.readFileSync("src/components/workspaces/M16POSRetailWorkspace.tsx", "utf-8");

content = content.replace(
  `import { TaxEngineService } from '../../../engines/taxService';`,
  `import { PricingService } from '../../../engines/pricingService';`
);

content = content.replace(
  `// Delegated to TaxEngineService authoritative tax calculation domain.`,
  `// Delegated to PricingService authoritative tax calculation domain.`
);

const oldLogic = `  const tax = TaxEngineService.calculateTotalTax(taxContexts);`;
const newLogic = `  const tax = taxContexts.reduce((acc, ctx) => acc + PricingService.calculateLinePricing(ctx).taxAmount, 0);`;
content = content.replace(oldLogic, newLogic);

const oldLine = `                    const lineTaxResult = TaxEngineService.calculateLineTax({
                      sku: item.sku,
                      category: (item as any).category || 'General',
                      unitPrice: item.price,
                      quantity: item.quantity,
                      discountPercent: item.discount,
                    });`;
const newLine = `                    const lineTaxResult = PricingService.calculateLinePricing({
                      sku: item.sku,
                      category: (item as any).category || 'General',
                      unitPrice: item.price,
                      quantity: item.quantity,
                      discountPercent: item.discount,
                    });`;
content = content.replace(oldLine, newLine);

fs.writeFileSync("src/components/workspaces/M16POSRetailWorkspace.tsx", content);
