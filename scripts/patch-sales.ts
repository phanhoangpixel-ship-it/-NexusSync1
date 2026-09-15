import fs from "fs";

let content = fs.readFileSync("src/routes/sales.routes.ts", "utf-8");

content = content.replace(
  `const { TaxEngineService } = require('../../engines/taxService');`,
  `const { PricingService } = require('../../engines/pricingService');`
);

content = content.replace(
  `const taxResult = TaxEngineService.calculateLineTax({
        sku: item.sku,
        category: item.category,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        discountPercent: item.discountPercent || 0,
      });`,
  `const pricingResult = PricingService.calculateLinePricing({
        sku: item.sku || 'UNKNOWN',
        category: item.category || 'UNKNOWN',
        unitPrice: item.unitPrice || 0,
        quantity: item.quantity || 1,
        discountPercent: item.discountPercent || 0,
      });`
);

content = content.replace(/totalSubtotal \+\= taxResult\.taxableAmount;/g, `totalSubtotal += pricingResult.taxableAmount;`);
content = content.replace(/totalTaxAmount \+\= taxResult\.taxAmount;/g, `totalTaxAmount += pricingResult.taxAmount;`);
content = content.replace(/taxResult,/g, `pricingResult,`);

fs.writeFileSync("src/routes/sales.routes.ts", content);
