import React, { useState, useEffect, useMemo } from 'react';
import { SelectedEntityContext, ConfirmDialogState } from '../../../../types';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { useWorkspaceSessionTab } from '../../../../hooks/useWorkspaceSessionTab';
import { usePagination } from '../../../../hooks/usePagination';
import { TablePagination } from '../../../../components/common/TablePagination';
import { PaginationControl } from '../../../../components/common/PaginationControl';
import { StatusBadge } from '../../../../components/common/StatusBadge';
import { MoneyCell } from '../../../../components/common/MoneyCell';
import { QtyCell } from '../../../../components/common/QtyCell';
import { BulkActionBar } from '../../../../components/common/BulkActionBar';
import { L3ContentState } from '../../../../components/common/L3ContentState';
import { DeepLinkBanner } from '../../../../components/common/DeepLinkBanner';
import {
  RotateCcw,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
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
  ArrowRight,
  Lock,
  FileCheck,
  Truck,
  Wrench,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { RmaRecord } from "./types";
import { INITIAL_RMA_SEED } from "./mockData";
import { WarrantyStatusBadge, FraudRiskBadge, WorkflowProgressBadge, DmsSealBadge } from "./M15Badges";

export const M15ReturnsRMAWorkspace: React.FC<M15ReturnsRMAWorkspaceProps> = ({
  onSelectEntity,
  onNotify,
  guidedTask,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useWorkspaceSessionTab<'requests' | 'inspection' | 'disposition' | 'traceability'>('M15', 'requests');

  // RMA State - Live synced with backend /api/returns
  const [rmaList, setRmaList] = useState<RmaRecord[]>(INITIAL_RMA_SEED);
  const [selectedRma, setSelectedRma] = useState<RmaRecord | null>(null);
  const [vaultedDocs, setVaultedDocs] = useState<any[]>([]);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [resolutionFilter, setResolutionFilter] = useState('ALL');
  const [inspectionFilter, setInspectionFilter] = useState<'ALL' | 'PENDING' | 'INSPECTED'>('ALL');

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

  // Sync RMAs from live Backend Router (/api/returns)
  const fetchRMAs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/returns');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const formatted: RmaRecord[] = data.map((d: any) => ({
            id: d.id || d.rmaNumber || d.rmaCode,
            dbId: d.dbId,
            rmaNumber: d.rmaNumber || d.id,
            customerName: d.customerName || d.orderCode || 'Khách hàng Doanh nghiệp',
            customerId: d.customerId,
            originalSo: d.originalSo || d.orderCode || 'SO-2026-0001',
            orderCode: d.orderCode || d.originalSo,
            orderId: d.orderId,
            deliveryCode: d.deliveryCode || `DEL-${d.rmaNumber || d.id}`,
            productCode: d.productCode || d.returnItems?.[0]?.productCode || d.items?.[0]?.productCode || 'SKU-GEN',
            productName: d.productName || d.returnItems?.[0]?.productName || d.items?.[0]?.productName || 'Vật tư kỹ thuật',
            quantity: d.quantity || d.returnItems?.reduce((sum: number, it: any) => sum + (it.quantity ?? 0), 0) || 1,
            uom: d.uom || 'Cái',
            lotSerial: d.lotSerial || 'LOT-MIXED',
            warehouseId: d.warehouseId,
            reason: d.reason || 'Yêu cầu đổi trả bảo hành',
            requestedResolution: d.requestedResolution || (d.refundMethod === 'CREDIT_NOTE' ? 'CREDIT (Cấn trừ công nợ / Hoàn tiền)' : 'REPLACE (Đổi mới sản phẩm)'),
            status: d.status || 'REQUESTED',
            inspectionResult: d.inspectionResult || 'PENDING',
            disposition: d.disposition || 'PENDING',
            financialStatus: d.financialStatus || 'PENDING',
            refundMethod: d.refundMethod || 'CREDIT_NOTE',
            warrantyStatus: d.warrantyStatus || 'VALID',
            returnWindowDays: d.returnWindowDays || 30,
            fraudScore: d.fraudScore ?? 0,
            fraudFlags: d.fraudFlags || null,
            rtvReferenceCode: d.rtvReferenceCode || null,
            maintenanceWoCode: d.maintenanceWoCode || null,
            refundChannel: d.refundChannel || 'CREDIT_NOTE_M31',
            isImmutable: d.isImmutable ?? ['COMPLETED', 'RESTOCKED', 'REFUNDED', 'CLOSED'].includes(d.status),
            isLocked: d.isLocked ?? ['COMPLETED', 'RESTOCKED', 'REFUNDED', 'CLOSED'].includes(d.status),
            totalAmount: d.totalAmount || 0,
            refundedAmount: d.refundedAmount || 0,
            creditNoteNumber: d.creditNoteNumber || null,
            inspectionNotes: d.inspectionNotes || null,
            inspectedBy: d.inspectedBy || null,
            inspectedAt: d.inspectedAt || null,
            approvedBy: d.approvedBy || null,
            approvedAt: d.approvedAt || null,
            completedAt: d.completedAt || null,
            rejectedAt: d.rejectedAt || null,
            rejectionReason: d.rejectionReason || null,
            vaultDocumentCode: d.vaultDocumentCode || null,
            items: d.items || d.returnItems || [],
            date: d.date || d.requestDate || (d.createdAt ? d.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10)),
            _raw: d
          }));
          setRmaList(formatted);
        } else if (Array.isArray(data) && data.length === 0) {
          setRmaList(INITIAL_RMA_SEED);
        }
      }
    } catch (err) {
      console.error("Lỗi đồng bộ hồ sơ RMA từ /api/returns:", err);
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

    const idempotencyKey = `IDEMP-RMA-CREATE-${newSo.trim()}-${Date.now()}`;
    try {
      setLoading(true);
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderCode: newSo.trim(),
          customerName: newCustomer.trim(),
          productName: newProduct.trim() || 'Vật tư kỹ thuật công nghiệp',
          quantity: Math.max(1, Number(newQty) || 1),
          reason: newReason.trim() || 'Sản phẩm lỗi kỹ thuật',
          requestedResolution: newResolution,
          refundMethod: newResolution.includes('CREDIT') ? 'CREDIT_NOTE' : 'CREDIT_NOTE',
          idempotencyKey
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi tạo RMA');
      
      onNotify(
        'success',
        'Tạo Yêu cầu Trả hàng (RMA) thành công',
        `Đã ghi nhận mã [${data.rmaNumber || data.rmaCode || 'Mới'}]. Hồ sơ đã niêm phong sang M29 DMS Vault.`
      );
      await fetchRMAs();
      setNewSo('');
      setNewCustomer('');
      setNewProduct('');
      setNewQty('1');
    } catch (err: any) {
      onNotify('danger', 'Lỗi khởi tạo RMA', err.message || 'Không thể tạo hồ sơ RMA.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRma = (rmaId: string) => {
    const rma = rmaList.find(r => r.id === rmaId);
    if (!rma) return;

    const isHighFraud = (rma.fraudScore ?? 0) >= 50 || String(rma.fraudFlags || '').includes('HIGH_RISK_FRAUD');
    const dialogVariant = isHighFraud ? 'warning' : 'primary';

    setConfirmDialog({
      isOpen: true,
      variant: dialogVariant,
      title: isHighFraud
        ? `[Cảnh Báo Gian Lận] Phê duyệt Đặc Cách RMA ${rmaId}`
        : `Phê duyệt Yêu cầu RMA ${rmaId}`,
      message: isHighFraud
        ? `CẢNH BÁO ĐỘNG CƠ FRAUD SHIELD: Hồ sơ ${rmaId} có điểm rủi ro gian lận cao (${rma.fraudScore ?? 75}/100) do vượt tần suất hoàn trả hoặc nghi vấn số Serial. Hành động phê duyệt này yêu cầu thẩm quyền Giám đốc (Director Override / returns:fraud_override). Bạn có chắc chắn muốn phê duyệt đặc cách?`
        : `Bạn có chắc chắn muốn phê duyệt yêu cầu ${rmaId} của khách hàng "${rma.customerName}" để tiếp nhận hàng về kho và kích hoạt Cổng Giám định QC (M39)?`,
      confirmText: isHighFraud ? 'Phê Duyệt Đặc Cách (GĐ)' : 'Phê Duyệt Tiếp Nhận',
      cancelText: 'Hủy Bỏ',
      onConfirm: async () => {
        try {
          setLoading(true);
          const res = await fetch(`/api/returns/${encodeURIComponent(rmaId)}/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fraudOverride: isHighFraud,
              idempotencyKey: `IDEMP-RMA-APPROVE-${rmaId}-${Date.now()}`
            })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Lỗi phê duyệt RMA');
          onNotify('success', 'Phê duyệt RMA thành công', `Hồ sơ ${rmaId} đã được chấp thuận. Trạng thái chuyển sang chờ QC kiểm định.`);
          await fetchRMAs();
        } catch (err: any) {
          onNotify('danger', 'Lỗi phê duyệt', err.message || 'Không thể phê duyệt hồ sơ RMA.');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleRejectRma = (rmaId: string) => {
    const rma = rmaList.find(r => r.id === rmaId);
    if (!rma) return;
    setConfirmDialog({
      isOpen: true,
      variant: 'danger',
      title: `Từ chối Tiếp nhận Yêu cầu RMA ${rmaId}`,
      message: `Bạn có chắc chắn muốn từ chối yêu cầu đổi trả ${rmaId} của khách hàng "${rma.customerName}"? Hành động này sẽ khóa hồ sơ RMA và ghi nhật ký kiểm toán M02.`,
      confirmText: 'Xác Nhận Từ Chối',
      cancelText: 'Quay Lại',
      onConfirm: async () => {
        try {
          setLoading(true);
          const res = await fetch(`/api/returns/${encodeURIComponent(rmaId)}/reject`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              rejectionReason: 'Hàng không đáp ứng tiêu chuẩn tiếp nhận hoặc quá thời hạn bảo hành cho phép',
              idempotencyKey: `IDEMP-RMA-REJECT-${rmaId}-${Date.now()}`
            })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Lỗi từ chối RMA');
          onNotify('warning', 'Từ chối RMA thành công', `Hồ sơ ${rmaId} đã bị từ chối tiếp nhận.`);
          await fetchRMAs();
        } catch (err: any) {
          onNotify('danger', 'Lỗi từ chối', err.message || 'Không thể từ chối hồ sơ RMA.');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleCompleteInspection = (rmaId: string, result: 'GOOD' | 'DEFECTIVE' | 'DAMAGED' | 'REJECTED') => {
    const rma = rmaList.find(r => r.id === rmaId);
    if (!rma) return;

    if (rma.status === 'CLOSED' || rma.status === 'CANCELLED' || rma.isImmutable) {
      setConfirmDialog({
        isOpen: true,
        variant: 'danger',
        title: 'Phiếu đã đóng',
        message: `Phiếu RMA [${rmaId}] hiện đang ở trạng thái [${rma.status}]. Phiếu đã đóng hoặc đã hủy, không thể thực hiện xác nhận hoặc thay đổi kết quả kiểm định. Mọi điều chỉnh phải tạo chứng từ Reversal/Adjustment mới theo quy chuẩn kế toán.`,
        confirmText: 'Đã Hiểu',
        cancelText: 'Đóng',
        onConfirm: () => {}
      });
      return;
    }

    const resultLabel = result === 'GOOD' ? 'ĐẠT TIÊU CHUẨN (GOOD)' : result === 'DEFECTIVE' ? 'LỖI KỸ THUẬT (DEFECTIVE)' : result === 'DAMAGED' ? 'HỎNG HÓC VẬT LÝ (DAMAGED)' : 'TỪ CHỐI QC (REJECTED)';
    const dialogVariant = result === 'GOOD' ? 'primary' : result === 'DEFECTIVE' ? 'warning' : 'danger';

    setConfirmDialog({
      isOpen: true,
      variant: dialogVariant,
      title: `Xác nhận Giám định QC: ${resultLabel}`,
      message: `Bạn có chắc chắn muốn ghi nhận kết quả "${result}" cho RMA ${rmaId} (${rma.productName})? Biên bản kiểm nghiệm kỹ thuật sẽ tự động được niêm phong điện tử sang Kho Chứng Từ Số M29 DMS Vault.`,
      confirmText: 'Xác Nhận Kết Quả QC',
      cancelText: 'Hủy Bỏ',
      onConfirm: async () => {
        try {
          setLoading(true);
          const res = await fetch(`/api/returns/${encodeURIComponent(rmaId)}/inspect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              inspectionResult: result,
              inspectionNotes: `Đã hoàn tất giám định QC: Phân loại ${result}. ${result === 'GOOD' ? 'Hàng nguyên tem niêm phong, ngoại quan tốt, đủ điều kiện tái nhập kho.' : result === 'DEFECTIVE' ? 'Lỗi chức năng kỹ thuật, đề xuất sửa chữa hoặc đổi mới.' : 'Hàng biến dạng hoặc hư hỏng nặng do ngoại lực.'}`,
              idempotencyKey: `IDEMP-RMA-INSPECT-${rmaId}-${Date.now()}`
            })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Lỗi kiểm định');
          onNotify(
            'success',
            'Giám định Kỹ thuật Hoàn tất (M39 QC)',
            `Đã lưu kết quả [${result}] cho RMA ${rmaId}. Biên bản kiểm định đã niêm phong sang M29 DMS Vault.`
          );
          await fetchRMAs();
        } catch (err: any) {
          onNotify('danger', 'Lỗi kiểm định QC', err.message || 'Không thể hoàn tất kiểm định.');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleReinspectRma = (rmaId: string, result: 'GOOD' | 'DEFECTIVE' | 'DAMAGED') => {
    const rma = rmaList.find(r => r.id === rmaId);
    if (!rma) return;

    if (rma.status === 'CLOSED' || rma.status === 'CANCELLED' || rma.isImmutable) {
      setConfirmDialog({
        isOpen: true,
        variant: 'danger',
        title: 'Phiếu đã đóng',
        message: `Phiếu RMA [${rmaId}] hiện đang ở trạng thái [${rma.status}]. Phiếu đã đóng hoặc đã hủy, không thể thực hiện giám định lại.`,
        confirmText: 'Đã Hiểu',
        cancelText: 'Đóng',
        onConfirm: () => {}
      });
      return;
    }

    setConfirmDialog({
      isOpen: true,
      variant: 'warning',
      title: `[Quyền Giám Sát QC] Đánh Giá & Phân Loại Lại: RMA ${rmaId}`,
      message: `Hồ sơ ${rmaId} hiện đã có kết quả phân loại (${rma.inspectionResult}). Thao tác giám định lại yêu cầu quyền Trưởng phòng QC (Supervisor Override). Bạn có chắc chắn muốn ghi đè kết quả thành "${result}"? Hệ thống sẽ cập nhật lại biên bản kiểm định và ghi nhận audit log.`,
      confirmText: 'Xác Nhận Giám Định Lại',
      cancelText: 'Hủy Bỏ',
      onConfirm: async () => {
        try {
          setLoading(true);
          const res = await fetch(`/api/returns/${encodeURIComponent(rmaId)}/inspect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              inspectionResult: result,
              forceReinspect: true,
              inspectionNotes: `[TÁI GIÁM ĐỊNH QC] Cập nhật lại kết quả phân loại: ${result}. ${result === 'GOOD' ? 'Kiểm tra bổ sung xác nhận đạt chuẩn tái nhập kho.' : result === 'DEFECTIVE' ? 'Xác nhận lại lỗi kỹ thuật linh kiện.' : 'Xác nhận lại hỏng hóc vật lý.'}`,
              idempotencyKey: `IDEMP-RMA-REINSPECT-${rmaId}-${Date.now()}`
            })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Lỗi tái kiểm định');
          onNotify(
            'success',
            'Tái Giám Định QC Thành Công',
            `Đã cập nhật lại kết quả [${result}] cho RMA ${rmaId}.`
          );
          await fetchRMAs();
        } catch (err: any) {
          onNotify('danger', 'Lỗi tái kiểm định', err.message || 'Không thể thực hiện tái kiểm định.');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleNavigateToDisposition = (rma: RmaRecord) => {
    setSelectedRma(rma);
    setActiveTab('disposition');
    onNotify('info', 'Chuyển Tuyến Xử Lý RMA', `Đã chuyển sang Tab Quyết Định Xử Lý (Disposition) cho hồ sơ [${rma.id}].`);
  };

  const handleApplyDisposition = (rmaId: string, disposition: string) => {
    const rma = rmaList.find(r => r.id === rmaId);
    if (!rma) return;

    const isHighFraud = (rma.fraudScore ?? 0) >= 50 || String(rma.fraudFlags || '').includes('HIGH_RISK_FRAUD');

    const dispMap: Record<string, { label: string; desc: string }> = {
      RESTOCK: { label: 'RESTOCK (Nhập kho bán lại - M17)', desc: 'Kích hoạt InventoryService.postTransaction() hoàn nhập tồn kho, cập nhật giá vốn CostingEngine và phát hành Credit Note tài chính.' },
      RETURN_TO_VENDOR: { label: 'RETURN_TO_VENDOR (Trả nhà cung cấp - RTV M08/M11)', desc: 'Chuyển thông tin sang bộ phận M16 Mua hàng để làm thủ tục đổi trả NCC, xuất kho hoàn trả và đối trừ công nợ AP.' },
      REPAIR: { label: 'REPAIR (Lệnh sửa chữa bảo dưỡng - M27 EAM)', desc: 'Khởi tạo Lệnh bảo dưỡng Corrective Repair tại M27, chuyển giao thiết bị đến Bộ phận Kỹ thuật Dịch vụ để sửa chữa cho khách hàng.' },
      REPLACE: { label: 'REPLACE (Xuất kho đổi mới - M17)', desc: 'Cấp phép xuất thiết bị thay thế mới tương đương từ kho thành phẩm cho khách hàng.' },
      SCRAP: { label: 'SCRAP (Hủy hàng phế liệu)', desc: 'Lập biên bản tiêu hủy/rã linh kiện hỏng, ghi nhận chi phí hao hụt tài sản vào tài khoản chi phí doanh nghiệp.' },
      CREDIT: { label: 'CREDIT (Phát hành Credit Note / Hoàn tiền)', desc: 'Phát hành Credit Note giảm trừ công nợ AR tại M31, hạch toán Sổ cái GL (Nợ 5212 / Có 131) và niêm phong sang M29 DMS Vault.' }
    };

    const dispInfo = dispMap[disposition] || { label: disposition, desc: 'Thực thi quyết định xử lý hàng đổi trả theo quy trình.' };

    let dialogVariant: 'primary' | 'warning' | 'danger' = 'primary';
    if (disposition === 'SCRAP') {
      dialogVariant = 'danger';
    } else if (disposition === 'RETURN_TO_VENDOR' || isHighFraud) {
      dialogVariant = 'warning';
    }

    setConfirmDialog({
      isOpen: true,
      variant: dialogVariant,
      title: isHighFraud
        ? `[Cảnh Báo Gian Lận & Quyết Định] ${dispInfo.label}`
        : `Thực thi Hướng Xử Lý: ${dispInfo.label}`,
      message: `${isHighFraud ? `CẢNH BÁO FRAUD SHIELD (${rma.fraudScore ?? 75}/100): Yêu cầu Giám đốc phê duyệt đặc cách để thực thi. ` : ''}Bạn có chắc chắn muốn phê duyệt phương án "${disposition}" cho RMA ${rmaId}? ${dispInfo.desc}`,
      confirmText: isHighFraud ? 'Đặc Cách Thực Thi (GĐ)' : 'Thực Thi Ngay (Single-Writer)',
      cancelText: 'Hủy Bỏ',
      onConfirm: async () => {
        try {
          setLoading(true);
          const res = await fetch(`/api/returns/${encodeURIComponent(rmaId)}/disposition`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              disposition,
              fraudOverride: isHighFraud,
              refundMethod: 'CREDIT_NOTE',
              idempotencyKey: `IDEMP-RMA-DISP-${rmaId}-${Date.now()}`
            })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Lỗi thực thi');
          onNotify(
            'success',
            'Thực thi Hướng xử lý Thành Công',
            `Đã thực thi [${disposition}] cho RMA ${rmaId}. Tồn kho đã cập nhật qua InventoryService, Credit Note ${data.creditNoteNumber || ''} đã phát hành và lưu trữ vào M29 DMS Vault.`
          );
          await fetchRMAs();
        } catch (err: any) {
          onNotify('danger', 'Lỗi thực thi Disposition', err.message || 'Không thể thực thi phương án xử lý.');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleCreateReversal = (rmaId: string) => {
    const rma = rmaList.find(r => r.id === rmaId);
    if (!rma) return;

    setConfirmDialog({
      isOpen: true,
      variant: 'warning',
      title: `Tạo Chứng Từ Điều Chỉnh / Hủy Đảo (Reversal) cho ${rmaId}`,
      message: `Chứng từ RMA [${rmaId}] đã đạt trạng thái bất biến và bị khóa hoàn toàn (Rule #01 & Rule #16). Hệ thống sẽ tạo một chứng từ Reversal/Adjustment mới (RMA-REV-2026-XXXX) liên kết đối ứng với chứng từ gốc, giữ nguyên vẹn dữ liệu kiểm toán M02. Bạn có muốn tiếp tục?`,
      confirmText: 'Tạo Chứng Từ Reversal Mới',
      cancelText: 'Hủy Bỏ',
      onConfirm: async () => {
        try {
          setLoading(true);
          const res = await fetch(`/api/returns/${encodeURIComponent(rmaId)}/reversal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              reversalReason: 'Yêu cầu điều chỉnh số lượng và hạch toán hoàn trả từ chứng từ bất biến',
              adjustmentType: 'REVERSAL',
              idempotencyKey: `IDEMP-REV-${rmaId}-${Date.now()}`
            })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Lỗi tạo chứng từ Reversal');
          onNotify(
            'success',
            'Khởi tạo Reversal RMA thành công',
            `Đã tạo chứng từ điều chỉnh [${data.rmaNumber || ''}] liên kết với [${rmaId}]. Hồ sơ đã lưu trữ vào M29 DMS Vault.`
          );
          await fetchRMAs();
          if (selectedRma) setSelectedRma(null);
        } catch (err: any) {
          onNotify('danger', 'Lỗi tạo Reversal', err.message || 'Không thể tạo chứng từ Reversal.');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleSelectRma = async (item: RmaRecord) => {
    setSelectedRma(item);
    setVaultedDocs([]);
    try {
      const res = await fetch(`/api/returns/${encodeURIComponent(item.id)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setSelectedRma(prev => prev ? { ...prev, ...json.data } : json.data);
        }
        if (json.vaultedDocuments && Array.isArray(json.vaultedDocuments)) {
          setVaultedDocs(json.vaultedDocuments);
        }
      }
    } catch (err) {
      console.error("Lỗi đồng bộ chi tiết hồ sơ RMA:", err);
    }

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
        { account: '5212 - Hàng bán bị trả lại', debit: item.totalAmount || 15000000, credit: 0, description: `Giảm trừ doanh thu hàng trả ${item.id}` },
        { account: '131 - Phải thu của khách hàng', debit: 0, credit: item.totalAmount || 15000000, description: `Cấn trừ công nợ khách hàng ${item.customerName}` }
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
  const pendingInspectCount = useMemo(() => rmaList.filter(r => r.inspectionResult === 'PENDING').length, [rmaList]);
  const inspectedCount = useMemo(() => rmaList.filter(r => r.inspectionResult !== 'PENDING').length, [rmaList]);

  const filteredInspectionList = useMemo(() => {
    return rmaList.filter(item => {
      if (inspectionFilter === 'PENDING') return item.inspectionResult === 'PENDING';
      if (inspectionFilter === 'INSPECTED') return item.inspectionResult !== 'PENDING';
      return true;
    });
  }, [rmaList, inspectionFilter]);

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
                        <tr className="border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase bg-slate-100/90 dark:bg-slate-800 tracking-wider">
                          <th className="py-3 px-3">Mã RMA & Ngày</th>
                          <th className="py-3 px-3">Khách hàng / SO gốc</th>
                          <th className="py-3 px-3">Sản phẩm & Số lượng</th>
                          <th className="py-3 px-3">Bảo hành & Gian lận</th>
                          <th className="py-3 px-3">Tiến độ Luồng Xử Lý</th>
                          <th className="py-3 px-3 text-center">Trạng thái</th>
                          <th className="py-3 px-3 text-right">Thao tác</th>
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
                              className={`transition-colors duration-150 ease-in-out hover:bg-slate-100/90 dark:hover:bg-slate-700/60 ${
                                isCompleted
                                  ? 'border-l-4 border-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/20'
                                  : isApproved
                                  ? 'border-l-4 border-blue-600 bg-blue-50/20 dark:bg-blue-950/20'
                                  : isUnderReview
                                  ? 'border-l-4 border-purple-600 bg-purple-50/20 dark:bg-purple-950/20'
                                  : 'border-l-4 border-amber-600 bg-amber-50/20 dark:bg-amber-950/20'
                              }`}
                            >
                              <td className="py-3 px-3">
                                <span className="font-mono text-xs font-bold text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/80 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800 inline-block tabular-nums">
                                  {item.id}
                                </span>
                                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1 tabular-nums">{item.date}</div>
                              </td>
                              <td className="py-3 px-3">
                                <div className="font-bold text-slate-900 dark:text-slate-100">{item.customerName}</div>
                                <div className="font-mono text-[11px] text-blue-700 dark:text-blue-300 mt-0.5 tabular-nums">
                                  SO: <span className="font-semibold">{item.originalSo}</span> <span className="text-slate-500">({item.deliveryCode})</span>
                                </div>
                              </td>
                              <td className="py-3 px-3">
                                <div className="font-semibold text-slate-900 dark:text-slate-100">{item.productName}</div>
                                <div className="font-mono text-[11px] text-slate-700 dark:text-slate-300 mt-0.5 tabular-nums">
                                  SL: <span className="font-bold text-slate-900 dark:text-white tabular-nums">{item.quantity}</span> {item.uom} • Lot/Serial: <span className="font-semibold">{item.lotSerial}</span>
                                </div>
                              </td>
                              <td className="py-3 px-3">
                                <div className="flex flex-col gap-1.5 items-start">
                                  <WarrantyStatusBadge status={item.warrantyStatus} />
                                  <FraudRiskBadge score={item.fraudScore ?? 0} flags={item.fraudFlags} />
                                </div>
                              </td>
                              <td className="py-3 px-3">
                                <div className="flex flex-col gap-1 items-start">
                                  <WorkflowProgressBadge
                                    disposition={item.disposition}
                                    maintenanceWoCode={item.maintenanceWoCode}
                                    rtvReferenceCode={item.rtvReferenceCode}
                                    creditNoteNumber={item.creditNoteNumber}
                                  />
                                  <div className="text-[10px] text-slate-600 dark:text-slate-400 line-clamp-1 italic">
                                    {item.reason}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                                      isCompleted
                                        ? 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-700'
                                        : isApproved
                                        ? 'bg-blue-100 text-blue-950 border-blue-300 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-700'
                                        : isUnderReview
                                        ? 'bg-purple-100 text-purple-950 border-purple-300 dark:bg-purple-950 dark:text-purple-200 dark:border-purple-700'
                                        : 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-700'
                                    }`}
                                  >
                                    {item.status}
                                  </span>
                                  {item.isImmutable && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600">
                                      <Lock className="w-2.5 h-2.5 text-slate-600 dark:text-slate-400" />
                                      Bất biến
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {item.status === 'REQUESTED' && !item.isImmutable && (
                                    <>
                                      <button
                                        onClick={() => handleApproveRma(item.id)}
                                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                                        title="Phê duyệt tiếp nhận hàng trả về kho kiểm định"
                                      >
                                        <Check className="w-3 h-3" />
                                        <span>Duyệt</span>
                                      </button>
                                      <button
                                        onClick={() => handleRejectRma(item.id)}
                                        className="px-2 py-1 text-rose-800 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/40 rounded-lg text-[10px] font-bold transition-all border border-rose-300 dark:border-rose-800 cursor-pointer flex items-center gap-1"
                                        title="Từ chối yêu cầu đổi trả"
                                      >
                                        <X className="w-3 h-3" />
                                        <span>Từ chối</span>
                                      </button>
                                    </>
                                  )}

                                  {item.status === 'APPROVED' && item.inspectionResult === 'PENDING' && !item.isImmutable && (
                                    <button
                                      onClick={() => {
                                        setActiveTab('inspection');
                                        onNotify('info', 'Chuyển sang Cổng QC', `Vui lòng thực hiện phân loại giám định cho ${item.id}.`);
                                      }}
                                      className="px-2 py-1 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/80 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                                      title="Chuyển sang Giám định QC (M39)"
                                    >
                                      <PackageCheck className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                                      <span>Giám định QC</span>
                                    </button>
                                  )}

                                  {(item.status === 'UNDER_REVIEW' || (item.inspectionResult !== 'PENDING' && item.disposition === 'PENDING')) && !item.isImmutable && (
                                    <button
                                      onClick={() => {
                                        setActiveTab('disposition');
                                        onNotify('info', 'Chuyển sang Quyết định Xử lý', `Vui lòng chọn hướng xử lý (Restock/RTV/Credit) cho ${item.id}.`);
                                      }}
                                      className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-800 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-700 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                                      title="Chuyển sang Quyết định Xử lý (Disposition)"
                                    >
                                      <Boxes className="w-3 h-3 text-indigo-700 dark:text-indigo-400" />
                                      <span>Xử lý Kho</span>
                                    </button>
                                  )}

                                  {item.isImmutable && (
                                    <button
                                      onClick={() => handleCreateReversal(item.id)}
                                      className="px-2 py-1 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/80 text-purple-800 dark:text-purple-200 border border-purple-300 dark:border-purple-800 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                                      title="Tạo chứng từ điều chỉnh / hủy đảo mới (Reversal) do chứng từ đã bất biến"
                                    >
                                      <RotateCcw className="w-3 h-3 text-purple-700 dark:text-purple-400" />
                                      <span>Reversal</span>
                                    </button>
                                  )}

                                  <button
                                    onClick={() => handleSelectRma(item)}
                                    className="px-2.5 py-1 text-[11px] font-semibold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 text-rose-800 dark:text-rose-200 rounded-lg transition-colors border border-rose-300 dark:border-rose-800 cursor-pointer shadow-2xs flex items-center gap-1"
                                  >
                                    <Eye className="w-3 h-3 text-rose-700 dark:text-rose-400" />
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

            {/* L3: Segmented Sub-filter Bar cho Tab 2 */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setInspectionFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    inspectionFilter === 'ALL'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs border border-slate-200 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>Tất Cả Phiếu</span>
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {rmaList.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setInspectionFilter('PENDING')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    inspectionFilter === 'PENDING'
                      ? 'bg-amber-500 text-white shadow-2xs'
                      : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>⏳ Chờ Giám Định QC</span>
                  <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    inspectionFilter === 'PENDING' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
                  }`}>
                    {pendingInspectCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setInspectionFilter('INSPECTED')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    inspectionFilter === 'INSPECTED'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>🛡️ Đã Xác Nhận Phân Loại</span>
                  <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    inspectionFilter === 'INSPECTED' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
                  }`}>
                    {inspectedCount}
                  </span>
                </button>
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                Hiển thị: <span className="font-bold text-slate-800 dark:text-slate-200">{filteredInspectionList.length}</span> hồ sơ
              </div>
            </div>

            {filteredInspectionList.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
                <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {inspectionFilter === 'PENDING'
                    ? 'Hiện không có phiếu RMA nào đang chờ giám định QC.'
                    : 'Chưa có phiếu RMA nào đã hoàn tất phân loại kiểm định.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {filteredInspectionList.map((item) => {
                  const isClosedOrCancelled = item.status === 'CLOSED' || item.status === 'CANCELLED' || Boolean(item.isImmutable);
                  const isPending = item.inspectionResult === 'PENDING';
                  const isGood = item.inspectionResult === 'GOOD';
                  const isDefective = item.inspectionResult === 'DEFECTIVE';
                  const isDamaged = item.inspectionResult === 'DAMAGED' || item.inspectionResult === 'REJECTED' || item.inspectionResult === 'SCRAP';

                  if (isPending) {
                    return (
                      <div
                        key={item.id}
                        className={`p-4 rounded-xl ${
                          isClosedOrCancelled
                            ? 'bg-slate-50 dark:bg-slate-900/40 border-2 border-slate-300 dark:border-slate-700 opacity-80'
                            : 'bg-amber-50/20 dark:bg-amber-950/10 border-2 border-amber-300 dark:border-amber-700/70'
                        } space-y-3 relative overflow-hidden transition-all hover:shadow-md flex flex-col justify-between`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/80 px-2 py-0.5 rounded border border-rose-300 dark:border-rose-800 tabular-nums">
                              {item.id}
                            </span>
                            {isClosedOrCancelled ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200 border border-rose-300 dark:border-rose-700 flex items-center gap-1">
                                <Lock className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                                {item.status === 'CANCELLED' ? 'Phiếu Đã Hủy' : 'Phiếu Đã Đóng'}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                Chờ Phân Loại QC
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">{item.date}</span>
                        </div>

                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">{item.productName}</h4>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{item.customerName}</p>
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            <WarrantyStatusBadge status={item.warrantyStatus} />
                            <FraudRiskBadge score={item.fraudScore ?? 0} flags={item.fraudFlags} />
                          </div>
                        </div>

                        {isClosedOrCancelled && (
                          <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-[11px] text-rose-700 dark:text-rose-300 flex items-center gap-1.5 font-medium">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
                            <span>Phiếu đã đóng ({item.status}) — Thao tác kiểm định bị vô hiệu hóa</span>
                          </div>
                        )}

                        <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                          <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">Đơn hàng gốc:</span>
                            <span className="font-mono font-bold text-blue-700 dark:text-blue-300 tabular-nums">{item.originalSo}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">Số lượng & Lot:</span>
                            <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">{item.quantity} {item.uom} • {item.lotSerial}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">Lý do hoàn trả:</span>
                            <span className="text-slate-800 dark:text-slate-200 text-right truncate max-w-[170px]" title={item.reason}>{item.reason}</span>
                          </div>
                          <div className="flex justify-between items-center pt-1 border-t border-slate-100 dark:border-slate-700">
                            <span className="text-slate-600 dark:text-slate-400">Trạng thái QC:</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold border bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-700">
                              CHƯA KIỂM ĐỊNH
                            </span>
                          </div>
                        </div>

                        <div className="pt-2.5 border-t border-amber-200 dark:border-amber-800/60 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                              <Sliders className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                              Thao tác phân loại QC:
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                              {isClosedOrCancelled ? 'Đã vô hiệu hóa' : 'Chọn 1 kết quả'}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5">
                            <button
                              onClick={() => handleCompleteInspection(item.id, 'GOOD')}
                              disabled={loading || isClosedOrCancelled}
                              className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all shadow-2xs text-center flex items-center justify-center gap-1 ${
                                isClosedOrCancelled
                                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                              }`}
                              title={isClosedOrCancelled ? 'Phiếu đã đóng hoặc đã hủy - Không thể phân loại QC' : 'Sản phẩm nguyên vẹn, đạt tiêu chuẩn nhập kho bán lại'}
                            >
                              <CheckCircle2 className="w-3 h-3 shrink-0" />
                              <span>GOOD</span>
                            </button>
                            <button
                              onClick={() => handleCompleteInspection(item.id, 'DEFECTIVE')}
                              disabled={loading || isClosedOrCancelled}
                              className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all shadow-2xs text-center flex items-center justify-center gap-1 ${
                                isClosedOrCancelled
                                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700'
                                  : 'bg-amber-600 hover:bg-amber-500 text-white cursor-pointer'
                              }`}
                              title={isClosedOrCancelled ? 'Phiếu đã đóng hoặc đã hủy - Không thể phân loại QC' : 'Lỗi kỹ thuật, linh khiếm khuyết - Đề xuất đổi mới/sửa chữa'}
                            >
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              <span>DEFECTIVE</span>
                            </button>
                            <button
                              onClick={() => handleCompleteInspection(item.id, 'DAMAGED')}
                              disabled={loading || isClosedOrCancelled}
                              className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all shadow-2xs text-center flex items-center justify-center gap-1 ${
                                isClosedOrCancelled
                                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700'
                                  : 'bg-rose-600 hover:bg-rose-500 text-white cursor-pointer'
                              }`}
                              title={isClosedOrCancelled ? 'Phiếu đã đóng hoặc đã hủy - Không thể phân loại QC' : 'Hư hỏng nặng, móp méo, vỡ - Đề xuất hủy phế liệu'}
                            >
                              <X className="w-3 h-3 shrink-0" />
                              <span>DAMAGED</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // ĐÃ XÁC NHẬN PHÂN LOẠI (QC CERTIFIED & LOCKED)
                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl ${
                        isClosedOrCancelled
                          ? 'bg-slate-50 dark:bg-slate-900/40 border-2 border-slate-300 dark:border-slate-700 opacity-85'
                          : isGood
                          ? 'bg-emerald-50/30 dark:bg-emerald-950/15 border-2 border-emerald-300/80 dark:border-emerald-700/80'
                          : isDefective
                          ? 'bg-amber-50/20 dark:bg-amber-950/10 border-2 border-amber-300/80 dark:border-amber-700/80'
                          : 'bg-slate-50 dark:bg-slate-900/60 border-2 border-slate-300 dark:border-slate-700'
                      } space-y-3 relative overflow-hidden transition-all hover:shadow-md flex flex-col justify-between`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/80 px-2 py-0.5 rounded border border-rose-300 dark:border-rose-800 tabular-nums">
                            {item.id}
                          </span>
                          {isClosedOrCancelled ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700 flex items-center gap-1">
                              <Lock className="w-3 h-3 text-slate-500" />
                              {item.status === 'CANCELLED' ? 'Phiếu Đã Hủy' : 'Phiếu Đã Đóng'}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              Đã Phân Loại QC
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">{item.date}</span>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{item.productName}</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{item.customerName}</p>
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          <WarrantyStatusBadge status={item.warrantyStatus} />
                          <FraudRiskBadge score={item.fraudScore ?? 0} flags={item.fraudFlags} />
                        </div>
                      </div>

                      {/* Hộp Thông Tin Chứng Nhận QC */}
                      <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600 dark:text-slate-400 font-medium">Kết quả Giám định:</span>
                          <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold border flex items-center gap-1 ${
                            isGood ? 'bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-700' :
                            isDefective ? 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-700' :
                            'bg-rose-50 text-rose-900 border-rose-300 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-700'
                          }`}>
                            {isGood && <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
                            {isDefective && <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />}
                            {isDamaged && <X className="w-3 h-3 text-rose-600 dark:text-rose-400" />}
                            {item.inspectionResult}
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500 dark:text-slate-400">Đơn hàng SO:</span>
                          <span className="font-mono font-bold text-blue-700 dark:text-blue-300 tabular-nums">{item.originalSo}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500 dark:text-slate-400">Số lượng & Lot:</span>
                          <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 tabular-nums">{item.quantity} {item.uom} • {item.lotSerial}</span>
                        </div>
                        <div className="pt-1.5 border-t border-slate-100 dark:border-slate-700 text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <FileCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            Niêm phong M29 DMS Vault
                          </span>
                          <span className="font-mono text-indigo-700 dark:text-indigo-300 font-semibold">
                            {item.disposition === 'PENDING' ? 'Sẵn sàng ra quyết định' : item.disposition}
                          </span>
                        </div>
                      </div>

                      {/* Khóa nút phân loại và cung cấp CTA chuyển tiếp */}
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
                        <div className="bg-slate-100 dark:bg-slate-800/90 rounded-lg p-2 flex items-center justify-between text-[11px]">
                          <span className="text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5 text-slate-500" />
                            {isClosedOrCancelled ? 'Phiếu đã đóng / kết thúc' : 'Đã khóa phân loại'}
                          </span>
                          <button
                            onClick={() => handleReinspectRma(item.id, isGood ? 'DEFECTIVE' : 'GOOD')}
                            disabled={loading || isClosedOrCancelled}
                            className={`text-[10px] font-semibold flex items-center gap-0.5 ${
                              isClosedOrCancelled
                                ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed'
                                : 'text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer'
                            }`}
                            title={isClosedOrCancelled ? 'Phiếu đã đóng - không thể đánh giá lại' : 'Yêu cầu quyền Giám sát QC để đánh giá lại kết quả'}
                          >
                            <RotateCcw className="w-2.5 h-2.5" />
                            Đánh giá lại
                          </button>
                        </div>

                        <button
                          onClick={() => handleNavigateToDisposition(item)}
                          className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-all shadow-2xs flex items-center justify-center gap-1.5 group"
                        >
                          <span>Chuyển sang Quyết định xử lý (Disposition)</span>
                          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase bg-slate-100/90 dark:bg-slate-800 tracking-wider">
                    <th className="py-3 px-3">Mã RMA</th>
                    <th className="py-3 px-3">Sản phẩm & Khách hàng</th>
                    <th className="py-3 px-3 text-center">Kết quả QC (M39)</th>
                    <th className="py-3 px-3">Hướng Xử Lý Hiện Tại</th>
                    <th className="py-3 px-3 text-center">Tài chính (M31/M32)</th>
                    <th className="py-3 px-3 text-right">Thực thi Xử lý (Disposition)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
                  {rmaList.map((item) => (
                    <tr
                      key={item.id}
                      className="transition-colors duration-150 ease-in-out hover:bg-slate-100/90 dark:hover:bg-slate-700/60 border-l-4 border-rose-600 bg-rose-50/20 dark:bg-rose-950/20"
                    >
                      <td className="py-3 px-3 font-mono font-bold text-rose-800 dark:text-rose-300 tabular-nums">
                        {item.id}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{item.productName}</div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">{item.customerName}</div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`font-mono font-bold px-2 py-0.5 rounded text-[10px] border ${
                          item.inspectionResult === 'GOOD'
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-700'
                            : item.inspectionResult === 'DEFECTIVE'
                            ? 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-700'
                            : item.inspectionResult === 'DAMAGED' || item.inspectionResult === 'REJECTED'
                            ? 'bg-rose-50 text-rose-900 border-rose-300 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-700'
                            : 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-700 dark:text-slate-300'
                        }`}>
                          {item.inspectionResult}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <WorkflowProgressBadge
                          disposition={item.disposition}
                          maintenanceWoCode={item.maintenanceWoCode}
                          rtvReferenceCode={item.rtvReferenceCode}
                          creditNoteNumber={item.creditNoteNumber}
                        />
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-200 border border-blue-300 dark:border-blue-700 tabular-nums">
                          {item.financialStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.isImmutable ? (
                            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-300 dark:border-slate-600">
                              <Lock className="w-3.5 h-3.5 text-slate-500" />
                              <span>Đã khóa bất biến</span>
                            </div>
                          ) : (
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleApplyDisposition(item.id, e.target.value);
                                }
                              }}
                              defaultValue=""
                              className="px-2.5 py-1.5 text-xs border rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold focus:outline-hidden focus:ring-2 focus:ring-rose-500 shadow-2xs cursor-pointer"
                            >
                              <option value="" disabled>-- Chọn Hướng Xử Lý --</option>
                              <option value="RESTOCK">RESTOCK (Nhập kho bán lại - M17)</option>
                              <option value="REPAIR">REPAIR (Lệnh sửa chữa bảo dưỡng - M27)</option>
                              <option value="REPLACE">REPLACE (Xuất kho đổi mới - M17)</option>
                              <option value="SCRAP">SCRAP (Hủy hàng phế liệu - M17)</option>
                              <option value="RETURN_TO_VENDOR">RETURN_TO_VENDOR (Trả nhà cung cấp - M08/M11)</option>
                              <option value="CREDIT">CREDIT (Phát hành Credit Note AR / Quỹ M32)</option>
                            </select>
                          )}
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
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Khách hàng:</span>
                  <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{selectedRma.customerName}</div>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Đơn hàng Gốc (SO):</span>
                  <div className="font-mono font-bold text-blue-700 dark:text-blue-300 text-sm mt-0.5 tabular-nums">{selectedRma.originalSo}</div>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Phiếu xuất kho:</span>
                  <div className="font-mono text-slate-800 dark:text-slate-200 mt-0.5 tabular-nums">{selectedRma.deliveryCode}</div>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Ngày yêu cầu:</span>
                  <div className="font-mono text-slate-800 dark:text-slate-200 mt-0.5 tabular-nums">{selectedRma.date}</div>
                </div>
              </div>

              {/* Product & Quantity */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-700 pb-1">
                  Sản phẩm & Thông tin Lô / Serial
                </h4>
                <div className="grid grid-cols-3 gap-3 bg-rose-50/60 dark:bg-rose-950/40 p-3.5 rounded-xl border border-rose-200 dark:border-rose-900">
                  <div>
                    <span className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold">Sản phẩm:</span>
                    <div className="font-bold text-slate-900 dark:text-rose-100 mt-0.5">{selectedRma.productName}</div>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold">Số lượng trả:</span>
                    <div className="font-mono font-bold text-rose-900 dark:text-rose-200 mt-0.5 tabular-nums">{selectedRma.quantity} {selectedRma.uom}</div>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold">Lot / Serial:</span>
                    <div className="font-mono font-bold text-rose-900 dark:text-rose-200 mt-0.5 tabular-nums">{selectedRma.lotSerial}</div>
                  </div>
                </div>
              </div>

              {/* Reason & Badges */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-700 pb-1">
                  Lý do & Tình Trạng Tiếp Nhận
                </h4>
                <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <div>
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">Lý do khách trả:</span>
                    <p className="text-slate-900 dark:text-slate-100 mt-0.5">{selectedRma.reason}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <WarrantyStatusBadge status={selectedRma.warrantyStatus} />
                    <FraudRiskBadge score={selectedRma.fraudScore ?? 0} flags={selectedRma.fraudFlags} />
                    <WorkflowProgressBadge
                      disposition={selectedRma.disposition}
                      maintenanceWoCode={selectedRma.maintenanceWoCode}
                      rtvReferenceCode={selectedRma.rtvReferenceCode}
                      creditNoteNumber={selectedRma.creditNoteNumber}
                    />
                    <DmsSealBadge vaultDocumentCode={selectedRma.vaultDocumentCode} />
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

              {/* Enterprise Invariant & Domain Integration Metadata (Phase 01 & 02) */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Ranh giới Thẩm quyền &amp; Giám sát Tính Toàn vẹn (Domain Lineage)</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-500 block">Bảo hành (M23)</span>
                    <span className={`font-mono font-bold text-xs ${
                      selectedRma.warrantyStatus === 'VALID' ? 'text-emerald-600' :
                      selectedRma.warrantyStatus === 'EXPIRED' ? 'text-amber-600' : 'text-rose-600'
                    }`}>
                      {selectedRma.warrantyStatus || 'VALID'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-500 block">Kênh hoàn tiền</span>
                    <span className="font-mono font-bold text-xs text-blue-600">
                      {selectedRma.refundChannel || (selectedRma.refundMethod === 'CASH' ? 'CASH_M32' : 'CREDIT_NOTE_M31')}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-500 block">Điểm rủi ro gian lận</span>
                    <span className={`font-mono font-bold text-xs ${
                      (selectedRma.fraudScore ?? 0) >= 50 ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'
                    }`}>
                      {selectedRma.fraudScore ?? 0}/100
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-500 block">Tính bất biến (Rule #01)</span>
                    <span className={`font-mono font-bold text-xs ${
                      selectedRma.isImmutable ? 'text-purple-600' : 'text-emerald-600'
                    }`}>
                      {selectedRma.isImmutable ? 'LOCKED (READ-ONLY)' : 'MUTABLE'}
                    </span>
                  </div>
                </div>

                {(selectedRma.maintenanceWoCode || selectedRma.rtvReferenceCode) && (
                  <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-[11px] flex items-center justify-between">
                    {selectedRma.maintenanceWoCode && (
                      <div>
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Lệnh bảo dưỡng M27: </span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{selectedRma.maintenanceWoCode}</span>
                      </div>
                    )}
                    {selectedRma.rtvReferenceCode && (
                      <div>
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Chứng từ RTV M08/M11: </span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{selectedRma.rtvReferenceCode}</span>
                      </div>
                    )}
                  </div>
                )}

                {selectedRma.isImmutable && (
                  <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 text-xs flex items-start gap-2">
                    <Lock className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Chứng từ Đạt Trạng Thái Bất Biến (Immutable Invariant):</span>
                      <p className="text-[11px] text-purple-700 dark:text-purple-300 mt-0.5">
                        Hồ sơ RMA đã hoàn tất hoặc hạch toán xong, đã khóa ghi và không thể sửa đổi trực tiếp theo chuẩn Rule #01 &amp; Rule #16. Mọi nhu cầu hiệu chỉnh cần phát hành chứng từ Reversal/Adjustment đối ứng.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* M29 DMS Vaulted Documents & Single-Writer Integration */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Chứng từ Số Lưu Trữ (M29 DMS Vault Archive)</span>
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold">
                    DMS Verified
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3 text-rose-500" />
                        <span>Hồ sơ RMA gốc</span>
                      </span>
                      <Lock className="w-2.5 h-2.5 text-slate-400" />
                    </div>
                    <div className="font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px] truncate">
                      {selectedRma.vaultDocumentCode || `VAULT-RMA-${selectedRma.id}`}
                    </div>
                    <div className="text-[9px] text-emerald-600 dark:text-emerald-400">Niêm phong số hợp lệ</div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <PackageCheck className="w-3 h-3 text-blue-500" />
                        <span>Biên bản QC M39</span>
                      </span>
                      <Lock className="w-2.5 h-2.5 text-slate-400" />
                    </div>
                    <div className="font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px] truncate">
                      {selectedRma.inspectionResult !== 'PENDING' ? `QC-REPORT-${selectedRma.id}` : 'Chờ hoàn tất QC'}
                    </div>
                    <div className="text-[9px] text-slate-500 dark:text-slate-400">
                      {selectedRma.inspectionResult !== 'PENDING' ? 'Đã ký duyệt kỹ thuật' : 'Chưa giám định'}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-purple-500" />
                        <span>Credit Note (AR)</span>
                      </span>
                      <Lock className="w-2.5 h-2.5 text-slate-400" />
                    </div>
                    <div className="font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px] truncate">
                      {selectedRma.creditNoteNumber || (selectedRma.disposition !== 'PENDING' ? `CN-${selectedRma.id}` : 'Chờ thực thi')}
                    </div>
                    <div className="text-[9px] text-slate-500 dark:text-slate-400">
                      {selectedRma.disposition !== 'PENDING' ? 'Hạch toán GL 5212/131' : 'Chưa phát hành'}
                    </div>
                  </div>
                </div>

                {vaultedDocs.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Tài liệu đã số hóa:</span>
                    <div className="space-y-1">
                      {vaultedDocs.map((vd, idx) => (
                        <div key={idx} className="flex items-center justify-between p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-[10px]">
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{vd.documentCode || vd.code}</span>
                          <span className="text-slate-500">{vd.name}</span>
                          <span className="font-mono text-emerald-600">{vd.status || 'ARCHIVED'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                {selectedRma.isImmutable && (
                  <button
                    onClick={() => handleCreateReversal(selectedRma.id)}
                    className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    title="Tạo chứng từ điều chỉnh / hủy đảo mới (Reversal) do chứng từ đã bất biến"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Tạo Chứng Từ Reversal / Hủy Đảo</span>
                  </button>
                )}
              </div>
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
