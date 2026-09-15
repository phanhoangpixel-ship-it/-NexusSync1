import * as fs from 'fs';
import * as path from 'path';

const enterpriseMasterPath = 'src/data/enterpriseMaster.ts';
let enterpriseMasterContent = fs.readFileSync(enterpriseMasterPath, 'utf8');

if (!enterpriseMasterContent.includes('EnterpriseCustomer')) {
    enterpriseMasterContent += `
export interface EnterpriseCustomer {
  id: string;
  name: string;
  taxCode: string;
  creditLimit: string;
  outstanding: string;
  status: 'ACTIVE' | 'WARNING' | 'INACTIVE';
  tier: 'VIP Gold' | 'Strategic' | 'Standard' | 'Basic';
}

export const ENTERPRISE_MASTER_CUSTOMERS: EnterpriseCustomer[] = [
  {
    id: 'CUST-B2B-001',
    name: 'Công ty Cổ phần Công nghệ Vin1Tech',
    taxCode: '0314567891',
    creditLimit: '2,000,000,000 VND',
    outstanding: '450,000,000 VND',
    status: 'ACTIVE',
    tier: 'VIP Gold'
  },
  {
    id: 'CUST-B2B-002',
    name: 'Tập đoàn Sản xuất Công nghiệp Miền Nam',
    taxCode: '0301982345',
    creditLimit: '5,000,000,000 VND',
    outstanding: '1,820,000,000 VND',
    status: 'ACTIVE',
    tier: 'Strategic'
  },
  {
    id: 'CUST-B2B-003',
    name: 'Công ty TNHH Thương mại Quốc tế Alpha',
    taxCode: '0319884422',
    creditLimit: '1,000,000,000 VND',
    outstanding: '920,000,000 VND',
    status: 'WARNING',
    tier: 'Standard'
  }
];

export interface EnterpriseSupplier {
  id: string;
  name: string;
  code: string;
  category: string;
  rating: number;
  status: 'ACTIVE' | 'INACTIVE' | 'WARNING';
}

export const ENTERPRISE_MASTER_SUPPLIERS: EnterpriseSupplier[] = [
  { id: 'SUPP-001', name: 'Công ty CP Thép Hòa Phát', code: 'HPG', category: 'Raw Materials', rating: 4.8, status: 'ACTIVE' },
  { id: 'SUPP-002', name: 'Nhựa Bình Minh', code: 'BMP', category: 'Packaging', rating: 4.5, status: 'ACTIVE' },
  { id: 'SUPP-003', name: 'Viettel Telecom', code: 'VTL', category: 'Services', rating: 4.9, status: 'ACTIVE' }
];
`;
    fs.writeFileSync(enterpriseMasterPath, enterpriseMasterContent);
    console.log("Centralized Master Data injected into src/data/enterpriseMaster.ts");
}
