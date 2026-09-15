import fs from "fs";

let content = fs.readFileSync("src/routes/invoices.routes.ts", "utf-8");

if (!content.includes('import { PricingService }')) {
  content = 'import { PricingService } from "../../engines/pricingService";\n' + content;
}

const oldLogic = `        const issueDate = new Date(inv.issueDate).getTime();
        const daysElapsed = Math.floor((now - issueDate) / (1000 * 3600 * 24));
        const isEligible210 = daysElapsed <= 10;
        const discountRate = isEligible210 ? 0.02 : 0; // 2% discount if paid within 10 days
        const discountAmount = Math.round(inv.finalAmount * discountRate);
        const amountAfterDiscount = inv.finalAmount - discountAmount;`;

const newLogic = `        const issueDate = new Date(inv.issueDate).getTime();
        const { isEligible: isEligible210, daysElapsed, discountAmount, discountRate, term } = PricingService.calculateEarlyPaymentDiscount(inv.finalAmount, issueDate, now);
        const amountAfterDiscount = inv.finalAmount - discountAmount;`;

content = content.replace(oldLogic, newLogic);
fs.writeFileSync("src/routes/invoices.routes.ts", content);
