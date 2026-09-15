import fs from "fs";

let content = fs.readFileSync("src/routes/finance.routes.ts", "utf-8");

if (!content.includes('import { PricingService }')) {
  content = 'import { PricingService } from "../../engines/pricingService";\n' + content;
}

const oldLogic = `    const { amount = 0, vatCode = 'V10', itemType = 'STANDARD', isExempt = false } = req.body;
    const numAmount = Number(amount) || 0;
    let vatRate = 0.10;
    if (vatCode === 'V0') vatRate = 0;
    else if (vatCode === 'V5') vatRate = 0.05;
    else if (vatCode === 'V8') vatRate = 0.08;
    else if (vatCode === 'V10') vatRate = 0.10;
    else if (vatCode === 'VE' || isExempt) vatRate = 0;
    const vatAmount = Math.round(numAmount * vatRate);
    const totalWithVat = numAmount + vatAmount;`;

const newLogic = `    const { amount = 0, vatCode = 'V10', itemType = 'STANDARD', isExempt = false } = req.body;
    const numAmount = Number(amount) || 0;
    const { vatRate, vatAmount, totalWithVat } = PricingService.calculateTaxFromVatCode(numAmount, vatCode, isExempt);`;

content = content.replace(oldLogic, newLogic);
fs.writeFileSync("src/routes/finance.routes.ts", content);
