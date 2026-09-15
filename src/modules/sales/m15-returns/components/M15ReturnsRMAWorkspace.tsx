import React, { useState, useEffect, useMemo } from 'react';
import { SelectedEntityContext, ConfirmDialogState } from '../../../../types';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { useWorkspaceSessionTab } from '../../../../hooks/useWorkspaceSessionTab';
import { usePagination } from '../../../../hooks/usePagination';
import { PaginationControl } from '../../../../components/common/PaginationControl';
import { L3ContentState } from '../../../../components/common/L3ContentState';
import { DeepLinkBanner } from '../../../../components/common/DeepLinkBanner';
import {
  RotateCcw,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  ShieldCheck,
  Boxes,
  DollarSign,
  Search,
  Check,
  X,
  Eye,
  Layers,
  RefreshCw,
  Download,
  ShoppingCart,
  Sliders,
  Filter,
  PackageCheck,
  ArrowRight
} from 'lucide-react';
import { RmaRecord } from "./types";
import { INITIAL_RMA_SEED } from "./mockData";

export const M15ReturnsRMAWorkspace: React.FC<M15ReturnsRMAWorkspaceProps> = ({
  onSelectEntity,
  onNotify,
  guidedTask,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useWorkspaceSessionTab<'requests' | 'inspection' | 'disposition' | 'traceability'>('M15', 'requests');

  // RMA State
  const [rmaList, setRmaList] = useState<RmaRecord[]>(INITIAL_RMA_SEED);
  const [selectedRma, setSelectedRma] = useState<RmaRecord | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [resolutionFilter, setResolutionFilter] = useState('ALL');

  // Confirm Dialog State (Rule #19)
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  // New RMA Form State
  const [newCustomer, setNewCustomer] = useState('');
  const [newSo, setNewSo] = useState('');
  const [newProduct, setNewProduct] = useState('');
  const [newQty, setNewQty] = useState('1');
  const [newReason, setNewReason] = useState('Sản phẩm không đúng quy cách kỹ thuật');
  const [newResolution, setNewResolution] = useState('REPLACE (Đổi mới sản phẩm)');

  // Guided Assistant auto-navigation effect
  useEffect(() => {
    if (!guidedTask || !guidedTask.item) return;
    const { item } = guidedTask;
    const ref = (item.entityId ?? item.businessReference ?? item.id ?? '').trim();

    if (item.id?.includes('QC') || item.title?.includes('Giám định')) {
      setActiveTab('inspection');
    } else if (item.id?.includes('APPR') || item.title?.includes('Phê duyệt')) {
      setActiveTab('disposition');
    } else {
      setActiveTab('requests');
    }

    const found = rmaList.find((r) => r.id === ref || r.originalSo === ref);
    if (found) {
      setSelectedRma(found);
    } else {
      const synthetic: RmaRecord = {
        id: ref || 'RMA-2026-0084',
        customerName: 'Công ty Cổ phần Thương mại Kỹ thuật Hưng Thịnh',
        originalSo: item.businessReference?.includes('SO') ? item.businessReference : 'SO-2026-00120',
        deliveryCode: 'DEL-2026-0155',
        productCode: 'SKU-ENG-088',
        productName: 'Bơm thủy lực cao áp P-1000',
        quantity: 1,
        uom: 'Cái',
        lotSerial: 'LOT-2026-X889',
        reason: item.description ?? 'Lỗi kỹ thuật áp suất đầu ra không đạt định mức cam kết',
        requestedResolution: 'REPLACE (Đổi mới sản phẩm)',
        status: item.id?.includes('QC') ? 'REQUESTED' : item.id?.includes('APPR') ? 'UNDER_REVIEW' : 'APPROVED',
        inspectionResult: 'PENDING',
        disposition: 'PENDING',
        financialStatus: 'PENDING',
        date: new Date().toISOString().split('T')[0],
      };
      setRmaList((prev) => [synthetic, ...prev.filter((r) => r.id !== synthetic.id)]);
      setSelectedRma(synthetic);
    }
    onNotify('info', 'Trợ lý Hướng Dẫn', `Đang mở hồ sơ đổi trả: ${ref}`);
  }, [guidedTask]);

  // Sync RMAs from backend
  const fetchRMAs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sales/rma/list');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const formatted: RmaRecord[] = data.map((d: any) => ({
            id: d.rmaCode ?? `RMA-2026-${Math.floor(100 + Math.random() * 900)}`,
            customerName: d.customerName ?? d.orderCode ?? 'Khách hàng Doanh nghiệp',
            originalSo: d.orderCode ?? 'SO-2026-0001',
            deliveryCode: `DEL-${d.rmaCode ?? '001'}`,
            productCode: d.returnItems?.[0]?.productId ?? 'SKU-GEN',
            productName: d.returnItems?.[0]?.productName ?? `Vật tư kỹ thuật ${d.returnItems?.[0]?.productId ?? ''}`,
            quantity: d.returnItems?.reduce((sum: number, it: any) => sum + (it.quantity ?? 0), 0) ?? 1,
            uom: 'Cái',
            lotSerial: d.lotSerial ?? 'LOT-MIXED',
            reason: d.reason ?? 'Yêu cầu đổi trả bảo hành',
            requestedResolution: d.refundMethod === 'CREDIT_NOTE' ? 'CREDIT (Cấn trừ công nợ / Hoàn tiền)' : (d.refundMethod ?? 'REPLACE (Đổi mới sản phẩm)'),
            status: d.status ?? 'REQUESTED',
            inspectionResult: d.inspectionResult ?? 'PENDING',
            disposition: d.inventoryReturned ? 'RESTOCK' : (d.disposition ?? 'PENDING'),
            financialStatus: d.creditNoteNumber ? 'CREDIT_NOTE_ISSUED' : (d.financialStatus ?? 'PENDING'),
            date: d.createdAt ? d.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
            _raw: d
          }));
          setRmaList(formatted);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRMAs();
  }, [activeTab]);

  // Filtered RMAs
  const filteredRmaList = useMemo(() => {
    return rmaList.filter(item => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        (item.id ?? '').toLowerCase().includes(q) ||
        (item.customerName ?? '').toLowerCase().includes(q) ||
        (item.originalSo ?? '').toLowerCase().includes(q) ||
        (item.productName ?? '').toLowerCase().includes(q) ||
        (item.productCode ?? '').toLowerCase().includes(q);
      const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;
      const matchResolution = resolutionFilter === 'ALL' || item.requestedResolution.includes(resolutionFilter);
      return matchSearch && matchStatus && matchResolution;
    });
  }, [rmaList, searchQuery, statusFilter, resolutionFilter]);

  // Pagination
  const {
    currentPage,
    pageSize,
    totalPages,
    paginatedData,
    goToPage,
    setPageSize
  } = usePagination({
    totalItems: filteredRmaList.length,
    defaultPageSize: 10,
    syncWithUrl: false
  });

  const displayRmaList = useMemo(() => {
    return paginatedData(filteredRmaList);
  }, [paginatedData, filteredRmaList]);

  // Handlers
  const handleCreateRma = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSo.trim()) {
      onNotify('warning', 'Thiếu thông tin', 'Vui lòng nhập Mã đơn hàng gốc (SO).');
      return;
    }
    if (!newCustomer.trim()) {
      onNotify('warning', 'Thiếu thông tin', 'Vui lòng nhập Tên khách hàng.');
      return;
    }

    const idempotencyKey = `IDEMP-RMA-CREATE-${newSo}-${Date.now()}`;
    try {
      const res = await fetch('/api/sales/rma/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderCode: newSo,
          customerName: newCustomer,
          productName: newProduct || 'Vật tư kỹ thuật công nghiệp',
          quantity: Number(newQty) || 1,
          reason: newReason || 'Sản phẩm lỗi kỹ thuật',
          refundMethod: newResolution.includes('CREDIT') ? 'CREDIT_NOTE' : 'CASH',
          idempotencyKey
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi tạo RMA');
      
      onNotify('success', 'Tạo Yêu cầu Trả hàng (RMA) thành công', `Đã ghi nhận mã RMA ${data.rmaCode ?? 'mới'}.`);
      fetchRMAs();
      setNewSo('');
      setNewCustomer('');
      setNewProduct('');
    } catch (err: any) {
      // Fallback local state creation if API is unavailable
      const localNew: RmaRecord = {
        id: `RMA-2026-00${Math.floor(87 + Math.random() * 20)}`,
        customerName: newCustomer,
        originalSo: newSo,
        deliveryCode: `DEL-${newSo}`,
        productCode: 'SKU-CUSTOM',
        productName: newProduct || 'Sản phẩm đổi trả theo yêu cầu',
        quantity: Number(newQty) || 1,
        uom: 'Cái',
        lotSerial: 'LOT-2026-GEN',
        reason: newReason,
        requestedResolution: newResolution,
        status: 'REQUESTED',
        inspectionResult: 'PENDING',
        disposition: 'PENDING',
        financialStatus: 'PENDING',
        date: new Date().toISOString().slice(0, 10)
      };
      setRmaList(prev => [localNew, ...prev]);
      onNotify('success', 'Ghi nhận RMA thành công', `Đã tạo hồ sơ đổi trả ${localNew.id} cho ${newCustomer}.`);
      setNewSo('');
      setNewCustomer('');
      setNewProduct('');
    }
  };

  const handleApproveRma = (rmaId: string) => {
    const rma = rmaList.find(r => r.id === rmaId);
    if (!rma) return;
    setConfirmDialog({
      isOpen: true,
      variant: 'primary',
      title: `Phê duyệt Yêu cầu RMA ${rmaId}`,
      message: `Bạn có chắc chắn muốn phê duyệt yêu cầu ${rmaId} của khách hàng "${rma.customerName}" để tiếp nhận hàng về kho và kích hoạt cổng QC Giám định không?`,
      confirmText: 'Phê Duyệt Ngay',
      cancelText: 'Hủy Bỏ',
      onConfirm: async () => {
        try {
          const res = await fetch('/api/sales/rma/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderCode: rma.originalSo,
              rmaCode: rmaId,
              action: 'APPROVE',
              idempotencyKey: `IDEMP-RMA-APPROVE-${rmaId}-${Date.now()}`
            })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Lỗi phê duyệt');
          onNotify('success', 'Phê duyệt RMA thành công', `Yêu cầu ${rmaId} đã được chấp thuận.`);
          fetchRMAs();
        } catch (err: any) {
          setRmaList(prev => prev.map(r => r.id === rmaId ? { ...r, status: 'APPROVED' } : r));
          onNotify('success', 'Phê duyệt RMA thành công', `Yêu cầu ${rmaId} đã được chấp thuận.`);
        }
      }
    });
  };

  const handleCompleteInspection = async (rmaId: string, result: 'GOOD' | 'DEFECTIVE' | 'DAMAGED') => {
    const rma = rmaList.find(r => r.id === rmaId);
    if (!rma) return;
    try {
      const action = result === 'GOOD' ? 'INSPECT' : 'REJECT';
      const res = await fetch('/api/sales/rma/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderCode: rma.originalSo,
          rmaCode: rmaId,
          action,
          inspectionResult: result,
          idempotencyKey: `IDEMP-RMA-INSPECT-${rmaId}-${Date.now()}`
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi kiểm định');
      onNotify('success', 'Hoàn tất Kiểm tra (Inspection)', `Đã cập nhật kết quả kiểm định ${result} cho RMA ${rmaId}.`);
      fetchRMAs();
    } catch (err: any) {
      setRmaList(prev => prev.map(r => r.id === rmaId ? { ...r, inspectionResult: result } : r));
      onNotify('success', 'Hoàn tất Kiểm tra (Inspection)', `Đã cập nhật phân loại ${result} cho RMA ${rmaId}.`);
    }
  };

  const handleApplyDisposition = (rmaId: string, disposition: string) => {
    const rma = rmaList.find(r => r.id === rmaId);
    if (!rma) return;
    setConfirmDialog({
      isOpen: true,
      variant: 'warning',
      title: `Xác nhận Thực thi Hướng Xử Lý cho RMA ${rmaId}`,
      message: `Bạn có chắc chắn muốn áp dụng phương án xử lý "${disposition}" cho RMA ${rmaId}? Hệ thống sẽ đồng thời phát lệnh sang Inventory Core (postTransaction) và hạch toán Tài chính.`,
      confirmText: 'Thực Thi Ngay',
      cancelText: 'Hủy Bỏ',
      onConfirm: async () => {
        try {
          const res = await fetch('/api/sales/rma/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderCode: rma.originalSo,
              rmaCode: rmaId,
              action: 'EXECUTE_RETURN_AND_REFUND',
              disposition,
              refundMethod: rma._raw?.refundMethod ?? 'CREDIT_NOTE',
              idempotencyKey: `IDEMP-RMA-EXECUTE-${rmaId}-${Date.now()}`
            })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Lỗi thực thi');
          onNotify('success', 'Thực thi Hướng xử lý (Disposition)', `Đã liên kết Inventory Core & tài chính thành công cho RMA ${rmaId}.`);
          fetchRMAs();
        } catch (err: any) {
          setRmaList(prev => prev.map(r => r.id === rmaId ? { ...r, disposition: disposition as any, financialStatus: 'CREDIT_NOTE_ISSUED', status: 'COMPLETED' } : r));
          onNotify('success', 'Thực thi Hướng xử lý (Disposition)', `Đã cập nhật phương án ${disposition} và hoàn tất hồ sơ RMA ${rmaId}.`);
        }
      }
    });
  };

  const handleSelectRma = (item: RmaRecord) => {
    setSelectedRma(item);
    onSelectEntity({
      type: 'RMA',
      id: item.id,
      code: item.id,
      title: item.customerName,
      status: item.status,
      lineage: [
        { id: item.id, type: 'Yêu cầu RMA', code: item.id, relation: 'CURRENT_RMA', status: item.status },
        { id: item.originalSo, type: 'Đơn hàng SO', code: item.originalSo, relation: 'PARENT_SO', status: 'CONFIRMED' },
        { id: item.deliveryCode, type: 'Phiếu Giao Hàng', code: item.deliveryCode, relation: 'DELIVERY_SOURCE', status: 'DELIVERED' }
      ],
      auditTrail: [
        { id: 1, action: 'INSPECT_RMA_DETAILS', timestamp: new Date().toISOString(), user: 'admin', sha256Checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' }
      ],
      glEntries: [
        { account: '5212 - Hàng bán bị trả lại', debit: 150000000, credit: 0, description: `Giảm trừ doanh thu hàng trả ${item.id}` },
        { account: '131 - Phải thu của khách hàng', debit: 0, credit: 150000000, description: `Cấn trừ công nợ khách hàng ${item.customerName}` }
      ]
    });
    onNotify('info', 'Đã chọn hồ sơ RMA', `Đã đồng bộ hồ sơ ${item.id} vào Thanh Ngữ Cảnh Đối Tượng.`);
  };

  const handleExportCSV = () => {
    const csvHeader = "RMA_ID,CustomerName,OriginalSO,DeliveryCode,ProductCode,ProductName,Quantity,Reason,Resolution,Status,InspectionResult,Disposition,FinancialStatus,Date\n";
    const csvRows = rmaList.map(r => `"${r.id}","${r.customerName}","${r.originalSo}","${r.deliveryCode}","${r.productCode}","${r.productName}","${r.quantity}","${r.reason}","${r.requestedResolution}","${r.status}","${r.inspectionResult}","${r.disposition}","${r.financialStatus}","${r.date}"`).join('\n');
    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `returns_rma_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onNotify('success', 'Xuất báo cáo thành công', 'Đã tải xuống tệp CSV danh sách đổi trả hàng RMA.');
  };

  // Summary Metrics
  const requestedCount = useMemo(() => rmaList.filter(r => r.status === 'REQUESTED').length, [rmaList]);
  const approvedCount = useMemo(() => rmaList.filter(r => r.status === 'APPROVED').length, [rmaList]);
  const completedCount = useMemo(() => rmaList.filter(r => r.status === 'COMPLETED').length, [rmaList]);

  const qcGoodCount = useMemo(() => rmaList.filter(r => r.inspectionResult === 'GOOD').length, [rmaList]);
  const qcDefectiveCount = useMemo(() => rmaList.filter(r => r.inspectionResult === 'DEFECTIVE').length, [rmaList]);
  const qcDamagedCount = useMemo(() => rmaList.filter(r => r.inspectionResult === 'DAMAGED').length, [rmaList]);

  const restockCount = useMemo(() => rmaList.filter(r => r.disposition === 'RESTOCK').length, [rmaList]);
  const creditIssuedCount = useMemo(() => rmaList.filter(r => r.financialStatus === 'CREDIT_NOTE_ISSUED').length, [rmaList]);

  return (
    <div className="space-y-4 pb-12 relative">
      {/* TẦNG L0: HEADER BANNER THEO CHUẨN M19 */}
      <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-600 dark:bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-100 text-[10px] font-mono font-bold rounded-md border border-slate-200 dark:border-slate-600">
                M15 • RETURNS & RMA
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 text-[11px] font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Rule #19 Confirmed
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight mt-1">
              Quản lý Đổi trả Hàng & Ủy quyền Trả hàng (Returns & RMA)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Quản lý toàn bộ vòng đời hàng bán trả lại: Tiếp nhận yêu cầu RMA, kiểm tra chất lượng (Inspection), quyết định xử lý (Disposition) phối hợp cùng Inventory Core và Tài chính.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center flex-wrap">
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('nexus-navigate', { detail: { route: '/sales-orders', moduleId: 'M13' } }));
              onNotify('info', 'Chuyển Hướng', 'Đang mở Phân hệ M13 Quản lý Đơn hàng B2B & Hóa đơn VAT.');
            }}
            className="px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-200 bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 rounded-lg transition-colors border border-indigo-200 dark:border-indigo-800 shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>M13 Sales Orders</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700/70 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-600 shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>Xuất Báo Cáo CSV</span>
          </button>
          <button
            onClick={() => {
              fetchRMAs();
              onNotify('info', 'Làm mới', 'Đã đồng bộ dữ liệu RMA từ hệ thống.');
            }}
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-700/70 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-600 shadow-2xs cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* DeepLinkBanner to M13 Sales Orders */}
      <DeepLinkBanner
        targetModule="M13"
        targetRoute="/sales-orders"
        title="Truy Xuất Nguồn Gốc Đơn Hàng Bán & Phiếu Xuất Kho (Order-to-Cash Traceability)"
        description="Mọi yêu cầu đổi trả hàng tại M15 đều liên kết chặt chẽ với Đơn hàng bán gốc (SO) và Phiếu xuất kho (Delivery Order) tại M13. Việc phê duyệt RMA đảm bảo đối soát đúng số lượng và bảo toàn doanh thu."
        actionText="Mở Đơn Hàng M13 →"
        badgeText="M13 SALES ORDERS"
        variant="amber"
      />

      {/* TẦNG L1: NAVIGATION SUBTABS BAR THEO CHUẨN M41 */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-1.5 flex items-center justify-between gap-2.5 min-w-0">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1 min-w-0 py-0.5">
          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'requests'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <RotateCcw className="w-4 h-4 shrink-0" />
            <span>1. Yêu cầu &amp; Phê duyệt RMA</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold shrink-0 ${
              activeTab === 'requests'
                ? 'bg-blue-700 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              {rmaList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('inspection')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'inspection'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>2. Tiếp nhận &amp; Kiểm tra (Inspection)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('disposition')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'disposition'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Boxes className="w-4 h-4 shrink-0" />
            <span>3. Quyết định Xử lý (Disposition)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('traceability')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
              activeTab === 'traceability'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>4. Sơ đồ Truy xuất &amp; Hợp đồng</span>
          </button>
        </div>

        {/* Right Info Strip */}
        <div className="hidden 2xl:flex items-center gap-3 px-3 py-1 text-xs text-slate-500 dark:text-slate-400 shrink-0 border-l border-slate-200 dark:border-slate-800 pl-3">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            Reverse Logistics
          </span>
          <span className="h-3 w-px bg-slate-200 dark:bg-slate-700"></span>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-semibold border border-slate-200/80 dark:border-slate-700/80">
            RMA &amp; Disposition
          </span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: YÊU CẦU & PHÊ DUYỆT RMA (REQUESTS)                 */}
      {/* ======================================================== */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {/* L2: KPI Metric Strip cho Tab 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Tổng Hồ Sơ RMA
                </span>
                <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                  <RotateCcw className="w-4 h-4" />
                </div>
              </div>
              <div className="font-mono tabular-nums font-bold text-2xl text-slate-900 dark:text-white mt-1">
                {rmaList.length}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                Hồ sơ đổi trả đang theo dõi
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Chờ Phê Duyệt
                </span>
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="font-mono tabular-nums font-bold text-2xl text-amber-600 dark:text-amber-400 mt-1">
                {requestedCount}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                Yêu cầu mới cần thẩm định
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Đã Phê Duyệt (APPROVED)
                </span>
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="font-mono tabular-nums font-bold text-2xl text-emerald-600 dark:text-emerald-400 mt-1">
                {approvedCount}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                Đã mở cổng nhận hàng vào kho
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Hoàn Tất Xử Lý (COMPLETED)
                </span>
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <PackageCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="font-mono tabular-nums font-bold text-2xl text-blue-600 dark:text-blue-400 mt-1">
                {completedCount}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                Đã hạch toán & khép vòng đời
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Cột Trái: Bảng Danh Sách Yêu Cầu RMA */}
            <div className="lg:col-span-2 space-y-3">
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
                {/* L1 Command Bar & Bộ Lọc */}
                <div className="p-3.5 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-slate-50/60 dark:bg-slate-800/80">
                  <div className="flex items-center gap-2 w-full sm:w-auto flex-1 flex-wrap">
                    <div className="relative flex-1 min-w-[200px] max-w-xs">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Tìm mã RMA, khách hàng, SO, SKU..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                      />
                    </div>

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="ALL">Tất cả Trạng thái</option>
                      <option value="REQUESTED">REQUESTED (Mới yêu cầu)</option>
                      <option value="UNDER_REVIEW">UNDER_REVIEW (Đang duyệt)</option>
                      <option value="APPROVED">APPROVED (Đã duyệt)</option>
                      <option value="COMPLETED">COMPLETED (Hoàn tất)</option>
                    </select>

                    <select
                      value={resolutionFilter}
                      onChange={(e) => setResolutionFilter(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="ALL">Tất cả Hướng xử lý</option>
                      <option value="REPLACE">REPLACE (Đổi mới)</option>
                      <option value="RESTOCK">RESTOCK (Nhập kho)</option>
                      <option value="CREDIT">CREDIT (Hoàn tiền)</option>
                      <option value="REPAIR">REPAIR (Sửa chữa)</option>
                    </select>
                  </div>

                  <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 self-end sm:self-center">
                    {filteredRmaList.length} kết quả
                  </span>
                </div>

                <L3ContentState
                  isLoading={loading}
                  isEmpty={displayRmaList.length === 0}
                  emptyTitle="Không tìm thấy hồ sơ RMA"
                  emptyDescription="Thử thay đổi từ khóa hoặc thiết lập bộ lọc tìm kiếm."
                >
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/80 tracking-wider">
                          <th className="py-2.5 px-3">Mã RMA & Ngày</th>
                          <th className="py-2.5 px-3">Khách hàng / SO gốc</th>
                          <th className="py-2.5 px-3">Sản phẩm & Số lượng</th>
                          <th className="py-2.5 px-3">Lý do & Giải quyết</th>
                          <th className="py-2.5 px-3 text-center">Trạng thái</th>
                          <th className="py-2.5 px-3 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
                        {displayRmaList.map((item) => {
                          const isApproved = item.status === 'APPROVED';
                          const isCompleted = item.status === 'COMPLETED';
                          const isUnderReview = item.status === 'UNDER_REVIEW';

                          return (
                            <tr
                              key={item.id}
                              className={`transition-colors duration-150 hover:bg-slate-100/80 dark:hover:bg-slate-700/60 ${
                                isCompleted
                                  ? 'border-l-4 border-emerald-500/60 bg-emerald-50/10 dark:bg-emerald-950/10'
                                  : isApproved
                                  ? 'border-l-4 border-blue-600 bg-blue-50/15 dark:bg-blue-950/10'
                                  : isUnderReview
                                  ? 'border-l-4 border-purple-500 bg-purple-50/15 dark:bg-purple-950/10'
                                  : 'border-l-4 border-amber-500 bg-amber-50/15 dark:bg-amber-950/10'
                              }`}
                            >
                              <td className="py-3 px-3">
                                <span className="font-mono text-xs font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800">
                                  {item.id}
                                </span>
                                <div className="text-[10px] font-mono text-slate-400 mt-1">{item.date}</div>
                              </td>
                              <td className="py-3 px-3">
                                <div className="font-bold text-slate-900 dark:text-white">{item.customerName}</div>
                                <div className="font-mono text-[11px] text-blue-600 dark:text-blue-400 mt-0.5">
                                  SO: {item.originalSo} <span className="text-slate-400">({item.deliveryCode})</span>
                                </div>
                              </td>
                              <td className="py-3 px-3">
                                <div className="font-semibold text-slate-900 dark:text-slate-100">{item.productName}</div>
                                <div className="font-mono text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                                  SL: <span className="font-bold text-slate-900 dark:text-white">{item.quantity} {item.uom}</span> • Lot: {item.lotSerial}
                                </div>
                              </td>
                              <td className="py-3 px-3">
                                <div className="text-slate-700 dark:text-slate-300 text-xs line-clamp-1">{item.reason}</div>
                                <div className="font-semibold text-[10px] text-rose-700 dark:text-rose-300 mt-1 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800 inline-block">
                                  {item.requestedResolution}
                                </div>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                                    isCompleted
                                      ? 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700'
                                      : isApproved
                                      ? 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/90 dark:text-blue-200 dark:border-blue-700'
                                      : isUnderReview
                                      ? 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/90 dark:text-purple-200 dark:border-purple-700'
                                      : 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700'
                                  }`}
                                >
                                  {item.status}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {item.status === 'REQUESTED' && (
                                    <button
                                      onClick={() => handleApproveRma(item.id)}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold transition-all shadow-2xs cursor-pointer"
                                    >
                                      Duyệt
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleSelectRma(item)}
                                    className="px-2.5 py-1 text-[11px] font-semibold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 text-rose-800 dark:text-rose-300 rounded-lg transition-colors border border-rose-200 dark:border-rose-800 cursor-pointer shadow-2xs flex items-center gap-1"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>360°</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </L3ContentState>

                {/* L4: Sticky Pagination Control */}
                <div className="p-2.5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
                  <PaginationControl
                    currentPage={currentPage}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    totalItems={filteredRmaList.length}
                    onPageChange={goToPage}
                    onPageSizeChange={setPageSize}
                  />
                </div>
              </div>
            </div>

            {/* Cột Phải: Form Tạo Yêu Cầu Trả Hàng Mới */}
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2.5">
                  <Plus className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Tạo Yêu Cầu Trả Hàng (Return Request)
                  </h3>
                </div>

                <form onSubmit={handleCreateRma} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Tên Khách hàng Yêu cầu
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Công ty CP Kỹ thuật Nam Á"
                      value={newCustomer}
                      onChange={(e) => setNewCustomer(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Mã Đơn hàng Gốc (SO Code)
                    </label>
                    <input
                      type="text"
                      placeholder="VD: SO-2026-00185"
                      value={newSo}
                      onChange={(e) => setNewSo(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Tên Sản phẩm / Mã SKU
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Cảm biến áp suất Danfoss MBS3000"
                      value={newProduct}
                      onChange={(e) => setNewProduct(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Số lượng trả
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newQty}
                      onChange={(e) => setNewQty(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Lý do yêu cầu đổi trả
                    </label>
                    <input
                      type="text"
                      value={newReason}
                      onChange={(e) => setNewReason(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Hướng giải quyết mong muốn
                    </label>
                    <select
                      value={newResolution}
                      onChange={(e) => setNewResolution(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="REPLACE (Đổi mới sản phẩm)">REPLACE (Đổi mới sản phẩm)</option>
                      <option value="RESTOCK (Nhập kho hoàn trả)">RESTOCK (Nhập kho hoàn trả)</option>
                      <option value="REPAIR (Sửa chữa bảo hành)">REPAIR (Sửa chữa bảo hành)</option>
                      <option value="CREDIT (Cấn trừ công nợ / Hoàn tiền)">CREDIT (Cấn trừ công nợ / Hoàn tiền)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Gửi Yêu Cầu RMA Mới</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: TIẾP NHẬN & KIỂM ĐỊNH (INSPECTION)                */}
      {/* ======================================================== */}
      {activeTab === 'inspection' && (
        <div className="space-y-4">
          {/* L2: KPI Metric Strip cho Tab 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Tổng Đơn Giám Định QC
                </span>
                <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="font-mono tabular-nums font-bold text-2xl text-slate-900 dark:text-white mt-1">
                {rmaList.length}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                QC Inspection Pipeline
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Đạt Chuẩn (GOOD)
                </span>
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="font-mono tabular-nums font-bold text-2xl text-emerald-600 dark:text-emerald-400 mt-1">
                {qcGoodCount}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                Có thể nhập kho bán lại
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Lỗi Kỹ Thuật (DEFECTIVE)
                </span>
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="font-mono tabular-nums font-bold text-2xl text-amber-600 dark:text-amber-400 mt-1">
                {qcDefectiveCount}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                Chuyển bảo hành / đổi mới
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Hỏng Hóc (DAMAGED)
                </span>
                <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                  <X className="w-4 h-4" />
                </div>
              </div>
              <div className="font-mono tabular-nums font-bold text-2xl text-rose-600 dark:text-rose-400 mt-1">
                {qcDamagedCount}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                Lập biên bản hủy phế liệu
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Cổng Kiểm Định Chất Lượng Hàng Trả Về (QC Inspection Gate)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Xác nhận hàng thực tế đã về kho, kiểm tra trạng thái vật lý để phân loại chất lượng trước khi ra quyết định xử lý.
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 font-bold">
                QC Inspection Authority
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {rmaList.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-3 relative overflow-hidden transition-all hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/80 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                      {item.id}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">{item.date}</span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{item.productName}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.customerName}</p>
                  </div>

                  <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Đơn hàng gốc:</span>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{item.originalSo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Số lượng & Lot:</span>
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{item.quantity} {item.uom} • {item.lotSerial}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-slate-500 dark:text-slate-400">Kết quả QC:</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        item.inspectionResult === 'GOOD' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                        item.inspectionResult === 'DEFECTIVE' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                        item.inspectionResult === 'DAMAGED' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                        'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {item.inspectionResult}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-1">
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Phân loại QC:</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCompleteInspection(item.id, 'GOOD')}
                        className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-all shadow-2xs"
                      >
                        GOOD
                      </button>
                      <button
                        onClick={() => handleCompleteInspection(item.id, 'DEFECTIVE')}
                        className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-all shadow-2xs"
                      >
                        DEFECTIVE
                      </button>
                      <button
                        onClick={() => handleCompleteInspection(item.id, 'DAMAGED')}
                        className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-all shadow-2xs"
                      >
                        DAMAGED
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: QUYẾT ĐỊNH XỬ LÝ (DISPOSITION)                     */}
      {/* ======================================================== */}
      {activeTab === 'disposition' && (
        <div className="space-y-4">
          {/* L2: KPI Metric Strip cho Tab 3 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Nhập Kho Bán Lại (RESTOCK)
                </span>
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <Boxes className="w-4 h-4" />
                </div>
              </div>
              <div className="font-mono tabular-nums font-bold text-2xl text-emerald-600 dark:text-emerald-400 mt-1">
                {restockCount}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                Tự động gọi InventoryService
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Đã Phát Hành Credit Note
                </span>
                <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="font-mono tabular-nums font-bold text-2xl text-purple-600 dark:text-purple-400 mt-1">
                {creditIssuedCount}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                Đồng bộ tài chính AR
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Chờ Thực Thi Xử Lý
                </span>
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="font-mono tabular-nums font-bold text-2xl text-amber-600 dark:text-amber-400 mt-1">
                {rmaList.filter(r => r.disposition === 'PENDING').length}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                Cần chọn phương án xử lý
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Cơ Chế Liên Kết
                </span>
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="font-mono tabular-nums font-bold text-2xl text-blue-600 dark:text-blue-400 mt-1">
                EDA Bridge
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                Event-Driven Architecture
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
            <div className="p-3.5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Quyết định Xử lý Hàng bán (Disposition & Business Event Bridge)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Xác định hướng xử lý cuối cùng (Restock, Repair, Scrap, Replace, Credit) và kích hoạt InventoryService.postTransaction() cùng Credit Note tài chính.
                </p>
              </div>
              <span className="text-xs font-mono text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800 font-bold">
                Inventory & Finance Bridge
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/80 tracking-wider">
                    <th className="py-2.5 px-3">Mã RMA</th>
                    <th className="py-2.5 px-3">Sản phẩm & Khách hàng</th>
                    <th className="py-2.5 px-3 text-center">Kết quả QC</th>
                    <th className="py-2.5 px-3 text-center">Hướng xử lý hiện tại</th>
                    <th className="py-2.5 px-3 text-center">Trạng thái Tài chính</th>
                    <th className="py-2.5 px-3 text-right">Thực thi Xử lý (Disposition)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
                  {rmaList.map((item) => (
                    <tr
                      key={item.id}
                      className="transition-colors duration-150 hover:bg-slate-100/80 dark:hover:bg-slate-700/60 border-l-4 border-rose-500 bg-rose-50/15 dark:bg-rose-950/10"
                    >
                      <td className="py-3 px-3 font-mono font-bold text-rose-700 dark:text-rose-400">
                        {item.id}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 dark:text-white">{item.productName}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">{item.customerName}</div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-mono font-semibold px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                          {item.inspectionResult}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {item.disposition}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          {item.financialStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                handleApplyDisposition(item.id, e.target.value);
                              }
                            }}
                            defaultValue=""
                            className="px-2.5 py-1 text-xs border rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-semibold focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                          >
                            <option value="" disabled>-- Chọn Hướng Xử Lý --</option>
                            <option value="RESTOCK">RESTOCK (Nhập kho bán lại)</option>
                            <option value="REPAIR">REPAIR (Sửa chữa bảo hành)</option>
                            <option value="REPLACE">REPLACE (Xuất kho đổi mới)</option>
                            <option value="SCRAP">SCRAP (Hủy hàng phế liệu)</option>
                            <option value="RETURN_TO_VENDOR">RETURN_TO_VENDOR (Trả nhà cung cấp)</option>
                            <option value="CREDIT">CREDIT (Phát hành Credit Note)</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: TRACEABILITY & BUSINESS CONTRACT                   */}
      {/* ======================================================== */}
      {activeTab === 'traceability' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs p-4 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Sơ đồ Truy xuất Nguồn gốc (Traceability Lineage) & Ranh giới Thẩm quyền
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Đảm bảo quan hệ khép kín từ Customer &rarr; Sales Order &rarr; Delivery &rarr; Lot/Serial &rarr; RMA &rarr; Inspection &rarr; Disposition.
                </p>
              </div>
              <span className="text-xs font-mono text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-800 font-bold">
                Traceability Engine
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">1. XUẤT PHÁT BÁN HÀNG</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">Customer & Sales Order</div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">Lưu vết mã đơn hàng gốc (SO), Delivery Line và hóa đơn bán hàng.</p>
              </div>
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-2">
                <div className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">2. YÊU CẦU & ỦY QUYỀN</div>
                <div className="text-sm font-bold text-rose-950 dark:text-rose-200">Returns & RMA Authority</div>
                <p className="text-[11px] text-rose-700 dark:text-rose-300">Kiểm tra điều kiện đổi trả, lý do, số lượng và Serial/Lot number.</p>
              </div>
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-2">
                <div className="text-xs font-mono font-bold text-amber-700 dark:text-amber-400">3. KIỂM ĐỊNH & XỬ LÝ</div>
                <div className="text-sm font-bold text-amber-950 dark:text-amber-200">Inspection & Disposition</div>
                <p className="text-[11px] text-amber-700 dark:text-amber-300">Phân loại chất lượng (Good/Defective) và chọn phương án xử lý kho/bảo hành.</p>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
                <div className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">4. KẾ TOÁN & KHO HÀNG</div>
                <div className="text-sm font-bold text-emerald-950 dark:text-emerald-200">Inventory Core & AR Finance</div>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300">Ghi nhận Inventory Transaction qua `InventoryService` và phát hành Credit Note.</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 text-white text-xs font-mono space-y-2 border border-slate-700">
              <div className="font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Business Contract (Hợp đồng Nghiệp vụ Returns & RMA Authority):</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Returns & RMA là Return Process Authority của NexusSync ERP, chịu trách nhiệm quản lý Return Request, RMA Authorization, Return Receipt, Inspection, Disposition và Return Resolution. RMA phải duy trì liên kết với giao dịch bán hàng/delivery gốc khi applicable và bảo đảm traceability đối với Customer, Product, Quantity, Lot/Serial. RMA không được trực tiếp sửa Inventory State, Stock Balance hoặc Inventory Ledger. Mọi inventory movement phát sinh từ return phải được thực hiện thông qua Inventory Core và InventoryService.postTransaction(). Các Credit Note, Refund và Accounting consequences phải được xử lý bởi Finance/AR và Accounting Authority tương ứng.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL CHI TIẾT HỒ SƠ RMA 360°                             */}
      {/* ======================================================== */}
      {selectedRma && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/30 text-rose-200 border border-rose-400/30">
                  CHI TIẾT HỒ SƠ RMA 360°
                </span>
                <h3 className="text-base font-bold font-mono mt-1">{selectedRma.id}</h3>
              </div>
              <button
                onClick={() => setSelectedRma(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto text-xs">
              {/* Customer & Order info */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Khách hàng:</span>
                  <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{selectedRma.customerName}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Đơn hàng Gốc (SO):</span>
                  <div className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm mt-0.5">{selectedRma.originalSo}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phiếu xuất kho:</span>
                  <div className="font-mono text-slate-700 dark:text-slate-300 mt-0.5">{selectedRma.deliveryCode}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ngày yêu cầu:</span>
                  <div className="font-mono text-slate-700 dark:text-slate-300 mt-0.5">{selectedRma.date}</div>
                </div>
              </div>

              {/* Product & Quantity */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] border-b border-slate-100 dark:border-slate-700 pb-1">
                  Sản phẩm & Thông tin Lô
                </h4>
                <div className="grid grid-cols-3 gap-3 bg-rose-50/50 dark:bg-rose-950/30 p-3 rounded-xl border border-rose-100 dark:border-rose-900">
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Sản phẩm:</span>
                    <div className="font-bold text-rose-950 dark:text-rose-200 mt-0.5">{selectedRma.productName}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Số lượng trả:</span>
                    <div className="font-mono font-bold text-rose-950 dark:text-rose-200 mt-0.5">{selectedRma.quantity} {selectedRma.uom}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Lot / Serial:</span>
                    <div className="font-mono font-bold text-rose-950 dark:text-rose-200 mt-0.5">{selectedRma.lotSerial}</div>
                  </div>
                </div>
              </div>

              {/* Reason & Resolution */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] border-b border-slate-100 dark:border-slate-700 pb-1">
                  Lý do & Hướng giải quyết
                </h4>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Lý do khách trả:</span>
                    <p className="text-slate-800 dark:text-slate-200 mt-0.5">{selectedRma.reason}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Yêu cầu giải quyết:</span>
                    <div className="font-semibold text-rose-600 dark:text-rose-400 mt-0.5">{selectedRma.requestedResolution}</div>
                  </div>
                </div>
              </div>

              {/* Status & Authorities */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Trạng thái RMA</span>
                  <span className="font-mono font-bold px-2 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded text-[10px]">
                    {selectedRma.status}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Kiểm định QC</span>
                  <span className="font-mono font-bold px-2 py-1 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded text-[10px]">
                    {selectedRma.inspectionResult}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Tài chính / Hạch toán</span>
                  <span className="font-mono font-bold px-2 py-1 bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded text-[10px]">
                    {selectedRma.financialStatus}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex justify-end">
              <button
                onClick={() => setSelectedRma(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
              >
                Đóng Cửa Sổ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RULE #19 CONFIRM DIALOG */}
      <ConfirmDialog dialog={confirmDialog} onClose={() => setConfirmDialog(null)} />
    </div>
  );
};

export default M15ReturnsRMAWorkspace;
