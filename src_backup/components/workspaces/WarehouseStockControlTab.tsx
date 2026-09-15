import React, { useState, useMemo, useEffect } from 'react';
import { 
  ClipboardCheck, AlertTriangle, ShieldAlert, Plus, Download, Filter, 
  CheckCircle2, XCircle, Clock, Search, RotateCcw, Boxes, FileSpreadsheet, 
  Eye, Check, X, Printer, Shield, ArrowUpRight, BarChart2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ModuleTabShell, ModuleTabShellAction, ModuleTabShellFilter } from '../common/ModuleTabShell';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { ConfirmDialogState, SelectedEntityContext } from '../../types';
import { ENTERPRISE_MASTER_PRODUCTS } from '../../data/enterpriseMaster';

export interface StockControlItem {
  id: string;
  type: 'Cycle Count' | 'Adjustment Request' | 'Quarantine' | 'Damaged Scrap';
  sku?: string;
  name?: string;
  zone?: string;
  warehouse: string;
  qty: number;
  variance?: string;
  reason: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'QUARANTINE';
  inspector: string;
  createdDate: string;
  approvedDate?: string;
  approvedBy?: string;
  notes?: string;
}

const defaultControlItems: StockControlItem[] = [
  {
    id: 'ADJ-2026-0101',
    type: 'Adjustment Request',
    sku: 'SKU-MCH-501',
    name: 'Máy hàn cáp quang tự động Fujikura 90S+',
    warehouse: 'Kho Tổng Trung Tâm (TP.HCM)',
    qty: -1,
    variance: '-1 Máy',
    reason: 'Hư hỏng linh kiện gương phản xạ trong quá trình vận chuyển nội bộ',
    status: 'PENDING_APPROVAL',
    inspector: 'Kỹ sư Vũ Hoàng Minh (KCS-03)',
    createdDate: '09/09/2026 09:30',
    notes: 'Đã lập biên bản giám định hiện trường, chờ GĐ Vận Hành phê duyệt khấu trừ tồn kho.'
  },
  {
    id: 'QUA-2026-0202',
    type: 'Quarantine',
    sku: 'SKU-MED-004',
    name: 'Kháng sinh Paracetamol 500mg USP Dược Phẩm',
    warehouse: 'Kho Lạnh Dược Phẩm (Bình Dương)',
    qty: 250,
    variance: '+250 Hộp',
    reason: 'Chờ hiệu chuẩn kiểm định độ hòa tan và kết quả vi sinh của Viện Pasteur',
    status: 'QUARANTINE',
    inspector: 'Dược sĩ Trần Bích Ngọc (QC-01)',
    createdDate: '08/09/2026 14:15',
    notes: 'Đã niêm phong khu Zone Q-04, tạm khóa xuất kho cho đến khi có COA hợp lệ.'
  },
  {
    id: 'STK-2026-0088',
    type: 'Cycle Count',
    zone: 'Zone A - Dãy Kệ 03 - Tầng 2 (BIN-A03-02)',
    warehouse: 'Kho Tổng Trung Tâm (TP.HCM)',
    qty: -2,
    variance: '-2 Đơn vị',
    reason: 'Kiểm kê định kỳ chu kỳ hàng tuần phát hiện lệch thực tế so với sổ cái',
    status: 'PENDING_APPROVAL',
    inspector: 'Thủ kho Nguyễn Văn Kho',
    createdDate: '08/09/2026 16:45',
    notes: 'Đang rà soát lại các phiếu xuất bán lẻ SO-2026-9912 để tìm nguyên nhân.'
  },
  {
    id: 'ADJ-2026-0095',
    type: 'Adjustment Request',
    sku: 'SKU-RAW-112',
    name: 'Hóa chất phụ gia Polymer Tech Poly-Add 90',
    warehouse: 'Kho Vận Trung Chuyển (Hà Nội)',
    qty: 50,
    variance: '+50 Kg',
    reason: 'Kiểm đếm thực tế khi nhập container số Cont: TCLU-881290 dư so với PO',
    status: 'APPROVED',
    inspector: 'Giám sát kho Lê Hải Đăng',
    createdDate: '07/09/2026 11:20',
    approvedDate: '07/09/2026 15:00',
    approvedBy: 'Trưởng phòng Kho vận (Lê Văn Quản)',
    notes: 'Đã bổ sung vào biên bản bàn giao nhà cung cấp ABC Technology.'
  },
  {
    id: 'SCR-2026-0034',
    type: 'Damaged Scrap',
    sku: 'SKU-PKG-009',
    name: 'Màng PE co quấn pallet 50cm x 3.2kg',
    warehouse: 'Kho Cảng Biển (Hải Phòng)',
    qty: -12,
    variance: '-12 Cuộn',
    reason: 'Bị rách bao bì và ẩm mốc do ngập nước cục bộ trong bão',
    status: 'APPROVED',
    inspector: 'Đội trưởng bảo vệ & An toàn kho',
    createdDate: '05/09/2026 08:10',
    approvedDate: '05/09/2026 10:30',
    approvedBy: 'GĐ Chi nhánh Hải Phòng',
    notes: 'Đã chuyển vào kho phế liệu để lập thủ tục thanh lý tiêu hủy theo quy chuẩn ISO 14001.'
  },
  {
    id: 'STK-2026-0079',
    type: 'Cycle Count',
    zone: 'Zone B - Khu Lưu Trữ Thiết Bị (BIN-B02-01)',
    warehouse: 'Kho Vệ Tinh (Cần Thơ)',
    qty: 0,
    variance: '0 (Khớp 100%)',
    reason: 'Kiểm kê định kỳ đạt chuẩn, không phát sinh chênh lệch số lượng',
    status: 'APPROVED',
    inspector: 'Kiểm kê viên Phan Thị Thu',
    createdDate: '04/09/2026 17:00',
    approvedDate: '04/09/2026 17:30',
    approvedBy: 'Thủ kho Cần Thơ',
    notes: 'Dữ liệu tồn khớp hoàn hảo với ERP Core.'
  },
  {
    id: 'ADJ-2026-0082',
    type: 'Adjustment Request',
    sku: 'SKU-CHM-088',
    name: 'Dung môi công nghiệp Isopropanol 99.8%',
    warehouse: 'Kho Hóa Chất Chuyên Dụng (Bình Dương)',
    qty: -10,
    variance: '-10 Lít',
    reason: 'Đề xuất hao hụt tự nhiên do bay hơi trong quá trình chiết rót thùng phuy',
    status: 'REJECTED',
    inspector: 'Kỹ thuật viên hóa nghiệm',
    createdDate: '03/09/2026 10:00',
    approvedDate: '03/09/2026 14:00',
    approvedBy: 'Trưởng phòng KCS (Bác bỏ do vượt định mức hao hụt cho phép 0.5%)',
    notes: 'Yêu cầu kiểm tra lại độ kín của gioăng van bồn chứa trước khi trình duyệt lại.'
  }
];

