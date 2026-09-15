import * as fs from 'fs';
import * as path from 'path';

const enterpriseMasterPath = 'src/data/enterpriseMaster.ts';
let enterpriseMasterContent = fs.readFileSync(enterpriseMasterPath, 'utf8');

if (!enterpriseMasterContent.includes('EnterpriseWarehouse')) {
    enterpriseMasterContent += `
export interface EnterpriseWarehouse {
  id: string;
  name: string;
  code: string;
  type: 'DISTRIBUTION' | 'MANUFACTURING' | 'RETAIL' | 'COLD_STORAGE' | 'TRANSIT';
  capacity: number;
  status: 'ACTIVE' | 'MAINTENANCE' | 'CLOSED';
}

export const ENTERPRISE_MASTER_WAREHOUSES: EnterpriseWarehouse[] = [
  { id: 'WH-HCM-01', name: 'Tổng kho Miền Nam (Sóng Thần)', code: 'HCM-01', type: 'DISTRIBUTION', capacity: 15000, status: 'ACTIVE' },
  { id: 'WH-HN-01', name: 'Tổng kho Miền Bắc (Tiên Sơn)', code: 'HN-01', type: 'DISTRIBUTION', capacity: 12000, status: 'ACTIVE' },
  { id: 'WH-DN-01', name: 'Kho Trung Chuyển Đà Nẵng', code: 'DN-01', type: 'TRANSIT', capacity: 5000, status: 'ACTIVE' },
  { id: 'WH-MFG-01', name: 'Kho NVL Nhà máy VSIP', code: 'MFG-01', type: 'MANUFACTURING', capacity: 8000, status: 'ACTIVE' }
];
`;
    fs.writeFileSync(enterpriseMasterPath, enterpriseMasterContent);
    console.log("Centralized Warehouses injected into src/data/enterpriseMaster.ts");
}
