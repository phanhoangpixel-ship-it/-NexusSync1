import * as fs from 'fs';
import * as path from 'path';

const m07Path = 'src/modules/master-data/m07-customers-item-master/components/M07CustomersItemMasterWorkspace.tsx';
let m07Content = fs.readFileSync(m07Path, 'utf8');

// Replace the mock array with ENTERPRISE_MASTER_CUSTOMERS
m07Content = m07Content.replace(
  /const \[customers, setCustomers\] = useState<any\[\]>\(\[\s*\{\s*id: 'CUST-B2B-001'[\s\S]*?\]\);/,
  "const [customers, setCustomers] = useState<any[]>(ENTERPRISE_MASTER_CUSTOMERS);"
);

if (!m07Content.includes('ENTERPRISE_MASTER_CUSTOMERS')) {
    // try importing it
    m07Content = m07Content.replace(
        "import { ENTERPRISE_MASTER_PRODUCTS, EnterpriseProduct } from '../../../../data/enterpriseMaster';",
        "import { ENTERPRISE_MASTER_PRODUCTS, EnterpriseProduct, ENTERPRISE_MASTER_CUSTOMERS } from '../../../../data/enterpriseMaster';"
    );
}

fs.writeFileSync(m07Path, m07Content);
console.log("M07 Refactored to use ENTERPRISE_MASTER_CUSTOMERS");