interface WarehouseStockControlTabProps {
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
  onSelectEntity?: (entity: SelectedEntityContext) => void;
}

export const WarehouseStockControlTab: React.FC<WarehouseStockControlTabProps> = ({
  onNotify,
  onSelectEntity
}) => {
  const [items, setItems] = useState<StockControlItem[]>(defaultControlItems);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Modals & ConfirmDialog
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDetailItem, setSelectedDetailItem] = useState<StockControlItem | null>(null);

  // New Item Form State
  const [newForm, setNewForm] = useState({
    type: 'Adjustment Request' as StockControlItem['type'],
    sku: ENTERPRISE_MASTER_PRODUCTS[0]?.sku || 'SKU-MCH-501',
    warehouse: 'Kho Tổng Trung Tâm (TP.HCM)',
    qty: -1,
    reason: '',
    notes: ''
  });

  // Filter pipeline
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Status Filter
      if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }
      // Type Filter
      if (typeFilter !== 'ALL' && item.type !== typeFilter) {
        return false;
      }
      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchId = item.id.toLowerCase().includes(query);
        const matchSku = item.sku?.toLowerCase().includes(query);
        const matchName = item.name?.toLowerCase().includes(query);
        const matchZone = item.zone?.toLowerCase().includes(query);
        const matchReason = item.reason.toLowerCase().includes(query);
        const matchInspector = item.inspector.toLowerCase().includes(query);
        if (!matchId && !matchSku && !matchName && !matchZone && !matchReason && !matchInspector) {
          return false;
        }
      }
      return true;
    });
  }, [items, statusFilter, typeFilter, searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, typeFilter, searchQuery]);

  // Pagination slice
  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  // Handle Approve with Rule #19 ConfirmDialog
  const handleApprove = (item: StockControlItem) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xác Nhận Phê Duyệt Điều Chỉnh Tồn Kho (Rule #19)',
      message: `Bạn có chắc chắn muốn phê duyệt lệnh "${item.id}" (${item.type}) cho mặt hàng/khu vực "${item.name || item.zone}"? Thao tác này sẽ cập nhật sổ cái tồn kho và ghi nhật ký kiểm toán bất biến.`,
      confirmText: 'Phê Duyệt Ngay',
      cancelText: 'Hủy Bỏ',
      type: 'warning',
      onConfirm: () => {
        setItems(prev => prev.map(i => i.id === item.id ? {
          ...i,
          status: 'APPROVED',
          approvedDate: new Date().toLocaleString('vi-VN'),
          approvedBy: 'Trưởng Ban Vận Hành Kho (Admin)'
        } : i));
        onNotify('success', 'Đã Phê Duyệt Lệnh Kiểm Soát', `Lệnh ${item.id} đã được phê duyệt và ghi nhận vào sổ cái Inventory Ledger.`);
      }
    });
  };

  // Handle Reject with Rule #19 ConfirmDialog
  const handleReject = (item: StockControlItem) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Bác Bỏ Yêu Cầu Điều Chỉnh Kho',
      message: `Bạn có chắc chắn muốn từ chối phê duyệt yêu cầu "${item.id}"? Yêu cầu này sẽ được đánh dấu không hợp lệ và hoàn trả về cho kiểm kê viên.`,
      confirmText: 'Từ Chối Yêu Cầu',
      cancelText: 'Hủy',
      type: 'danger',
      onConfirm: () => {
        setItems(prev => prev.map(i => i.id === item.id ? {
          ...i,
          status: 'REJECTED',
          approvedDate: new Date().toLocaleString('vi-VN'),
          approvedBy: 'Ban Giám Sát KCS'
        } : i));
        onNotify('warning', 'Đã Bác Bỏ Yêu Cầu', `Lệnh ${item.id} đã bị từ chối phê duyệt.`);
      }
    });
  };

  // Export to Excel
  const handleExportExcel = () => {
    try {
      const rows = filteredItems.map(item => ({
        'Mã Lệnh': item.id,
        'Loại Giao Dịch': item.type,
        'Mã SKU': item.sku || 'N/A',
        'Tên Mặt Hàng / Khu Vực': item.name || item.zone || '',
        'Cơ Sở Kho': item.warehouse,
        'Số Lượng Chênh Lệch': item.variance || item.qty,
        'Lý Do': item.reason,
        'Trạng Thái': item.status === 'APPROVED' ? 'Đã duyệt' : item.status === 'PENDING_APPROVAL' ? 'Chờ duyệt' : item.status === 'QUARANTINE' ? 'Cách ly KCS' : 'Từ chối',
        'Kiểm Kê Viên': item.inspector,
        'Ngày Tạo': item.createdDate,
        'Người Phê Duyệt': item.approvedBy || 'Chưa duyệt',
        'Ghi Chú': item.notes || ''
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = [
        { wch: 16 }, { wch: 20 }, { wch: 15 }, { wch: 35 }, { wch: 25 },
        { wch: 15 }, { wch: 35 }, { wch: 15 }, { wch: 22 }, { wch: 18 },
        { wch: 22 }, { wch: 30 }
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Inventory Control');
      XLSX.writeFile(wb, `NexusSync_M18_Inventory_Control_${new Date().toISOString().slice(0, 10)}.xlsx`);
      onNotify('success', 'Xuất File Thành Công', 'Báo cáo kiểm soát tồn kho đã được tải xuống.');
    } catch (err: any) {
      onNotify('danger', 'Lỗi Xuất File', 'Không thể tạo tệp Excel. Vui lòng thử lại.');
    }
  };

  // Submit New Item
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.reason.trim()) {
      onNotify('warning', 'Thiếu Thông Tin', 'Vui lòng nhập lý do điều chỉnh hoặc kiểm kê.');
      return;
    }

    const matchedProduct = ENTERPRISE_MASTER_PRODUCTS.find(p => p.sku === newForm.sku);
    const prefix = newForm.type === 'Quarantine' ? 'QUA' : newForm.type === 'Damaged Scrap' ? 'SCR' : newForm.type === 'Cycle Count' ? 'STK' : 'ADJ';
    const newId = `${prefix}-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newItem: StockControlItem = {
      id: newId,
      type: newForm.type,
      sku: newForm.type === 'Cycle Count' ? undefined : newForm.sku,
      name: newForm.type === 'Cycle Count' ? undefined : (matchedProduct?.name || 'Sản phẩm linh kiện kho'),
      zone: newForm.type === 'Cycle Count' ? 'Zone A - Ô Kệ BIN-A01' : undefined,
      warehouse: newForm.warehouse,
      qty: newForm.qty,
      variance: `${newForm.qty > 0 ? '+' : ''}${newForm.qty} Đơn vị`,
      reason: newForm.reason,
      status: newForm.type === 'Quarantine' ? 'QUARANTINE' : 'PENDING_APPROVAL',
      inspector: 'Thủ Kho Vận Hành (CurrentUser)',
      createdDate: new Date().toLocaleString('vi-VN'),
      notes: newForm.notes || 'Khởi tạo từ giao diện Tab E Inventory Control.'
    };

    setItems(prev => [newItem, ...prev]);
    setIsAddModalOpen(false);
    setNewForm({
      type: 'Adjustment Request',
      sku: ENTERPRISE_MASTER_PRODUCTS[0]?.sku || 'SKU-MCH-501',
      warehouse: 'Kho Tổng Trung Tâm (TP.HCM)',
      qty: -1,
      reason: '',
      notes: ''
    });
    onNotify('success', 'Tạo Yêu Cầu Thành Công', `Đã tạo yêu cầu ${newItem.id} (${newItem.type}) thành công.`);
  };

  // Shell Filters definition
  const shellFilters: ModuleTabShellFilter[] = [
    {
      key: 'status',
      label: 'Trạng Thái',
      type: 'select',
      value: statusFilter,
      onChange: setStatusFilter,
      options: [
        { label: 'Tất cả trạng thái', value: 'ALL' },
        { label: 'Chờ phê duyệt', value: 'PENDING_APPROVAL' },
        { label: 'Đã phê duyệt', value: 'APPROVED' },
        { label: 'Cách ly KCS (Quarantine)', value: 'QUARANTINE' },
        { label: 'Bị từ chối', value: 'REJECTED' }
      ]
    },
    {
      key: 'type',
      label: 'Loại Giao Dịch',
      type: 'select',
      value: typeFilter,
      onChange: setTypeFilter,
      options: [
        { label: 'Tất cả loại nghiệp vụ', value: 'ALL' },
        { label: 'Yêu cầu điều chỉnh (Adjustment)', value: 'Adjustment Request' },
        { label: 'Kiểm kê định kỳ (Cycle Count)', value: 'Cycle Count' },
        { label: 'Cách ly sản phẩm (Quarantine)', value: 'Quarantine' },
        { label: 'Thanh lý hỏng (Damaged Scrap)', value: 'Damaged Scrap' }
      ]
    }
  ];

  // Shell Actions definition
  const shellActions: ModuleTabShellAction[] = [
    {
      label: 'Xuất Báo Cáo',
      icon: <Download className="w-3.5 h-3.5" />,
      onClick: handleExportExcel,
      variant: 'secondary'
    },
    {
      label: 'Tạo Đề Xuất Điều Chỉnh',
      icon: <Plus className="w-3.5 h-3.5" />,
      onClick: () => setIsAddModalOpen(true),
      variant: 'primary'
    }
  ];

  return (
    <>
      <ModuleTabShell
        title="E. Quản Lý Kiểm Soát Tồn Kho & Điều Chỉnh (Inventory Control)"
        description="Quản lý vòng đời kiểm kê định kỳ (Cycle Count), xử lý chênh lệch thực tế, đề xuất điều chỉnh tồn kho và niêm phong cách ly hàng lỗi (Quarantine) theo chuẩn ISO 9001 / GSP."
        totalCount={filteredItems.length}
        totalCountLabel="giao dịch kiểm soát"
        actions={shellActions}
        searchable={true}
        searchPlaceholder="Tìm kiếm mã lệnh, SKU, tên sản phẩm, khu vực hoặc lý do..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filters={shellFilters}
        hasActiveFilters={statusFilter !== 'ALL' || typeFilter !== 'ALL' || searchQuery.trim() !== ''}
        onResetFilters={() => {
          setStatusFilter('ALL');
          setTypeFilter('ALL');
          setSearchQuery('');
        }}
        loading={loading}
        error={error}
        isEmpty={filteredItems.length === 0}
        emptyTitle="Không tìm thấy giao dịch kiểm soát"
        emptyMessage="Không có bản ghi điều chỉnh hoặc kiểm kê nào phù hợp với bộ lọc tìm kiếm hiện tại."
        emptyAction={{
          label: 'Tạo Yêu Cầu Điều Chỉnh Mới',
          icon: <Plus className="w-4 h-4" />,
          onClick: () => setIsAddModalOpen(true)
        }}
        pagination={{
          currentPage,
          totalPages,
          pageSize,
          totalItems: filteredItems.length,
          startIndex: filteredItems.length === 0 ? 0 : (currentPage - 1) * pageSize + 1,
          endIndex: Math.min(currentPage * pageSize, filteredItems.length),
          onPageChange: setCurrentPage,
          onPageSizeChange: setPageSize,
          pageSizeOptions: [5, 10, 20, 50]
        }}
      >
        {/* Table View */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-3.5 py-3 w-[14%]">Mã Giao Dịch</th>
                <th className="px-3.5 py-3 w-[14%]">Loại Kiểm Soát</th>
                <th className="px-3.5 py-3 w-[28%]">Chi Tiết / Mã SKU</th>
                <th className="px-3.5 py-3 w-[12%] text-right">Chênh Lệch</th>
                <th className="px-3.5 py-3 w-[12%] text-center">Trạng Thái</th>
                <th className="px-3.5 py-3 w-[20%] text-right">Thao Tác Nghiệp Vụ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {paginatedItems.map((item) => {
                const isPending = item.status === 'PENDING_APPROVAL';
                const isApproved = item.status === 'APPROVED';
                const isQuarantine = item.status === 'QUARANTINE';
                const isRejected = item.status === 'REJECTED';

                return (
                  <tr 
                    key={item.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                    onClick={() => setSelectedDetailItem(item)}
                  >
                    {/* ID */}
                    <td className="px-3.5 py-3">
                      <div className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:underline flex items-center gap-1.5">
                        <Boxes className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{item.id}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{item.createdDate}</div>
                    </td>

                    {/* Type */}
                    <td className="px-3.5 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                        item.type === 'Adjustment Request' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800' :
                        item.type === 'Quarantine' ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800' :
                        item.type === 'Damaged Scrap' ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800' :
                        'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                      }`}>
                        {item.type}
                      </span>
                      <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{item.warehouse}</div>
                    </td>

                    {/* Product / Zone Info */}
                    <td className="px-3.5 py-3">
                      {item.sku ? (
                        <>
                          <div className="font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200">
                            {item.sku}
                          </div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                            {item.name}
                          </div>
                        </>
                      ) : (
                        <div className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                          {item.zone}
                        </div>
                      )}
                      <div className="text-[10px] text-slate-400 italic line-clamp-1 mt-0.5" title={item.reason}>
                        Lý do: {item.reason}
                      </div>
                    </td>

                    {/* Variance / Quantity */}
                    <td className="px-3.5 py-3 text-right font-mono tabular-nums">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        item.qty < 0 ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/40' : 
                        item.qty > 0 ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' : 
                        'text-slate-600 bg-slate-100 dark:bg-slate-800'
                      }`}>
                        {item.variance || `${item.qty > 0 ? '+' : ''}${item.qty}`}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">{item.inspector}</div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-3.5 py-3 text-center">
                      {isPending && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                          <Clock className="w-3 h-3 mr-1 text-amber-500 animate-pulse" />
                          <span>Chờ Phê Duyệt</span>
                        </span>
                      )}
                      {isApproved && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                          <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                          <span>Đã Phê Duyệt</span>
                        </span>
                      )}
                      {isQuarantine && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300 dark:border-purple-700">
                          <ShieldAlert className="w-3 h-3 mr-1 text-purple-600" />
                          <span>Cách Ly KCS</span>
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
                          <XCircle className="w-3 h-3 mr-1 text-rose-500" />
                          <span>Từ Chối</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-3.5 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {isPending && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApprove(item)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                              title="Phê duyệt yêu cầu điều chỉnh tồn kho (Rule #19)"
                            >
                              <Check className="w-3 h-3" />
                              <span>Duyệt</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReject(item)}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg text-xs font-semibold transition cursor-pointer"
                              title="Bác bỏ yêu cầu"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedDetailItem(item)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Chi Tiết</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ModuleTabShell>

      {/* MODAL: DETAIL & AUDIT LOG */}
      {selectedDetailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <div>
                <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-mono text-[10px] font-bold rounded">
                  {selectedDetailItem.type.toUpperCase()}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                  Chi Tiết Lệnh: {selectedDetailItem.id}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedDetailItem(null)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
              >
                <X className="w-5 h-5"/>
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Mã SKU / Khu vực</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                    {selectedDetailItem.sku || selectedDetailItem.zone}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Số lượng lệch</span>
                  <span className="font-mono font-bold text-indigo-600 text-xs">
                    {selectedDetailItem.variance || selectedDetailItem.qty}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Cơ sở kho</span>
                  <span className="text-slate-800 dark:text-slate-200 font-medium">
                    {selectedDetailItem.warehouse}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Kiểm kê viên</span>
                  <span className="text-slate-800 dark:text-slate-200 font-medium">
                    {selectedDetailItem.inspector}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Lý do điều chỉnh / Ghi nhận hiện trường</span>
                <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 leading-relaxed">
                  {selectedDetailItem.reason}
                </div>
              </div>

              {selectedDetailItem.notes && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Ghi chú vận hành & KCS</span>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-400">
                    {selectedDetailItem.notes}
                  </div>
                </div>
              )}

              {selectedDetailItem.approvedBy && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold block">Phê duyệt bởi:</span>
                    <span className="font-semibold">{selectedDetailItem.approvedBy}</span>
                  </div>
                  <span className="font-mono text-[10px]">{selectedDetailItem.approvedDate}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setSelectedDetailItem(null)} 
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition"
                >
                  Đóng
                </button>
                {selectedDetailItem.status === 'PENDING_APPROVAL' && (
                  <button 
                    type="button" 
                    onClick={() => {
                      const item = selectedDetailItem;
                      setSelectedDetailItem(null);
                      handleApprove(item);
                    }} 
                    className="px-4 py-2 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                  >
                    Phê Duyệt Lệnh
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE NEW ADJUSTMENT / QUARANTINE */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <div>
                <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-mono text-[10px] font-bold rounded">
                  NEW INVENTORY CONTROL ACTION
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                  Tạo Đề Xuất Điều Chỉnh / Cách Ly
                </h3>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
              >
                <X className="w-5 h-5"/>
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Loại Nghiệp Vụ Kiểm Soát</label>
                <select
                  value={newForm.type}
                  onChange={e => setNewForm(prev => ({ ...prev, type: e.target.value as StockControlItem['type'] }))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg text-xs font-semibold"
                >
                  <option value="Adjustment Request">Yêu Cầu Điều Chỉnh (Adjustment Request)</option>
                  <option value="Cycle Count">Kiểm Kê Định Kỳ (Cycle Count)</option>
                  <option value="Quarantine">Cách Ly Hàng Lỗi / Cận Hạn (Quarantine)</option>
                  <option value="Damaged Scrap">Thanh Lý Tiêu Hủy Hàng Hỏng (Damaged Scrap)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Chọn Sản Phẩm Liên Quan</label>
                <select
                  value={newForm.sku}
                  onChange={e => setNewForm(prev => ({ ...prev, sku: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg text-xs font-semibold"
                >
                  {ENTERPRISE_MASTER_PRODUCTS.map(p => (
                    <option key={p.sku} value={p.sku}>
                      {p.sku} - {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Số Lượng Chênh Lệch</label>
                  <input
                    type="number"
                    value={newForm.qty}
                    onChange={e => setNewForm(prev => ({ ...prev, qty: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg text-xs font-mono font-bold"
                    placeholder="e.g. -2 hoặc +10"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Nhập số âm nếu thiếu hụt</span>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Cơ Sở Kho</label>
                  <select
                    value={newForm.warehouse}
                    onChange={e => setNewForm(prev => ({ ...prev, warehouse: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg text-xs font-semibold"
                  >
                    <option value="Kho Tổng Trung Tâm (TP.HCM)">Kho Tổng (TP.HCM)</option>
                    <option value="Kho Lạnh Dược Phẩm (Bình Dương)">Kho Lạnh (Bình Dương)</option>
                    <option value="Kho Vận Trung Chuyển (Hà Nội)">Kho Trung Chuyển (Hà Nội)</option>
                    <option value="Kho Cảng Biển (Hải Phòng)">Kho Cảng (Hải Phòng)</option>
                    <option value="Kho Vệ Tinh (Cần Thơ)">Kho Vệ Tinh (Cần Thơ)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Lý Do Điều Chỉnh / Báo Cáo KCS *</label>
                <textarea
                  value={newForm.reason}
                  onChange={e => setNewForm(prev => ({ ...prev, reason: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg text-xs"
                  placeholder="Ghi rõ lý do hư hao, chênh lệch kiểm kê hoặc chờ kiểm định..."
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Ghi Chú Bổ Sung (Tùy chọn)</label>
                <input
                  type="text"
                  value={newForm.notes}
                  onChange={e => setNewForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg text-xs"
                  placeholder="Số biên bản, số container hoặc kế hoạch xử lý..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)} 
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-xs"
                >
                  Tạo Đề Xuất
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ConfirmDialog Component */}
      <ConfirmDialog state={confirmDialog} onClose={() => setConfirmDialog(null)} />
    </>
  );
};
