const fs = require('fs');
const file = 'src/components/workspaces/lotsBatches/LotsBatchesMasterTab.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add import if not exists
if (!content.includes('ENTERPRISE_MASTER_PRODUCTS')) {
  content = content.replace(
    "import { LotItem } from '../LotInventoryHistoryDrilldown';",
    "import { LotItem } from '../LotInventoryHistoryDrilldown';\nimport { ENTERPRISE_MASTER_PRODUCTS } from '../../../data/enterpriseMaster';"
  );
}

// Replace select dropdown
const oldSelect = `<select
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  >
                    <option value="SKU-ENG-088">SKU-ENG-088</option>
                    <option value="SKU-PLC-102">SKU-PLC-102</option>
                    <option value="SKU-SEN-305">SKU-SEN-305</option>
                    <option value="SKU-INV-204">SKU-INV-204</option>
                  </select>`;

const newSelect = `<select
                    value={newSku}
                    onChange={(e) => {
                      const selectedSku = e.target.value;
                      setNewSku(selectedSku);
                      const selectedProduct = ENTERPRISE_MASTER_PRODUCTS.find(p => p.sku === selectedSku);
                      if (selectedProduct) {
                        setNewProductName(selectedProduct.name);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  >
                    <option value="" disabled>-- Chọn SKU --</option>
                    {ENTERPRISE_MASTER_PRODUCTS.map(product => (
                      <option key={product.sku} value={product.sku}>{product.sku} - {product.name}</option>
                    ))}
                  </select>`;

content = content.replace(oldSelect, newSelect);

fs.writeFileSync(file, content, 'utf8');
