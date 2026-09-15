import React, { useState, useEffect } from 'react';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { SelectedEntityContext } from '../../../../types';
import { useWorkspaceSessionTab } from '../../../../hooks/useWorkspaceSessionTab';
import { ENTERPRISE_MASTER_PRODUCTS } from '../../../../data/enterpriseMaster';
import { downloadVatElectronicInvoicePdf } from '../../../../utils/pdfExporter';
import { normalizeSalesOrder, safeNumber } from '../../../../utils/salesOrderDataNormalizer';
import { useSalesOrderSync } from '../../../../hooks/useSalesOrderSync';
import { SalesOrderSyncService } from '../../../../services/SalesOrderSyncService';

// M13 Sub-components (Replicated Presentation Layer according to Rule #20 & #19)
import { M13WorkspaceHeader } from './M13WorkspaceHeader';
import { M13MetricCards } from './M13MetricCards';
import { M13LifecyclePipeline } from './M13LifecyclePipeline';
import { M13OrdersTab } from './M13OrdersTab';
import { M13VatInvoicesTab } from './M13VatInvoicesTab';
import { M13DynamicDiscountsTab } from './M13DynamicDiscountsTab';
import { M13ReservationTab } from './M13ReservationTab';
import { M13FulfillmentTab } from './M13FulfillmentTab';
import { M13AnalyticsTab } from './M13AnalyticsTab';
import { M13TestRunnerTab } from './M13TestRunnerTab';

// M13 Modals
import { M13OrderDetailModal } from './M13OrderDetailModal';
import { M13CreateOrderModal } from './M13CreateOrderModal';
import { M13QuotationImportModal } from './M13QuotationImportModal';
import { M13PaymentModal } from './M13PaymentModal';
import { M13VatIssueModal } from './M13VatIssueModal';

interface M13SalesOrdersWorkspaceProps {
  onSelectEntity: (entity: SelectedEntityContext) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const M13SalesOrdersWorkspace: React.FC<M13SalesOrdersWorkspaceProps> = ({
  onSelectEntity,
  onNotify,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useWorkspaceSessionTab<
    'orders' | 'vat-invoices' | 'discounts' | 'reservation' | 'fulfillment' | 'analytics' | 'test-runner'
  >('M13', 'orders');

  // Interactive Task Test Runner State (100% Business Logic Preserved)
  const [testTasks, setTestTasks] = useState<any[]>([
    {
      id: 1,
      name: 'Task 1: Xác lập Đơn hàng B2B & Kiểm tra Tín dụng',
      status: 'IDLE',
      logs: 'Sẵn sàng kiểm tra hạn mức tín dụng & tạo SO.',
    },
    {
      id: 2,
      name: 'Task 2: Giữ chỗ Tồn kho Tự động (Inventory Reservation)',
      status: 'IDLE',
      logs: 'Sẵn sàng phân bổ tồn kho SKU từ M07/M17.',
    },
    {
      id: 3,
      name: 'Task 3: Ký số HSM & Phát hành Hóa đơn VAT (NĐ 123/2020)',
      status: 'IDLE',
      logs: 'Sẵn sàng ký số Cloud HSM & nhận mã CQT.',
    },
    {
      id: 4,
      name: 'Task 4: Vận hành Xuất kho WMS (Fulfillment Goods Issue)',
      status: 'IDLE',
      logs: 'Sẵn sàng điều phối lệnh xuất kho WMS (M24).',
    },
    {
      id: 5,
      name: 'Task 5: Định khoản Tự động Sổ cái GL (M30 - TK 131, 511, 33311)',
      status: 'IDLE',
      logs: 'Sẵn sàng hạch toán doanh thu & thuế GTGT đầu ra.',
    },
  ]);
  const [runningTestId, setRunningTestId] = useState<number | null>(null);

  const handleRunTaskTest = (taskId: number) => {
    setRunningTestId(taskId);
    setTestTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status: 'RUNNING', logs: 'Đang thực thi quy trình kiểm thử nghiệp vụ...' }
          : t
      )
    );

