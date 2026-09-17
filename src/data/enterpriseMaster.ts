export interface EnterpriseProduct {
  sku: string;
  name: string;
  category: string;
  unit: string;
  costPrice: number;
  wholesalePrice: number;
  retailPrice: number;
  stock: number;
  status: 'ACTIVE' | 'INACTIVE';
  warehouseId?: string;
  warehouseName?: string;
  binLocation?: string;
  lotNo?: string;
  packSpec?: string;
  storageCondition?: string;
  safetyStock?: number;
  supplier?: string;
  technicalSpecs?: string;
  expDate?: string;
  daysToExpiry?: number;
  imageUrl?: string;
}

export const ENTERPRISE_MASTER_PRODUCTS: EnterpriseProduct[] = [
  {
    sku: 'PRD-001',
    name: 'Laptop Business 14',
    category: 'Thiết bị CNTT',
    unit: 'Cái',
    costPrice: 20000000,
    wholesalePrice: 24000000,
    retailPrice: 25000000,
    stock: 15,
    status: 'ACTIVE',
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=200&auto=format&fit=crop&q=80'
  },
  {
    sku: 'PRD-002',
    name: 'Monitor 27"',
    category: 'Thiết bị CNTT',
    unit: 'Cái',
    costPrice: 5000000,
    wholesalePrice: 6000000,
    retailPrice: 7000000,
    stock: 20,
    status: 'ACTIVE',
    expDate: '01/10/2026',
    daysToExpiry: 22,
    imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=200&auto=format&fit=crop&q=80'
  },
  {
    sku: 'PRD-003',
    name: 'Keyboard Mechanical',
    category: 'Phụ kiện',
    unit: 'Cái',
    costPrice: 500000,
    wholesalePrice: 700000,
    retailPrice: 800000,
    stock: 30,
    status: 'ACTIVE',
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=200&auto=format&fit=crop&q=80'
  },
  {
    sku: 'PRD-004',
    name: 'Wireless Mouse',
    category: 'Phụ kiện',
    unit: 'Cái',
    costPrice: 300000,
    wholesalePrice: 400000,
    retailPrice: 500000,
    stock: 30,
    status: 'ACTIVE',
    expDate: '15/10/2026',
    daysToExpiry: 36,
    imageUrl: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=200&auto=format&fit=crop&q=80'
  },
  {
    sku: 'SKU-ENG-088',
    name: 'Bơm thủy lực cao áp P-1000',
    category: 'Thiết bị cơ khí',
    unit: 'Cái',
    costPrice: 2500000,
    wholesalePrice: 3200000,
    retailPrice: 3500000,
    stock: 45,
    status: 'ACTIVE',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=200&auto=format&fit=crop&q=80'
  },
  {
    sku: 'SKU-MAT-302',
    name: 'Cảm biến lưu lượng điện từ DN80',
    category: 'Cảm biến IoT',
    unit: 'Cái',
    costPrice: 1300000,
    wholesalePrice: 1700000,
    retailPrice: 1850000,
    stock: 80,
    status: 'ACTIVE',
    imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=200&auto=format&fit=crop&q=80'
  },
  {
    sku: 'SKU-ELC-901',
    name: 'Biến tần công nghiệp 3 pha 45kW',
    category: 'Thiết bị điện',
    unit: 'Cái',
    costPrice: 9500000,
    wholesalePrice: 11500000,
    retailPrice: 12500000,
    stock: 12,
    status: 'ACTIVE',
    imageUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=200&auto=format&fit=crop&q=80'
  },
  {
    sku: 'SKU-RAW-101',
    name: 'Thép cuộn cán nóng SS400 (Cuộn 50kg)',
    category: 'Nguyên vật liệu',
    unit: 'Cuộn',
    costPrice: 1100000,
    wholesalePrice: 1350000,
    retailPrice: 1450000,
    stock: 120,
    status: 'ACTIVE',
    imageUrl: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=200&auto=format&fit=crop&q=80'
  },
  {
    sku: 'SKU-ACC-055',
    name: 'Cáp tín hiệu chống nhiễu 2x1.5 (Mét)',
    category: 'Phụ kiện',
    unit: 'Mét',
    costPrice: 18000,
    wholesalePrice: 22000,
    retailPrice: 25000,
    stock: 1500,
    status: 'ACTIVE',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200&auto=format&fit=crop&q=80'
  },
  {
    sku: 'SKU-TOOL-12',
    name: 'Bộ cờ lê tròng tự động 12 chi tiết',
    category: 'Dụng cụ cầm tay',
    unit: 'Bộ',
    costPrice: 600000,
    wholesalePrice: 780000,
    retailPrice: 850000,
    stock: 35,
    status: 'ACTIVE',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=200&auto=format&fit=crop&q=80'
  },
  {
    sku: 'SKU-VALVE-04',
    name: 'Van bi inox điều khiển khí nén DN50',
    category: 'Van công nghiệp',
    unit: 'Cái',
    costPrice: 1900000,
    wholesalePrice: 2400000,
    retailPrice: 2600000,
    stock: 22,
    status: 'ACTIVE',
    imageUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=200&auto=format&fit=crop&q=80'
  },
  {
    sku: 'RAM-16GB-DDR5',
    name: 'Bộ nhớ RAM DDR5 16GB Bus 5600MHz Kingston Fury',
    category: 'RAM',
    unit: 'Cây',
    costPrice: 444444,
    wholesalePrice: 620000,
    retailPrice: 666666,
    stock: 120,
    status: 'ACTIVE',
    imageUrl: 'https://images.unsplash.com/photo-1562976540-1e02c1106e4a?w=200&auto=format&fit=crop&q=80'
  },
  {
    sku: 'SSD-1TB-NVME',
    name: 'Ổ cứng SSD NVMe Samsung 990 Pro 1TB PCIe 4.0',
    category: 'SSD',
    unit: 'Chiếc',
    costPrice: 1200000,
    wholesalePrice: 1450000,
    retailPrice: 1560000,
    stock: 85,
    status: 'ACTIVE',
    imageUrl: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=200&auto=format&fit=crop&q=80'
  },
  {
    sku: 'CPU-INTEL-I7',
    name: 'Bộ Vi Xử Lý Intel Core i7 14700K 20 Cores',
    category: 'CPU',
    unit: 'Chiếc',
    costPrice: 3500000,
    wholesalePrice: 4100000,
    retailPrice: 4375000,
    stock: 60,
    status: 'ACTIVE',
    imageUrl: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=200&auto=format&fit=crop&q=80'
  },
  {
    sku: 'SKU-CHIP-3NM',
    name: 'Vi Xử Lý AI 3nm Nexus-V1',
    category: 'Bán dẫn',
    unit: 'Cái',
    costPrice: 9000000,
    wholesalePrice: 11500000,
    retailPrice: 12500000,
    stock: 1250,
    status: 'ACTIVE',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&auto=format&fit=crop&q=80'
  },
  {
    sku: 'SKU-NANO-CO2',
    name: 'Vật Liệu Hấp Thụ Carbon Nano-G',
    category: 'Vật liệu xanh',
    unit: 'Kg',
    costPrice: 2400000,
    wholesalePrice: 2900000,
    retailPrice: 3200000,
    stock: 4300,
    status: 'ACTIVE',
    imageUrl: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=200&auto=format&fit=crop&q=80'
  },
  {
    sku: 'SKU-ERP-LIC',
    name: 'Bản quyền Doanh nghiệp NexusSync ERP v5',
    category: 'Phần mềm',
    unit: 'License',
    costPrice: 100000000,
    wholesalePrice: 135000000,
    retailPrice: 150000000,
    stock: 999,
    status: 'ACTIVE',
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&auto=format&fit=crop&q=80'
  }
];

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
    creditLimit: '2.000.000.000 ₫',
    outstanding: '450.000.000 ₫',
    status: 'ACTIVE',
    tier: 'VIP Gold'
  },
  {
    id: 'CUST-B2B-002',
    name: 'Tập đoàn Sản xuất Công nghiệp Miền Nam',
    taxCode: '0301982345',
    creditLimit: '5.000.000.000 ₫',
    outstanding: '1.820.000.000 ₫',
    status: 'ACTIVE',
    tier: 'Strategic'
  },
  {
    id: 'CUST-B2B-003',
    name: 'Công ty TNHH Thương mại Quốc tế Alpha',
    taxCode: '0319884422',
    creditLimit: '1.000.000.000 ₫',
    outstanding: '920.000.000 ₫',
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
