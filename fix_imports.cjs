const fs = require('fs');

function addImports(file, imports) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('import { seed')) {
    content = content.replace('const router = Router();', `import { ${imports} } from "../../data/mockData";\n\nconst router = Router();`);
    fs.writeFileSync(file, content);
  }
}

addImports('src/routes/finance.routes.ts', 'seedCreditNotes, seedDebitNotes, seedAccountingEvents, seedConsolidationEntities, seedTransferPricingData');
addImports('src/routes/treasury.routes.ts', 'seedBankAccounts, seedCashVouchers, seedTransfers, seedBankStatements');
addImports('src/routes/bank.routes.ts', 'seedBankAccounts, seedBankStatements');

let logistics = fs.readFileSync('src/routes/logistics.routes.ts', 'utf8');
if (!logistics.includes('let driverSafetyData = [')) {
  const driverData = `
let driverSafetyData = [
  { driverId: 1, driverCode: 'DRV-001', fullName: 'Lê Hoàng Vũ', licenseClass: 'FC', totalKm: 1420, safetyScore: 96, tier: 'Hạng A+ (An Toàn Xuất Sắc)', ecoStars: 5, hardBrakingCount: 1, overspeedEvents: 0, rapidAccelCount: 2, idleMinutes: 18, ecoSavingsLiters: 42, safetyBonusVND: 1500000, courseRecommendation: 'Không cần (Đạt chuẩn Eco Master)' },
  { driverId: 2, driverCode: 'DRV-002', fullName: 'Phạm Minh Chính', licenseClass: 'C', totalKm: 1180, safetyScore: 88, tier: 'Hạng A (Khá)', ecoStars: 4, hardBrakingCount: 4, overspeedEvents: 2, rapidAccelCount: 5, idleMinutes: 45, ecoSavingsLiters: 25, safetyBonusVND: 800000, courseRecommendation: 'Kỹ năng phanh êm & tối ưu Nổ máy chờ' },
  { driverId: 3, driverCode: 'DRV-003', fullName: 'Trần Quốc Tuấn', licenseClass: 'FC', totalKm: 950, safetyScore: 74, tier: 'Hạng B (Trung Bình - Cần Cải Thiện)', ecoStars: 3, hardBrakingCount: 12, overspeedEvents: 6, rapidAccelCount: 11, idleMinutes: 92, ecoSavingsLiters: 8, safetyBonusVND: 0, courseRecommendation: 'Khóa Đào tạo Bổ sung Lái xe Phòng ngừa (Defensive Driving)' },
  { driverId: 4, driverCode: 'DRV-004', fullName: 'Nguyễn Văn Hùng', licenseClass: 'C', totalKm: 1310, safetyScore: 92, tier: 'Hạng A+ (An Toàn)', ecoStars: 5, hardBrakingCount: 2, overspeedEvents: 1, rapidAccelCount: 3, idleMinutes: 22, ecoSavingsLiters: 38, safetyBonusVND: 1200000, courseRecommendation: 'Duy trì phong độ Eco-Driving' },
];
`;
  logistics = logistics.replace('const router = Router();', `const router = Router();\n${driverData}`);
  fs.writeFileSync('src/routes/logistics.routes.ts', logistics);
}
