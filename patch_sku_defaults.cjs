const fs = require('fs');
const file = 'src/components/workspaces/lotsBatches/LotsBatchesMasterTab.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "const [newSku, setNewSku] = useState('SKU-ENG-088');",
  "const [newSku, setNewSku] = useState(ENTERPRISE_MASTER_PRODUCTS[0]?.sku || '');"
);

content = content.replace(
  "const [newProductName, setNewProductName] = useState('Động cơ servo AC 750W');",
  "const [newProductName, setNewProductName] = useState(ENTERPRISE_MASTER_PRODUCTS[0]?.name || '');"
);

// We should also reset these values when opening the modal
content = content.replace(
  "onClick={() => { setNewBatchNo(`LOT-2026-0${lots.length + 1}`); setIsModalOpen(true); }}",
  "onClick={() => { setNewBatchNo(`LOT-2026-0${lots.length + 1}`); setNewSku(ENTERPRISE_MASTER_PRODUCTS[0]?.sku || ''); setNewProductName(ENTERPRISE_MASTER_PRODUCTS[0]?.name || ''); setIsModalOpen(true); }}"
);

fs.writeFileSync(file, content, 'utf8');
