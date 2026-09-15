const fs = require('fs');
const file = 'src/components/workspaces/lotsBatches/LotsBatchesMasterTab.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add XLSX import
content = content.replace(
  "import { Search", 
  "import * as XLSX from 'xlsx';\nimport { Search"
);

// 2. Add State and Handlers
const stateAndHandlers = `  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBatchNo, setNewBatchNo] = useState(\`LOT-2026-0\${lots.length + 1}\`);
  const [newSku, setNewSku] = useState('SKU-ENG-088');
  const [newProductName, setNewProductName] = useState('Động cơ servo AC 750W');
  const [newQty, setNewQty] = useState('300');
  const [newWarehouse, setNewWarehouse] = useState('WH-01 (Kho Tổng Hà Nội)');
  const [newExpDate, setNewExpDate] = useState('2029-12-31');

  const handleExportExcel = () => {
    try {
      const exportData = filteredLots.map(lot => ({
        'Mã Lô (Batch No)': lot.batchNumber,
        'SKU': lot.sku,
        'Tên Sản Phẩm': lot.productName,
        'Kho Vị Trí': lot.warehouse,
        'Ngày Sản Xuất': lot.mfgDate,
        'Hạn Sử Dụng': lot.expDate,
        'Tồn Hiện Tại': lot.currentQty,
        'Đơn Vị': lot.uom,
        'Trạng Thái': lot.status,
        'Mã Lô NCC': lot.supplierLot
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Danh_Sach_Lo');
      XLSX.writeFile(wb, \`NexusSync_Lots_\${new Date().toISOString().slice(0, 10)}.xlsx\`);
      onNotify('success', 'Xuất File Excel Thành Công', 'Đã xuất dữ liệu lô hàng ra file Excel.');
    } catch (err) {
      onNotify('error', 'Lỗi Xuất File', 'Không thể xuất dữ liệu ra file Excel.');
    }
  };

  const handleCreateLot = (e: React.FormEvent) => {
    e.preventDefault();
    const newLot: LotItem = {
      id: \`LOT-\${new Date().getTime()}\`,
      batchNumber: newBatchNo,
      sku: newSku,
      productName: newProductName,
      category: 'Vật tư mới',
      warehouse: newWarehouse,
      mfgDate: new Date().toISOString().slice(0, 10),
      expDate: newExpDate,
      initialQty: parseInt(newQty) || 0,
      currentQty: parseInt(newQty) || 0,
      uom: 'Cái',
      status: 'ACTIVE',
      supplierLot: \`SUP-\${new Date().getTime().toString().slice(-5)}\`
    };
    setLots(prev => [newLot, ...prev]);
    setIsModalOpen(false);
    onNotify('success', 'Tạo Lô Thành Công', \`Đã tạo lô \${newLot.batchNumber} thành công.\`);
  };

  const [confirmDialog, setConfirmDialog]`;

content = content.replace("  const [confirmDialog, setConfirmDialog]", stateAndHandlers);


// 3. Attach onClick to buttons
content = content.replace(
  /<button className="flex-1 md:flex-none px-3 py-1\.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1\.5 border border-slate-200 dark:border-slate-600">\s*<FileText className="w-3\.5 h-3\.5" \/>\s*<span>Xuất Excel<\/span>\s*<\/button>/g,
  `<button onClick={handleExportExcel} className="flex-1 md:flex-none px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-600">
            <FileText className="w-3.5 h-3.5" />
            <span>Xuất Excel</span>
          </button>`
);

content = content.replace(
  /onClick=\{\(\) => onNotify\('info', 'Chức năng đang mở rộng', 'Mở form tạo Lô mới\.'\)\}/g,
  `onClick={() => { setNewBatchNo(\`LOT-2026-0\${lots.length + 1}\`); setIsModalOpen(true); }}`
);

// 4. Inject Modal JSX before the final closing div
const modalJSX = `
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Đăng Ký Lô Sản Xuất & Hạn Sử Dụng Mới</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateLot} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">Mã Số Lô (Batch Number)</label>
                <input
                  type="text"
                  value={newBatchNo}
                  onChange={(e) => setNewBatchNo(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">Mã SKU</label>
                  <select
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  >
                    <option value="SKU-ENG-088">SKU-ENG-088</option>
                    <option value="SKU-PLC-102">SKU-PLC-102</option>
                    <option value="SKU-SEN-305">SKU-SEN-305</option>
                    <option value="SKU-INV-204">SKU-INV-204</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">Số lượng nhập ban đầu</label>
                  <input
                    type="number"
                    value={newQty}
                    onChange={(e) => setNewQty(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">Tên Sản Phẩm</label>
                <input
                  type="text"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">Kho Nhận</label>
                  <select
                    value={newWarehouse}
                    onChange={(e) => setNewWarehouse(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="WH-01 (Kho Tổng Hà Nội)">WH-01 (Kho Tổng Hà Nội)</option>
                    <option value="WH-02 (Kho Chi nhánh Nam)">WH-02 (Kho Chi nhánh Nam)</option>
                    <option value="WH-03 (Kho Linh kiện CNC)">WH-03 (Kho Linh kiện CNC)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">Hạn Sử Dụng (Exp Date)</label>
                  <input
                    type="date"
                    value={newExpDate}
                    onChange={(e) => setNewExpDate(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-xl transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
                >
                  Đăng Ký Lô Hàng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
`;

content = content.replace(
  /    <\/div>\s*  \);\s*};\s*$/m,
  modalJSX
);

fs.writeFileSync(file, content, 'utf8');