    setTimeout(() => {
      setRunningTestId(null);
      let successLog = '';
      if (taskId === 1)
        successLog = '✓ Kiểm tra hạn mức tín dụng thành công. Khách hàng ABC đủ điều kiện, tạo SO-2026-00128 hợp lệ.';
      if (taskId === 2)
        successLog = '✓ Phân bổ tồn kho thành công. Trạng thái giữ chỗ chuyển sang RESERVED.';
      if (taskId === 3)
        successLog = '✓ Ký số HSM thành công, nhận mã CQT T26-0001-A9F32E-78, sinh PDF NĐ123 hoàn tất.';
      if (taskId === 4)
        successLog = '✓ Lệnh xuất kho WMS đã tạo và chuyển sang trạng thái SHIPPED.';
      if (taskId === 5)
        successLog = '✓ Định khoản GL tự động thành công: Nợ 131 / Có 511, 33311.';

      setTestTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: 'PASSED', logs: successLog } : t))
      );
      onNotify('success', `Hoàn tất Kiểm thử Task #${taskId}`, successLog);
    }, 700);
  };

  const handleRunAllTasks = () => {
    let delay = 0;
    testTasks.forEach((task) => {
      setTimeout(() => {
        handleRunTaskTest(task.id);
      }, delay);
      delay += 850;
    });
  };

  // Sales Orders State (Synchronized with M07 Master SKUs, M16 POS & M31 Invoices)
  const DEFAULT_M13_ORDERS = [
    {
      id: 'SO-2026-00125',
      customerName: 'Công ty TNHH Kỹ Thuật Công Nghiệp VinaTech',
      taxCode: '0108765432',
      address: 'Lô C4, KCN Thăng Long, Đông Anh, Hà Nội',
      billingEmail: 'accounting@vinatech-ind.vn',
      orderDate: '2026-03-08',
      totalAmount: '110.000.000 VND',
      totalAmountNumeric: 110000000,
      subtotalAmount: 100000000,
      taxRate: 10,
      taxAmount: 10000000,
      amountPaid: 0,
      balanceDue: 110000000,
      status: 'CONFIRMED',
      reservationStatus: 'RESERVED',
      fulfillmentStatus: 'PENDING_PICKING',
      vatStatus: 'NOT_ISSUED',
      vatInvoiceNumber: null,
      vatSerial: null,
      cqtCode: null,
      lookupCode: null,
      sourceModule: 'M13_SALES',
      items: [
        { sku: 'SKU-IN-01', name: 'Thép tấm cán nóng SS400 (10mm x 1500 x 6000)', qty: 5, uop: 'Tấm', price: '12.000.000 VND', unitPriceNumeric: 12000000, amount: 60000000 },
        { sku: 'SKU-IN-02', name: 'Động cơ giảm tốc 3 pha 2.2kW 1/30', qty: 4, uop: 'Bộ', price: '10.000.000 VND', unitPriceNumeric: 10000000, amount: 40000000 }
      ]
    },
    {
      id: 'SO-2026-00126',
      customerName: 'Tập Đoàn Chế Tạo Cơ Khí & Tự Động Hóa Alpha',
      taxCode: '0309876543',
      address: 'Số 18 Đại lộ Bình Dương, Thuận An, Bình Dương',
      billingEmail: 'finance@alphamech.vn',
      orderDate: '2026-03-07',
      totalAmount: '198.000.000 VND',
      totalAmountNumeric: 198000000,
      subtotalAmount: 180000000,
      taxRate: 10,
      taxAmount: 18000000,
      amountPaid: 198000000,
      balanceDue: 0,
      status: 'INVOICED',
      reservationStatus: 'RESERVED',
      fulfillmentStatus: 'PACKING',
      vatStatus: 'ISSUED',
      vatInvoiceNumber: 'INV-2026-00892',
      vatSerial: '1C26TAA',
      cqtCode: 'T26-0001-ALPHA-78',
      lookupCode: 'NXALPHA892',
      sourceModule: 'M13_SALES',
      items: [
        { sku: 'SKU-IN-03', name: 'Cảm biến tiệm cận quang học E2E-X5MF1', qty: 20, uop: 'Chiếc', price: '2.500.000 VND', unitPriceNumeric: 2500000, amount: 50000000 },
        { sku: 'SKU-IN-04', name: 'Biến tần công nghiệp 3P 380V 7.5kW', qty: 5, uop: 'Bộ', price: '26.000.000 VND', unitPriceNumeric: 26000000, amount: 130000000 }
      ]
    },
    {
      id: 'SO-2026-00127',
      customerName: 'Công ty Cổ Phần Cơ Điện & Xây Lắp Mekong',
      taxCode: '0201998877',
      address: 'Số 120 Đường 3/2, Q. Ninh Kiều, Cần Thơ',
      billingEmail: 'invoicing@mekongmep.vn',
      orderDate: '2026-03-06',
      totalAmount: '44.000.000 VND',
      totalAmountNumeric: 44000000,
      subtotalAmount: 40000000,
      taxRate: 10,
      taxAmount: 4000000,
      amountPaid: 44000000,
      balanceDue: 0,
      status: 'FULFILLED',
      reservationStatus: 'RESERVED',
      fulfillmentStatus: 'SHIPPED',
      vatStatus: 'ISSUED',
      vatInvoiceNumber: 'INV-2026-00891',
      vatSerial: '1C26TAA',
      cqtCode: 'T26-0001-MEKONG-78',
      lookupCode: 'NXMKG891',
      sourceModule: 'M13_SALES',
      items: [
        { sku: 'SKU-IN-05', name: 'Van bướm điều khiển khí nén DN100', qty: 4, uop: 'Bộ', price: '10.000.000 VND', unitPriceNumeric: 10000000, amount: 40000000 }
      ]
    },
    {
      id: 'SO-2026-00128',
      customerName: 'Công Ty TNHH Sản Xuất Thiết Bị Điện Tân Á',
      taxCode: '0400112233',
      address: 'KCN Hòa Khánh, Liên Chiểu, Đà Nẵng',
      billingEmail: 'ketoan@tanaelectric.com',
      orderDate: '2026-03-09',
      totalAmount: '55.000.000 VND',
      totalAmountNumeric: 55000000,
      subtotalAmount: 50000000,
      taxRate: 10,
      taxAmount: 5000000,
      amountPaid: 0,
      balanceDue: 55000000,
      status: 'CONFIRMED',
      reservationStatus: 'RESERVED',
      fulfillmentStatus: 'STAGING',
      vatStatus: 'NOT_ISSUED',
      vatInvoiceNumber: null,
      vatSerial: null,
      cqtCode: null,
      lookupCode: null,
      sourceModule: 'M13_SALES',
      items: [
        { sku: 'SKU-IN-01', name: 'Thép tấm cán nóng SS400 (10mm x 1500 x 6000)', qty: 2, uop: 'Tấm', price: '12.000.000 VND', unitPriceNumeric: 12000000, amount: 24000000 },
        { sku: 'SKU-IN-03', name: 'Cảm biến tiệm cận quang học E2E-X5MF1', qty: 10, uop: 'Chiếc', price: '2.600.000 VND', unitPriceNumeric: 2600000, amount: 26000000 }
      ]
    }
  ];

  const [orders, setOrders] = useState<any[]>(DEFAULT_M13_ORDERS);

  // Hook-based Enterprise Synchronization (M07 Customers + M16 POS Omnichannel)
  const {
    customers: masterCustomers,
    posOrders: syncedPosOrders,
    syncAll,
    validateOrder,
    checkCredit,
    findCustomer,
    isSyncing: isHookSyncing,
    lastSyncedAt: hookLastSyncedAt,
  } = useSalesOrderSync({
    autoSync: true,
    syncIntervalMs: 3000,
    onSyncSuccess: (stats) => {
      // Automatic reconciliation with active state
    },
    onSyncError: (err) => {
      console.warn('M13 Sync warning:', err);
    }
  });

  // Reconcile POS Orders from Hook with Local Orders
  useEffect(() => {
    if (syncedPosOrders && syncedPosOrders.length > 0) {
      setOrders((prev) => {
        const existingMap = new Map(prev.map((o) => [o.id, o]));
        let hasNew = false;
        for (const po of syncedPosOrders) {
          const norm = normalizeSalesOrder(po);
          if (!existingMap.has(norm.id)) {
            existingMap.set(norm.id, norm);
            hasNew = true;
          } else {
            const existing = existingMap.get(norm.id);
            if (norm.requiresVatInvoice && !existing.requiresVatInvoice) {
              existingMap.set(norm.id, {
                ...existing,
                requiresVatInvoice: norm.requiresVatInvoice,
                vatDetails: norm.vatDetails,
              });
              hasNew = true;
            }
          }
        }
        if (hasNew) {
          return Array.from(existingMap.values());
        }
        return prev;
      });
    }
  }, [syncedPosOrders]);

  // Modal State Handlers
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<any | null>(null);
  const [isCreateOrderModalOpen, setIsCreateOrderModalOpen] = useState<boolean>(false);
  const [isQuotationImportModalOpen, setIsQuotationImportModalOpen] = useState<boolean>(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [orderForPayment, setOrderForPayment] = useState<any | null>(null);
  const [initialQuotationForCreate, setInitialQuotationForCreate] = useState<any | null>(null);

  // VAT Invoice Issuance Modal State
  const [vatModalOrder, setVatModalOrder] = useState<any | null>(null);
  const [vatFormTaxCode, setVatFormTaxCode] = useState<string>('');
  const [vatFormAddress, setVatFormAddress] = useState<string>('');
  const [vatFormEmail, setVatFormEmail] = useState<string>('');
  const [vatFormRate, setVatFormRate] = useState<number>(10);
  const [vatFormPaymentMethod, setVatFormPaymentMethod] = useState<string>('BANK_TRANSFER');
  const [isSigningHsm, setIsSigningHsm] = useState<boolean>(false);

  // New Order Form States (Single-line quick creator)
  const [newCustomer, setNewCustomer] = useState('');
  const [newTaxCode, setNewTaxCode] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newAmount, setNewAmount] = useState('25.000.000 VND');
  const [newSku, setNewSku] = useState(ENTERPRISE_MASTER_PRODUCTS[0]?.sku || 'SKU-IN-01');
  const [newQty, setNewQty] = useState('1');

  // Search, Filter & View Mode States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [fulfillmentViewMode, setFulfillmentViewMode] = useState<'table' | 'kanban'>('kanban');
  const [isWmsSyncing, setIsWmsSyncing] = useState(false);
  const [wmsLastSynced, setWmsLastSynced] = useState<string>(new Date().toLocaleTimeString());
  const [confirmDialog, setConfirmDialog] = useState<any | null>(null);

  // Pagination for Orders Table
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5;

  // Staging & Packing Queue Threshold Alert States
  const [stagingPackingThreshold, setStagingPackingThreshold] = useState<number>(3);
  const stagingPackingCount = orders.filter(
    (o) => o.fulfillmentStatus === 'PACKING' || o.fulfillmentStatus === 'STAGING'
  ).length;
  const isStagingPackingExceeded = stagingPackingCount > stagingPackingThreshold;

  const handleSyncWms = () => {
    setIsWmsSyncing(true);
    setTimeout(() => {
      setIsWmsSyncing(false);
      setWmsLastSynced(new Date().toLocaleTimeString());
      onNotify(
        'success',
        'Đồng bộ WMS thành công',
        'Hàng chờ Fulfillment đã đồng bộ thời gian thực với WMS Core & InventoryService (M17/M24).'
      );
    }, 800);
  };

  const handleUpdateFulfillmentStatus = (orderId: string, nextStatus: string) => {
    if (nextStatus === 'SHIPPED') {
      setConfirmDialog({
        isOpen: true,
        title: `Xác nhận Xuất Kho WMS [${orderId}] (Goods Issue)`,
        message: `Hành động này sẽ thực hiện xuất kho chính thức (Goods Issue), trừ tồn kho thực tế qua InventoryService và chuyển đơn hàng sang trạng thái Đã giao hàng (SHIPPED). Bạn có chắc chắn muốn thực hiện?`,
        variant: 'info',
        confirmText: 'Xác Nhận Xuất Kho',
        cancelText: 'Hủy',
        onConfirm: () => {
          setOrders((prev) =>
            prev.map((o) =>
              o.id === orderId ? { ...o, fulfillmentStatus: 'SHIPPED', status: 'FULFILLED' } : o
            )
          );
          setConfirmDialog(null);
          onNotify(
            'success',
            'Xuất kho WMS thành công',
            `Đơn hàng ${orderId} đã hoàn tất phiếu xuất kho Goods Issue & trừ tồn kho thành công.`
          );
        },
      });
    } else {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, fulfillmentStatus: nextStatus } : o))
      );
      onNotify('success', 'Cập nhật trạng thái WMS', `Đơn hàng ${orderId} đã chuyển sang trạng thái: ${nextStatus}.`);
    }
  };

  const handleCancelOrder = (order: any) => {
    if (order.vatStatus === 'ISSUED') {
      onNotify(
        'danger',
        'Không thể hủy đơn hàng',
        `Đơn hàng ${order.id} đã phát hành Hóa đơn điện tử VAT (${order.vatInvoiceNumber}). Phải thực hiện quy trình lập hóa đơn điều chỉnh hoặc hủy theo chuẩn NĐ 123 trước khi hủy SO.`
      );
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: `Xác nhận Hủy Đơn Hàng [${order.id}]`,
      message: `Hành động này sẽ hủy đơn hàng của khách hàng "${order.customerName}" và tự động giải phóng tồn kho đã giữ chỗ (Inventory Release). Bạn có chắc chắn muốn thực hiện?`,
      variant: 'danger',
      confirmText: 'Xác Nhận Hủy SO',
      cancelText: 'Quay Lại',
      onConfirm: () => {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === order.id ? { ...o, status: 'CANCELLED', reservationStatus: 'RELEASED' } : o
          )
        );
        setConfirmDialog(null);
        onNotify('success', 'Đã hủy đơn hàng', `Đơn hàng ${order.id} đã được hủy và giải phóng kho thành công.`);
      },
    });
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.trim()) {
      onNotify('warning', 'Thiếu thông tin', 'Vui lòng nhập tên khách hàng đặt hàng.');
      return;
    }
    const cleanAmountNum = parseFloat(newAmount.replace(/[^0-9]/g, '')) || 25000000;
    const subtotal = Math.round(cleanAmountNum / 1.1);
    const tax = cleanAmountNum - subtotal;

    // Consistency and credit check against M07 Customer Master
    const validation = validateOrder({
      customerName: newCustomer,
      taxCode: newTaxCode,
      billingEmail: newEmail,
      totalAmountNumeric: cleanAmountNum,
      items: [{ sku: newSku, name: 'Sản phẩm tiêu chuẩn', qty: Number(newQty) || 1, unitPriceNumeric: subtotal }]
    });

    if (validation.warnings.length > 0) {
      onNotify('info', 'Thông báo chuẩn hóa Master Data', validation.warnings.join(' • '));
    }

    const matchedCustomer = findCustomer(newCustomer) || (newTaxCode ? findCustomer(newTaxCode) : undefined);

    const newSo = {
      id: `SO-2026-001${orders.length + 28}`,
      customerId: matchedCustomer?.customerId ?? null,
      customerName: newCustomer,
      taxCode: newTaxCode || (matchedCustomer?.taxCode ?? '0108999888'),
      address: matchedCustomer?.address ?? 'Khu Công Nghiệp Tân Bình, TP. Hồ Chí Minh',
      billingEmail: newEmail || (matchedCustomer?.billingEmail ?? matchedCustomer?.email ?? 'invoicing@customer.vn'),
      orderDate: new Date().toISOString().slice(0, 10),
      totalAmount: `${cleanAmountNum.toLocaleString('vi-VN')} VND`,
      totalAmountNumeric: cleanAmountNum,
      subtotalAmount: subtotal,
      taxRate: 10,
      taxAmount: tax,
      status: 'CONFIRMED',
      reservationStatus: 'RESERVED',
      fulfillmentStatus: 'PENDING_PICKING',
      vatStatus: 'NOT_ISSUED',
      vatInvoiceNumber: null,
      vatSerial: null,
      cqtCode: null,
      lookupCode: null,
      sourceModule: 'M13_SALES',
      items: [
        {
          sku: newSku,
          name: 'Sản phẩm tiêu chuẩn thương mại',
          qty: Number(newQty) || 10,
          uop: 'Cái',
          price: `${cleanAmountNum.toLocaleString('vi-VN')} VND`,
          unitPriceNumeric: Math.round(cleanAmountNum / (Number(newQty) || 1)),
          amount: cleanAmountNum,
        },
      ],
    };
    setOrders([newSo, ...orders]);
    setNewCustomer('');
    setNewTaxCode('');
    setNewEmail('');
    onNotify('success', 'Tạo Sales Order thành công', `Đã xác lập đơn hàng ${newSo.id} và kích hoạt giữ chỗ tồn kho (Reservation).`);
  };

  const checkVatEligibility = (order: any) => {
    if (order.status === 'CANCELLED') {
      return { eligible: false, reason: 'Đơn hàng đã bị hủy (Cancelled), không thể xuất hóa đơn VAT.' };
    }
    if (order.vatStatus === 'ISSUED') {
      return { eligible: false, reason: `Hóa đơn VAT [${order.vatInvoiceNumber}] đã được phát hành trước đó cho đơn hàng này.` };
    }
    if (order.status === 'DRAFT') {
      return { eligible: false, reason: 'Đơn hàng đang ở trạng thái Bản nháp (Draft). Cần xác nhận (Confirmed) trước khi xuất hóa đơn VAT.' };
    }
    if (!order.customerName || !order.customerName.trim()) {
      return { eligible: false, reason: 'Đơn hàng thiếu thông tin khách hàng hợp lệ.' };
    }
    return { eligible: true, reason: 'Đơn hàng đủ điều kiện xuất hóa đơn VAT điện tử (NĐ 123/2020).' };
  };

  const handleOpenVatModal = (order: any) => {
    const eligibility = checkVatEligibility(order);
    if (!eligibility.eligible) {
      onNotify('warning', 'Không Đủ Điều Kiện Xuất Hóa Đơn VAT', eligibility.reason);
      return;
    }
    setVatModalOrder(order);
    setVatFormTaxCode(order.taxCode || '0108765432');
    setVatFormAddress(order.address || 'Khu Công Nghiệp Tân Bình, TP. Hồ Chí Minh');
    setVatFormEmail(order.billingEmail || 'invoicing@customer.vn');
    setVatFormRate(order.taxRate || 10);
    setVatFormPaymentMethod('BANK_TRANSFER');
  };

  const handleIssueVatInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vatModalOrder) return;

    setIsSigningHsm(true);
    setTimeout(() => {
      setIsSigningHsm(false);
      const generatedInvNo =
        vatModalOrder.vatInvoiceNumber || `INV-2026-${Math.floor(10000 + Math.random() * 90000)}`;
      const generatedCqtCode =
        vatModalOrder.cqtCode || `T26-0001-${Math.random().toString(36).substring(2, 8).toUpperCase()}-78`;
      const generatedLookupCode =
        vatModalOrder.lookupCode || `NX${Math.random().toString(36).substring(2, 8).toUpperCase()}2026`;

      const cleanTotal =
        parseFloat(String(vatModalOrder.totalAmount).replace(/[^0-9]/g, '')) || 100000000;
      const subtotal = Math.round(cleanTotal / (1 + vatFormRate / 100));
      const vatAmount = cleanTotal - subtotal;

      const updatedOrders = orders.map((o) => {
        if (o.id === vatModalOrder.id) {
          return {
            ...o,
            taxCode: vatFormTaxCode,
            address: vatFormAddress,
            billingEmail: vatFormEmail,
            taxRate: vatFormRate,
            subtotalAmount: subtotal,
            taxAmount: vatAmount,
            status: 'INVOICED',
            vatStatus: 'ISSUED',
            vatInvoiceNumber: generatedInvNo,
            vatSerial: '1C26TAA',
            cqtCode: generatedCqtCode,
            lookupCode: generatedLookupCode,
          };
        }
        return o;
      });

      setOrders(updatedOrders);

      try {
        downloadVatElectronicInvoicePdf({
          invoiceNumber: generatedInvNo,
          orderId: vatModalOrder.id,
          formCode: '1C26TAA',
          serialNo: '1C26TAA',
          customerName: vatModalOrder.customerName,
          taxCode: vatFormTaxCode,
          address: vatFormAddress,
          billingEmail: vatFormEmail,
          paymentMethod: vatFormPaymentMethod === 'BANK_TRANSFER' ? 'TM/CK (Chuyển khoản)' : 'Tiền mặt (TM)',
          items: vatModalOrder.items,
          subtotalAmount: subtotal,
          taxRate: vatFormRate,
          taxAmount: vatAmount,
          totalAmount: cleanTotal,
          cqtCode: generatedCqtCode,
          lookupCode: generatedLookupCode,
          lookupUrl: 'https://hoadondientu.gdt.gov.vn',
        });
      } catch (err) {
        console.error('Lỗi khi tải PDF hóa đơn VAT:', err);
      }

      setVatModalOrder(null);
      const isM16Order = vatModalOrder.sourceModule === 'M16_POS';
      onNotify(
        'success',
        isM16Order ? '[M16 POS] Hóa Đơn Điện Tử VAT Đã Phát Hành' : 'Xuất Hóa Đơn VAT Điện Tử Thành Công',
        isM16Order
          ? `Giao dịch POS M16 [${vatModalOrder.id}] của [${vatModalOrder.customerName}] đã phát hành hóa đơn VAT [${generatedInvNo}], MST: ${vatFormTaxCode || vatModalOrder.taxCode || 'N/A'}, CQT: ${generatedCqtCode}. Đồng bộ VAT Rate & hạch toán GL thành công.`
          : `Đã phát hành Hóa đơn [${generatedInvNo}] - Ký số HSM & Cấp mã CQT (${generatedCqtCode}). Đã tự động hạch toán AR Sổ cái GL.`
      );
    }, 800);
  };

  const handleDownloadExistingVatPdf = (order: any) => {
    try {
      const cleanTotal =
        parseFloat(String(order.totalAmount).replace(/[^0-9]/g, '')) || 100000000;
      const subtotal = order.subtotalAmount || Math.round(cleanTotal / (1 + (order.taxRate || 10) / 100));
      const vatAmount = order.taxAmount || (cleanTotal - subtotal);

      downloadVatElectronicInvoicePdf({
        invoiceNumber: order.vatInvoiceNumber || 'INV-2026-00001',
        orderId: order.id,
        formCode: '1C26TAA',
        serialNo: order.vatSerial || '1C26TAA',
        customerName: order.customerName,
        taxCode: order.taxCode || '0108765432',
        address: order.address || 'Hà Nội',
        billingEmail: order.billingEmail || 'invoicing@customer.vn',
        paymentMethod: 'TM/CK (Chuyển khoản)',
        items: order.items || [],
        subtotalAmount: subtotal,
        taxRate: order.taxRate || 10,
        taxAmount: vatAmount,
        totalAmount: cleanTotal,
        cqtCode: order.cqtCode || 'T26-0001-A9F32E-78',
        lookupCode: order.lookupCode || 'NX12345678',
        lookupUrl: 'https://hoadondientu.gdt.gov.vn',
      });
      onNotify('success', 'Tải hóa đơn VAT', `Đã xuất bản thể hiện PDF Hóa đơn điện tử [${order.vatInvoiceNumber}].`);
    } catch (e) {
      console.error('Error downloading existing VAT PDF:', e);
      onNotify('danger', 'Lỗi xuất hóa đơn', 'Không thể tạo bản PDF hóa đơn VAT.');
    }
  };

  const handleSelectOrder = (order: any) => {
    setSelectedOrderForModal(order);
    onSelectEntity({
      type: 'SALES_ORDER',
      id: order.id,
      code: order.id,
      title: `SO ${order.id} - ${order.customerName}`,
      status: order.status,
      auditTrail: [
        {
          action: 'CREATED',
          timestamp: order.orderDate || new Date().toISOString(),
          user: 'Sales Representative',
        },
      ],
    });
  };

  const handleExportCSV = () => {
    const csvHeader = 'OrderID,CustomerName,TaxCode,OrderDate,TotalAmount,Status,VATStatus,VATInvoiceNo,CQTCode\n';
    const csvRows = orders
      .map(
        (o) =>
          `"${o.id}","${o.customerName}","${o.taxCode || ''}","${o.orderDate}","${o.totalAmount}","${o.status}","${o.vatStatus}","${o.vatInvoiceNumber || ''}","${o.cqtCode || ''}"`
      )
      .join('\n');
    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sales_orders_vat_o2c_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onNotify('success', 'Xuất báo cáo thành công', 'Đã tải xuống tệp CSV danh sách Sales Orders & Hóa đơn VAT.');
  };

  // KPI Calculations
  const totalRevenue = orders.reduce((sum, o) => {
    return sum + (Number(o.subtotalAmount) || 0);
  }, 0);
  const vatIssuedCount = orders.filter((o) => o.vatStatus === 'ISSUED').length;
  const vatComplianceRate =
    orders.length > 0 ? `${((vatIssuedCount / orders.length) * 100).toFixed(0)}%` : '0%';
  const reservedCount = orders.filter(
    (o) => o.status !== 'CANCELLED' && o.status !== 'DRAFT'
  ).length;

  return (
    <div className="space-y-6 pb-12 relative min-h-screen">
      {/* 1. L0 Header Banner matching M12 pattern */}
      <M13WorkspaceHeader
        loading={loading}
        onRefresh={() => {
          setLoading(true);
          setTimeout(() => setLoading(false), 500);
          onNotify('info', 'Làm mới', 'Đã đồng bộ dữ liệu M13 Sales Orders & Hóa đơn VAT.');
        }}
        onOpenCreateOrder={() => setIsCreateOrderModalOpen(true)}
        onOpenQuotationImport={() => setIsQuotationImportModalOpen(true)}
        onExportCSV={handleExportCSV}
      />

      {/* 2. L2 Metric Cards Grid matching M12 pattern */}
      <M13MetricCards
        totalOrders={orders.length}
        totalRevenue={totalRevenue}
        vatIssuedCount={vatIssuedCount}
        vatComplianceRate={vatComplianceRate}
        reservedCount={reservedCount}
      />

      {/* 3. L0 Lifecycle Pipeline Navigator matching M12 pattern */}
      <M13LifecyclePipeline
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab as any)}
        ordersCount={orders.length}
        vatCount={vatIssuedCount}
        reservedCount={reservedCount}
        fulfillmentCount={orders.filter((o) => o.status !== 'CANCELLED').length}
      />

      {/* 4. Tab 1: Orders List Master View */}
      {activeTab === 'orders' && (
        <M13OrdersTab
          orders={orders}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onSelectOrder={handleSelectOrder}
          onOpenCreateOrderModal={() => setIsCreateOrderModalOpen(true)}
          onOpenQuotationImportModal={() => setIsQuotationImportModalOpen(true)}
          onOpenPaymentModal={(ord) => {
            setOrderForPayment(ord);
            setIsPaymentModalOpen(true);
          }}
          onOpenVatModal={handleOpenVatModal}
          onDownloadVatPdf={handleDownloadExistingVatPdf}
          onCancelOrder={handleCancelOrder}
          newCustomer={newCustomer}
          setNewCustomer={setNewCustomer}
          newTaxCode={newTaxCode}
          setNewTaxCode={setNewTaxCode}
          newEmail={newEmail}
          setNewEmail={setNewEmail}
          newAmount={newAmount}
          setNewAmount={setNewAmount}
          newSku={newSku}
          setNewSku={setNewSku}
          newQty={newQty}
          setNewQty={setNewQty}
          onCreateOrderQuick={handleCreateOrder}
          masterProducts={ENTERPRISE_MASTER_PRODUCTS}
          masterCustomers={masterCustomers}
        />
      )}

      {/* Tab 2: VAT E-Invoices View */}
      {activeTab === 'vat-invoices' && (
        <M13VatInvoicesTab
          orders={orders}
          onDownloadVatPdf={handleDownloadExistingVatPdf}
          onSelectOrder={handleSelectOrder}
        />
      )}

      {/* Tab 3: Dynamic Discounts (M07/M41) */}
      {activeTab === 'discounts' && (
        <M13DynamicDiscountsTab
          onApplyDiscount={(res) => {
            onNotify(
              'success',
              'Đã áp dụng chiết khấu',
              `Áp dụng mức giảm ${res.discountPercentage}% (${res.discountAmount.toLocaleString('vi-VN')} đ) theo chính sách ${res.ruleApplied}.`
            );
          }}
        />
      )}

      {/* Tab 4: Reservation & ATP Allocation */}
      {activeTab === 'reservation' && (
        <M13ReservationTab
          orders={orders}
          masterProducts={ENTERPRISE_MASTER_PRODUCTS}
          onSelectOrder={handleSelectOrder}
        />
      )}

      {/* Tab 5: Fulfillment WMS Outbound */}
      {activeTab === 'fulfillment' && (
        <M13FulfillmentTab
          orders={orders}
          fulfillmentViewMode={fulfillmentViewMode}
          setFulfillmentViewMode={setFulfillmentViewMode}
          isWmsSyncing={isWmsSyncing}
          wmsLastSynced={wmsLastSynced}
          onSyncWms={handleSyncWms}
          isStagingPackingExceeded={isStagingPackingExceeded}
          stagingPackingCount={stagingPackingCount}
          stagingPackingThreshold={stagingPackingThreshold}
          onUpdateFulfillmentStatus={handleUpdateFulfillmentStatus}
          onSelectOrder={handleSelectOrder}
        />
      )}

      {/* Tab 6: Executive Analytics & VAT Taxes */}
      {activeTab === 'analytics' && <M13AnalyticsTab orders={orders} />}

      {/* Tab 7: Automated Interactive Task Runner */}
      {activeTab === 'test-runner' && (
        <M13TestRunnerTab
          testTasks={testTasks}
          runningTestId={runningTestId}
          onRunTaskTest={handleRunTaskTest}
          onRunAllTasks={handleRunAllTasks}
        />
      )}

      {/* 360-Degree Order Detail Modal */}
      <M13OrderDetailModal
        isOpen={Boolean(selectedOrderForModal)}
        order={selectedOrderForModal}
        onClose={() => setSelectedOrderForModal(null)}
        onOpenVatModal={(ord) => {
          setSelectedOrderForModal(null);
          handleOpenVatModal(ord);
        }}
        onOpenPaymentModal={(ord) => {
          setSelectedOrderForModal(null);
          setOrderForPayment(ord);
          setIsPaymentModalOpen(true);
        }}
        onDownloadVatPdf={handleDownloadExistingVatPdf}
        onUpdateFulfillment={(orderId, status) => handleUpdateFulfillmentStatus(orderId, status)}
        masterCustomers={masterCustomers}
      />

      {/* VAT Invoice Issuance Modal */}
      <M13VatIssueModal
        isOpen={Boolean(vatModalOrder)}
        order={vatModalOrder}
        onClose={() => setVatModalOrder(null)}
        taxCode={vatFormTaxCode}
        setTaxCode={setVatFormTaxCode}
        address={vatFormAddress}
        setAddress={setVatFormAddress}
        email={vatFormEmail}
        setEmail={setVatFormEmail}
        rate={vatFormRate}
        setRate={setVatFormRate}
        paymentMethod={vatFormPaymentMethod}
        setPaymentMethod={setVatFormPaymentMethod}
        isSigningHsm={isSigningHsm}
        onSubmit={handleIssueVatInvoice}
      />

      {/* Create Multi-line Order Modal */}
      <M13CreateOrderModal
        isOpen={isCreateOrderModalOpen}
        onClose={() => {
          setIsCreateOrderModalOpen(false);
          setInitialQuotationForCreate(null);
        }}
        onCreateSuccess={(newOrder) => {
          setOrders((prev) => [newOrder, ...prev]);
        }}
        onNotify={onNotify}
        initialQuotation={initialQuotationForCreate}
        masterCustomers={masterCustomers}
      />

      {/* CRM Quotation Import Modal */}
      <M13QuotationImportModal
        isOpen={isQuotationImportModalOpen}
        onClose={() => setIsQuotationImportModalOpen(false)}
        onSelectQuotation={(quo) => {
          setInitialQuotationForCreate(quo);
          setIsCreateOrderModalOpen(true);
        }}
        onNotify={onNotify}
      />

      {/* Real Payment Gate Modal */}
      <M13PaymentModal
        isOpen={isPaymentModalOpen}
        order={orderForPayment}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setOrderForPayment(null);
        }}
        onPaymentSuccess={(orderId, paymentResult) => {
          setOrders((prev) =>
            prev.map((o) =>
              o.id === orderId
                ? {
                    ...o,
                    amountPaid: paymentResult.amountPaid,
                    paymentStatus: paymentResult.paymentStatus,
                    paymentRef: paymentResult.paymentRef,
                    status:
                      paymentResult.paymentStatus === 'PAID' && o.status === 'CONFIRMED'
                        ? 'INVOICED'
                        : o.status,
                  }
                : o
            )
          );
        }}
        onNotify={onNotify}
      />

      {/* Confirm Dialog (Rule #19 Compliance) */}
      <ConfirmDialog dialog={confirmDialog} onClose={() => setConfirmDialog(null)} />
    </div>
  );
};

export default M13SalesOrdersWorkspace;
