import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Store,
  ShoppingCart,
  Clock,
  Receipt,
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  QrCode,
  Tag,
  User,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Printer,
  FileText,
  RefreshCw,
  Layers,
  ChevronRight,
  ShieldCheck,
  Check,
  X,
  Info,
  Eye,
  Download,
  ArrowRight,
  DollarSign,
  Filter,
  Boxes,
  ArrowDownRight,
  ArrowUpRight,
  Sparkles,
  Percent
} from 'lucide-react';
import { formatVNDCurrency } from '../../../utils/currencyFormatter';
import { formatLocalDateTime } from '../../../utils/timeUtils';
import { ConfirmDialog } from '../../common/ConfirmDialog';
import { ConfirmDialogState } from '../../../types';
import { DeepLinkBanner } from '../../common/DeepLinkBanner';
import { PaginationControl } from '../../common/PaginationControl';
import { useWorkspaceSessionTab } from '../../../hooks/useWorkspaceSessionTab';

// Subcomponents
import { POSHotkeysBar } from './POSHotkeysBar';
import { PinnedQuickPickGrid } from './PinnedQuickPickGrid';
import { SplitPaymentModal, PaymentSplitRow } from './SplitPaymentModal';
import { ThermalReceiptModal } from './ThermalReceiptModal';
import { CashInOutModal } from './CashInOutModal';
import { ParkedOrdersManager, ParkedOrder } from './ParkedOrdersManager';

interface M16POSWorkspaceProps {
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
  onSelectEntity?: (entity: any) => void;
  guidedTask?: any;
}

export const M16POSWorkspace: React.FC<M16POSWorkspaceProps> = ({ onNotify, onSelectEntity, guidedTask }) => {
  // Navigation tabs managed via shared persistence hook
  const [activeTab, setActiveTab] = useWorkspaceSessionTab<'terminal' | 'shift' | 'history'>('M16', 'terminal');

  // Input & Focus Refs for Hotkeys
  const searchInputRef = useRef<HTMLInputElement>(null);
  const promoInputRef = useRef<HTMLInputElement>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);

  // --- TERMINAL & CART STATE ---
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [cart, setCart] = useState<Array<{
    productId: number;
    sku: string;
    name: string;
    price: number;
    qty: number;
    discountPercent: number;
    stock: number;
    lotId?: number | null;
    serials?: string[];
    priceSource?: 'CONTRACT_PRICE' | 'PRICE_LIST' | 'BASE_PRICE';
  }>>([]);

  const [selectedCartIndex, setSelectedCartIndex] = useState<number>(0);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [activeShift, setActiveShift] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Promo Code & Margin Check State
  const [promoCodeInput, setPromoCodeInput] = useState<string>('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountPercent: number; savedAmount?: number } | null>(null);
  const [promoLoading, setPromoLoading] = useState<boolean>(false);

  // Parked / Held Orders Multi-Cart State
  const [parkedOrders, setParkedOrders] = useState<ParkedOrder[]>([]);
  const [activeParkedId, setActiveParkedId] = useState<string | null>(null);

  // Payment Modal State
  const [checkoutModalOpen, setCheckoutModalOpen] = useState<boolean>(false);
  const [requiresVatInvoice, setRequiresVatInvoice] = useState<boolean>(false);
  const [vatDetails, setVatDetails] = useState({ companyName: '', taxCode: '', address: '', email: '' });
  const [processingPayment, setProcessingPayment] = useState<boolean>(false);

  // Receipt & Print Preview State
  const [receiptModalOpen, setReceiptModalOpen] = useState<boolean>(false);
  const [lastCompletedOrder, setLastCompletedOrder] = useState<any | null>(null);

  // Cash In / Out Safe Drop Modal State
  const [cashInOutModalOpen, setCashInOutModalOpen] = useState<boolean>(false);

  // --- SHIFT & CASH STATE ---
  const [shiftHistory, setShiftHistory] = useState<any[]>([]);
  const [shiftSearchQuery, setShiftSearchQuery] = useState<string>('');
  const [shiftStatusFilter, setShiftStatusFilter] = useState<string>('ALL');
  const [shiftPage, setShiftPage] = useState<number>(1);
  const [shiftPageSize, setShiftPageSize] = useState<number>(8);

  const [openShiftModal, setOpenShiftModal] = useState<boolean>(false);
  const [openingFloatInput, setOpeningFloatInput] = useState<string>('2000000');
  const [cashDrawerIdInput, setCashDrawerIdInput] = useState<number>(1);
  const [closeShiftModal, setCloseShiftModal] = useState<boolean>(false);
  const [totalCashInput, setTotalCashInput] = useState<string>('');
  const [closeNotesInput, setCloseNotesInput] = useState<string>('Chốt ca bán lẻ POS');
  const [denominations, setDenominations] = useState<Record<number, number>>({
    500000: 0,
    200000: 0,
    100000: 0,
    50000: 0,
    20000: 0,
    10000: 0,
    5000: 0,
    2000: 0,
    1000: 0
  });

  // --- TRANSACTION HISTORY STATE ---
  const [transactionHistory, setTransactionHistory] = useState<any[]>([]);
  const [txSearchQuery, setTxSearchQuery] = useState<string>('');
  const [txPaymentMethodFilter, setTxPaymentMethodFilter] = useState<string>('ALL');
  const [txPage, setTxPage] = useState<number>(1);
  const [txPageSize, setTxPageSize] = useState<number>(10);
  const [selectedTransactionDetail, setSelectedTransactionDetail] = useState<any | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);

  // Confirm Dialog State (Enterprise Rule #19)
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Xác nhận',
    confirmVariant: 'primary',
    onConfirm: () => {}
  });

  // --- DATA FETCHING ---
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Products Master
      const prodRes = await fetch('/api/products');
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        if (Array.isArray(prodData)) {
          setProducts(prodData);
          const cats = Array.from(new Set(prodData.map((p: any) => p.category || 'Mặc định'))).filter(Boolean) as string[];
          setCategories(cats);
        }
      }

      // 2. Customers
      const custRes = await fetch('/api/customers');
      if (custRes.ok) {
        const custData = await custRes.json();
        if (Array.isArray(custData)) {
          setCustomers(custData);
        }
      }

      // 3. Active Shift & Summary
      const shiftRes = await fetch('/api/shift/active');
      if (shiftRes.ok) {
        const shiftData = await shiftRes.json();
        if (Array.isArray(shiftData) && shiftData.length > 0) {
          const cur = shiftData[0];
          const sumRes = await fetch(`/api/shift/${cur.id}/summary`);
          if (sumRes.ok) {
            const sumData = await sumRes.json();
            setActiveShift({ ...cur, ...sumData });
          } else {
            setActiveShift(cur);
          }
        } else {
          setActiveShift(null);
        }
      }

      // 4. Shift History
      const histRes = await fetch('/api/shift/history');
      if (histRes.ok) {
        const histData = await histRes.json();
        if (Array.isArray(histData)) {
          setShiftHistory(histData);
        }
      }

      // 5. Transaction History (Omnichannel POS orders)
      const salesRes = await fetch('/api/sales/omnichannel');
      if (salesRes.ok) {
        const salesData = await salesRes.json();
        if (Array.isArray(salesData)) {
          setTransactionHistory(salesData.filter((o: any) => 
            o.channel === 'COUNTER' || 
            o.channel === 'POS' || 
            o.channel === 'POS_RETAIL' || 
            (o.orderId && o.orderId.startsWith('POS-')) || 
            (o.code && o.code.startsWith('POS-'))
          ));
        }
      }
    } catch (err: any) {
      console.error('M16 loadData error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Guided Task Auto-navigation
  useEffect(() => {
    if (!guidedTask || !guidedTask.item) return;
    const { item } = guidedTask;
    if (item.id?.includes('SHIFT') || item.title?.includes('Ca')) {
      setActiveTab('shift');
    } else if (item.id?.includes('TRANS') || item.title?.includes('Giao dịch')) {
      setActiveTab('history');
    } else {
      setActiveTab('terminal');
    }
  }, [guidedTask, setActiveTab]);

  // --- CONTRACT PRICING AUTO-RESOLUTION (Group B) ---
  const resolveCartPricing = useCallback(async (currentCart: typeof cart, customerId?: number) => {
    if (currentCart.length === 0) return;

    try {
      const itemsPayload = currentCart.map(item => ({
        productId: item.productId,
        quantity: item.qty
      }));

      const res = await fetch('/api/sales/pricing/resolve-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customerId || selectedCustomer?.id || null,
          items: itemsPayload
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.items)) {
          setCart(prev =>
            prev.map(item => {
              const resolved = data.items.find((r: any) => r.productId === item.productId);
              if (resolved && resolved.unitPrice !== undefined) {
                return {
                  ...item,
                  price: resolved.unitPrice,
                  priceSource: resolved.source || 'BASE_PRICE'
                };
              }
              return item;
            })
          );
        }
      }
    } catch (err) {
      console.error('Auto resolve pricing error:', err);
    }
  }, [selectedCustomer]);

  // Trigger contract price resolution when customer changes
  const handleCustomerChange = async (cust: any | null) => {
    setSelectedCustomer(cust);
    if (cart.length > 0) {
      await resolveCartPricing(cart, cust?.id);
      if (cust) {
        onNotify('info', 'Chính sách giá khách hàng', `Đã áp dụng bảng giá / hợp đồng của khách: ${cust.name}`);
      }
    }
  };

  // --- PROMO / COUPON CODE ENGINE (Group B) ---
  const handleApplyPromoCode = async () => {
    if (!promoCodeInput.trim()) return;
    if (cart.length === 0) {
      onNotify('warning', 'Giỏ hàng trống', 'Vui lòng thêm sản phẩm trước khi áp dụng mã giảm giá.');
      return;
    }

    setPromoLoading(true);
    try {
      const subtotal = cart.reduce((s, i) => s + (i.price * i.qty), 0);
      const res = await fetch('/api/sales/pricing/calculate-discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subtotal,
          promoCode: promoCodeInput.trim(),
          customerId: selectedCustomer?.id
        })
      });

      const data = await res.json();
      if (res.ok && data.discountPercent !== undefined) {
        setAppliedPromo({
          code: promoCodeInput.trim().toUpperCase(),
          discountPercent: data.discountPercent,
          savedAmount: (subtotal * data.discountPercent) / 100
        });
        onNotify('success', 'Mã khuyến mãi hợp lệ', `Đã áp dụng giảm giá ${data.discountPercent}% cho toàn đơn.`);
      } else {
        onNotify('danger', 'Mã không hợp lệ', data.error || data.message || 'Mã giảm giá không áp dụng được hoặc vi phạm biên lợi nhuận tối thiểu.');
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi kiểm tra mã', err.message || 'Không thể kết nối Pricing Engine M41.');
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromoCode = () => {
    setAppliedPromo(null);
    setPromoCodeInput('');
    onNotify('info', 'Hủy mã giảm giá', 'Đã gỡ bỏ mã khuyến mãi khỏi đơn hàng.');
  };

  // --- CART CALCULATIONS ---
  const totalCountedCash = useMemo(() => {
    return Object.entries(denominations).reduce((sum, [denom, qty]) => sum + (Number(denom) * (Number(qty) ?? 0)), 0);
  }, [denominations]);

  const rawCartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.qty * (1 - (item.discountPercent ?? 0) / 100)), 0);
  }, [cart]);

  const overallDiscountPercent = appliedPromo?.discountPercent || 0;
  const promoDiscountAmount = useMemo(() => {
    return (rawCartSubtotal * overallDiscountPercent) / 100;
  }, [rawCartSubtotal, overallDiscountPercent]);

  const cartSubtotal = useMemo(() => {
    return Math.max(0, rawCartSubtotal - promoDiscountAmount);
  }, [rawCartSubtotal, promoDiscountAmount]);

  const cartTax = useMemo(() => {
    return cartSubtotal * 0.10; // Standard 10% VAT
  }, [cartSubtotal]);

  const cartGrandTotal = useMemo(() => {
    return cartSubtotal + cartTax;
  }, [cartSubtotal, cartTax]);

  // --- CART HANDLERS ---
  const handleAddToCart = useCallback((product: any) => {
    setCart(prev => {
      const existingIdx = prev.findIndex(item => item.productId === product.id);
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = { ...next[existingIdx], qty: next[existingIdx].qty + 1 };
        setSelectedCartIndex(existingIdx);
        return next;
      } else {
        const newItem = {
          productId: product.id,
          sku: product.sku ?? `SKU-${product.id}`,
          name: product.name,
          price: product.retailPrice ?? product.price ?? 150000,
          qty: 1,
          discountPercent: 0,
          stock: product.stockQuantity ?? 50,
          priceSource: 'BASE_PRICE' as const
        };
        const next = [...prev, newItem];
        setSelectedCartIndex(next.length - 1);
        return next;
      }
    });
  }, []);

  const handleUpdateQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }
    setCart(prev =>
      prev.map((item, i) => (i === index ? { ...item, qty: newQty } : item))
    );
  };

  const handleRemoveItem = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
    if (selectedCartIndex >= index) {
      setSelectedCartIndex(Math.max(0, selectedCartIndex - 1));
    }
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa toàn bộ giỏ hàng?',
      message: 'Bạn có chắc chắn muốn làm trống giỏ hàng hiện tại? Hành động này không thể hoàn tác.',
      confirmLabel: 'Xóa giỏ hàng',
      confirmVariant: 'danger',
      onConfirm: () => {
        setCart([]);
        setAppliedPromo(null);
        setPromoCodeInput('');
        onNotify('info', 'Giỏ hàng đã xóa', 'Giỏ hàng đã được làm trống.');
      }
    });
  };

  // --- PARK / HOLD ORDER MULTI-CART LOGIC ---
  const handleParkCurrentCart = useCallback(() => {
    if (cart.length === 0) {
      onNotify('warning', 'Không thể treo đơn', 'Giỏ hàng hiện tại đang trống.');
      return;
    }
    if (parkedOrders.length >= 5) {
      onNotify('danger', 'Đạt giới hạn', 'Đã đạt tối đa 5 đơn treo tạm. Vui lòng thanh toán hoặc xóa bớt.');
      return;
    }

    const newParked: ParkedOrder = {
      id: `PARK-${Date.now()}`,
      name: selectedCustomer ? `${selectedCustomer.name}` : `Khách lẻ #${parkedOrders.length + 1}`,
      timestamp: new Date().toISOString(),
      cart: [...cart],
      customer: selectedCustomer,
      promoCode: appliedPromo?.code || '',
      discountPercent: appliedPromo?.discountPercent || 0
    };

    setParkedOrders(prev => [...prev, newParked]);
    // Clear current cart for the next customer
    setCart([]);
    setSelectedCustomer(null);
    setAppliedPromo(null);
    setPromoCodeInput('');
    setActiveParkedId(null);
    onNotify('success', 'Đã treo đơn (F7)', `Đã lưu đơn của "${newParked.name}" vào danh sách tạm.`);
  }, [cart, selectedCustomer, appliedPromo, parkedOrders, onNotify]);

  const handleSelectParkedOrder = (order: ParkedOrder) => {
    // Save current active cart if needed or switch directly
    setActiveParkedId(order.id);
    setCart(order.cart);
    setSelectedCustomer(order.customer);
    if (order.discountPercent > 0) {
      setAppliedPromo({
        code: order.promoCode,
        discountPercent: order.discountPercent
      });
      setPromoCodeInput(order.promoCode);
    } else {
      setAppliedPromo(null);
      setPromoCodeInput('');
    }
    onNotify('info', 'Chuyển đơn hàng', `Đang thao tác trên đơn tạm của "${order.name}".`);
  };

  const handleSelectMainCart = () => {
    setActiveParkedId(null);
  };

  const handleDeleteParkedOrder = (orderId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hủy đơn hàng tạm?',
      message: 'Bạn có chắc chắn muốn xóa đơn treo này? Dữ liệu hàng hóa đã chọn sẽ bị hủy.',
      confirmLabel: 'Xác nhận xóa',
      confirmVariant: 'danger',
      onConfirm: () => {
        setParkedOrders(prev => prev.filter(p => p.id !== orderId));
        if (activeParkedId === orderId) {
          setCart([]);
          setSelectedCustomer(null);
          setAppliedPromo(null);
          setActiveParkedId(null);
        }
        onNotify('info', 'Đã hủy đơn treo', 'Đã xóa đơn tạm khỏi danh sách.');
      }
    });
  };

  // --- BARCODE SCANNER LISTENER (Group A) ---
  useEffect(() => {
    let barcodeBuffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in regular text fields
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return;
      }

      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 150) {
        barcodeBuffer = '';
      }
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (barcodeBuffer.length >= 3) {
          e.preventDefault();
          const scannedCode = barcodeBuffer.trim();
          barcodeBuffer = '';
          const matched = products.find(p => p.sku?.toUpperCase() === scannedCode.toUpperCase() || p.id === Number(scannedCode));
          if (matched) {
            handleAddToCart(matched);
            onNotify('success', 'Quét mã vạch', `Đã thêm ${matched.name} (${matched.sku}) vào giỏ.`);
          } else {
            onNotify('warning', 'Không tìm thấy', `Mã vạch "${scannedCode}" không khớp với sản phẩm nào trong kho.`);
          }
        }
      } else if (e.key.length === 1) {
        barcodeBuffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products, handleAddToCart, onNotify]);

  // --- POS HOTKEYS ENGINE (Group A) ---
  useEffect(() => {
    const handleGlobalHotkeys = (e: KeyboardEvent) => {
      // F2: Focus Search Input
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
      // F4: Focus / Edit Quantity of Selected Line
      else if (e.key === 'F4') {
        e.preventDefault();
        if (cart.length > 0) {
          qtyInputRef.current?.focus();
          qtyInputRef.current?.select();
        }
      }
      // F7: Park / Hold Current Order
      else if (e.key === 'F7') {
        e.preventDefault();
        handleParkCurrentCart();
      }
      // F8: Focus Promo Code
      else if (e.key === 'F8') {
        e.preventDefault();
        promoInputRef.current?.focus();
        promoInputRef.current?.select();
      }
      // F9: Open Checkout Modal
      else if (e.key === 'F9') {
        e.preventDefault();
        if (cart.length > 0) {
          setCheckoutModalOpen(true);
        } else {
          onNotify('warning', 'Giỏ hàng trống', 'Vui lòng thêm sản phẩm trước khi thanh toán.');
        }
      }
      // F10: Reprint Last Receipt
      else if (e.key === 'F10') {
        e.preventDefault();
        if (lastCompletedOrder) {
          setReceiptModalOpen(true);
        } else if (transactionHistory.length > 0) {
          const latest = transactionHistory[0];
          setLastCompletedOrder({
            code: latest.orderId || latest.code || 'POS-HIST',
            createdAt: latest.createdAt,
            customerName: latest.customerName,
            cashierName: 'Thu ngân Ca',
            items: latest.items || [{ name: 'Hàng hóa POS', sku: 'SKU-GEN', quantity: 1, price: latest.totalAmount }],
            subtotal: latest.totalAmount,
            discountAmount: 0,
            taxAmount: Math.round(latest.totalAmount * 0.1),
            finalAmount: latest.totalAmount,
            paymentMethods: [{ method: latest.paymentMethod || 'CASH', amount: latest.totalAmount }]
          });
          setReceiptModalOpen(true);
        } else {
          onNotify('info', 'Chưa có hóa đơn', 'Chưa có giao dịch gần nhất để in lại.');
        }
      }
      // Escape: Close open modals
      else if (e.key === 'Escape') {
        if (checkoutModalOpen) setCheckoutModalOpen(false);
        if (receiptModalOpen) setReceiptModalOpen(false);
        if (cashInOutModalOpen) setCashInOutModalOpen(false);
        if (openShiftModal) setOpenShiftModal(false);
        if (closeShiftModal) setCloseShiftModal(false);
        if (detailModalOpen) setDetailModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleGlobalHotkeys);
    return () => window.removeEventListener('keydown', handleGlobalHotkeys);
  }, [
    cart,
    handleParkCurrentCart,
    lastCompletedOrder,
    transactionHistory,
    checkoutModalOpen,
    receiptModalOpen,
    cashInOutModalOpen,
    openShiftModal,
    closeShiftModal,
    detailModalOpen,
    onNotify
  ]);

  // --- COMPLETE CHECKOUT HANDLER WITH SPLIT PAYMENTS ---
  const handleConfirmSplitCheckout = async (splits: PaymentSplitRow[]) => {
    if (cart.length === 0) return;

    setProcessingPayment(true);
    try {
      const orderPayload = {
        channel: 'COUNTER',
        orderId: `POS-${Date.now().toString().slice(-6)}`,
        customerId: selectedCustomer?.id || null,
        customerName: selectedCustomer?.name || 'Khách lẻ vãng lai',
        items: cart.map(item => ({
          productId: item.productId,
          sku: item.sku,
          name: item.name,
          quantity: item.qty,
          unitPrice: item.price,
          discountPercent: (item.discountPercent || 0) + (appliedPromo?.discountPercent || 0)
        })),
        paymentMethods: splits.map(s => ({
          method: s.method,
          amount: s.amount
        })),
        subtotal: cartSubtotal,
        discountAmount: promoDiscountAmount,
        taxAmount: cartTax,
        totalAmount: cartGrandTotal,
        requiresVatInvoice,
        vatDetails: requiresVatInvoice ? vatDetails : null,
        shiftId: activeShift?.id || null
      };

      const res = await fetch('/api/sales/omnichannel/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      if (res.ok) {
        const result = await res.json();

        // If active parked order, remove it from list
        if (activeParkedId) {
          setParkedOrders(prev => prev.filter(p => p.id !== activeParkedId));
          setActiveParkedId(null);
        }

        // Store completed order for 80mm thermal receipt
        const completedReceiptData = {
          code: orderPayload.orderId,
          createdAt: new Date().toISOString(),
          customerName: orderPayload.customerName,
          cashierName: activeShift?.cashierName || 'Thu ngân Ca POS',
          branchName: 'Cửa hàng Trung tâm',
          items: cart.map(i => ({
            name: i.name,
            sku: i.sku,
            quantity: i.qty,
            price: i.price,
            discountPercent: i.discountPercent
          })),
          subtotal: cartSubtotal + promoDiscountAmount,
          discountAmount: promoDiscountAmount,
          taxAmount: cartTax,
          finalAmount: cartGrandTotal,
          paymentMethods: splits.map(s => ({ method: s.method, amount: s.amount })),
          changeDue: Math.max(0, splits.reduce((sum, s) => sum + s.amount, 0) - cartGrandTotal)
        };

        setLastCompletedOrder(completedReceiptData);
        setCheckoutModalOpen(false);
        setReceiptModalOpen(true);

        // Reset cart
        setCart([]);
        setSelectedCustomer(null);
        setAppliedPromo(null);
        setPromoCodeInput('');
        setRequiresVatInvoice(false);

        onNotify('success', 'Thanh toán thành công', `Đơn hàng ${orderPayload.orderId} đã ghi nhận và trừ tồn kho tự động.`);
        loadData();
      } else {
        const errData = await res.json();
        onNotify('danger', 'Lỗi thanh toán', errData.error || errData.message || 'Không thể ghi nhận đơn hàng POS.');
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi kết nối', err.message || 'Lỗi xử lý thanh toán.');
    } finally {
      setProcessingPayment(false);
    }
  };

  // --- CASH IN / OUT HANDLER (Group B) ---
  const handleCashMovementSubmit = async (params: {
    type: 'CASH_IN' | 'SAFE_DROP';
    amount: number;
    reason: string;
  }) => {
    if (!activeShift) return;

    setConfirmDialog({
      isOpen: true,
      title: params.type === 'CASH_IN' ? 'Xác nhận Nộp Tiền Két (Cash In)?' : 'Xác nhận Rút Tiền Két (Safe Drop)?',
      message: `Bạn đang thực hiện ${params.type === 'CASH_IN' ? 'NỘP THÊM' : 'RÚT BỚT'} số tiền ${formatVNDCurrency(params.amount)} vào két Ca #${activeShift.shiftNo || activeShift.id}. Lý do: "${params.reason}". Giao dịch này sẽ được ghi vào nhật ký két tiền.`,
      confirmLabel: 'Xác nhận thực hiện',
      confirmVariant: params.type === 'CASH_IN' ? 'primary' : 'warning',
      onConfirm: async () => {
        try {
          const res = await fetch('/api/shift/cash-movement', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              shiftId: activeShift.id,
              type: params.type,
              amount: params.amount,
              reason: params.reason
            })
          });

          if (res.ok) {
            onNotify('success', 'Giao dịch két thành công', `Đã ghi nhận ${params.type === 'CASH_IN' ? 'nộp tiền' : 'rút tiền'} ${formatVNDCurrency(params.amount)}.`);
            setCashInOutModalOpen(false);
            loadData();
          } else {
            const errData = await res.json();
            onNotify('danger', 'Lỗi ghi sổ két', errData.error || 'Không thể ghi nhận chuyển quỹ két.');
          }
        } catch (err: any) {
          onNotify('danger', 'Lỗi kết nối', err.message);
        }
      }
    });
  };

  // --- OPEN & CLOSE SHIFT HANDLERS ---
  const handleOpenShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/shift/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          openingFloat: Number(openingFloatInput) || 2000000,
          cashDrawerId: cashDrawerIdInput
        })
      });

      if (res.ok) {
        onNotify('success', 'Mở ca thành công', 'Ca bán lẻ POS đã sẵn sàng nhận đơn.');
        setOpenShiftModal(false);
        loadData();
      } else {
        const err = await res.json();
        onNotify('danger', 'Lỗi mở ca', err.error || 'Không thể mở ca.');
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi kết nối', err.message);
    }
  };

  const handleCloseShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;

    const actualCash = totalCashInput ? Number(totalCashInput) : totalCountedCash;

    setConfirmDialog({
      isOpen: true,
      title: `Chốt & Khóa Ca Làm Việc: ${activeShift.shiftNo ?? activeShift.id}?`,
      message: `Bạn đang thực hiện chốt ca với Tiền mặt thực tế: ${formatVNDCurrency(actualCash)}. Hệ thống sẽ đối soát chênh lệch và khóa quyền lập đơn trên ca này.`,
      confirmLabel: 'Xác nhận chốt ca',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch('/api/shift/close', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              shiftId: activeShift.id,
              actualCashCount: actualCash,
              denominations,
              notes: closeNotesInput
            })
          });

          if (res.ok) {
            onNotify('success', 'Chốt ca hoàn tất', 'Đã lưu báo cáo kết toán ca và số dư thực tế.');
            setCloseShiftModal(false);
            loadData();
          } else {
            const err = await res.json();
            onNotify('danger', 'Lỗi chốt ca', err.error || 'Không thể đóng ca.');
          }
        } catch (err: any) {
          onNotify('danger', 'Lỗi kết nối', err.message);
        }
      }
    });
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;
      const matchSearch =
        !searchQuery ||
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(p.id).includes(searchQuery);
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Category SKU counts for catalog badge
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: products.length };
    products.forEach((p: any) => {
      const cat = p.category || 'Mặc định';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [products]);

  const isShiftOpen = Boolean(activeShift && (activeShift.status === 'OPEN' || activeShift.status === 'ACTIVE'));

  // Filtered Shifts
  const filteredShifts = useMemo(() => {
    return shiftHistory.filter(s => {
      const matchStatus = shiftStatusFilter === 'ALL' || s.status === shiftStatusFilter;
      const matchSearch =
        !shiftSearchQuery ||
        s.shiftNo?.toLowerCase().includes(shiftSearchQuery.toLowerCase()) ||
        s.cashierName?.toLowerCase().includes(shiftSearchQuery.toLowerCase()) ||
        String(s.id).includes(shiftSearchQuery);
      return matchStatus && matchSearch;
    });
  }, [shiftHistory, shiftStatusFilter, shiftSearchQuery]);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return transactionHistory.filter(t => {
      const matchMethod = txPaymentMethodFilter === 'ALL' || t.paymentMethod === txPaymentMethodFilter;
      const matchSearch =
        !txSearchQuery ||
        t.orderId?.toLowerCase().includes(txSearchQuery.toLowerCase()) ||
        t.customerName?.toLowerCase().includes(txSearchQuery.toLowerCase()) ||
        t.code?.toLowerCase().includes(txSearchQuery.toLowerCase());
      return matchMethod && matchSearch;
    });
  }, [transactionHistory, txPaymentMethodFilter, txSearchQuery]);

  return (
    <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 select-none">
      {/* L1 Header Banner */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                M16 — BÁN HÀNG TẠI QUẦY & POS OMNICHANNEL
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/80 dark:text-blue-200 border border-blue-200 dark:border-blue-700">
                v2.5 PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Quầy thu ngân tốc độ cao, hỗ trợ đa giỏ hàng, phím tắt POS, chia thanh toán & tích hợp M41/M42
            </p>
          </div>
        </div>

        {/* Shift status badge & Quick Action */}
        <div className="flex items-center gap-3">
          {activeShift ? (
            <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <div className="text-xs">
                <span className="font-bold text-emerald-800 dark:text-emerald-300">
                  Ca đang mở #{activeShift.shiftNo ?? activeShift.id}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 ml-1 font-mono">
                  (Quầy #{activeShift.cashDrawerId ?? 1})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCashInOutModalOpen(true)}
                className="ml-1 px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                title="Nộp hoặc Rút tiền két giữa ca"
              >
                Thu/Chi Két
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-3 py-1.5 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                Chưa có ca làm việc
              </span>
              <button
                type="button"
                onClick={() => setOpenShiftModal(true)}
                className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
              >
                Mở ca ngay
              </button>
            </div>
          )}

          {/* Navigation Workspace Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setActiveTab('terminal')}
              className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'terminal'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Màn Hình Thu Ngân (Terminal)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('shift')}
              className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'shift'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Quản Lý Ca Làm Việc (Shifts)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Lịch Sử Đơn Bán POS</span>
            </button>
          </div>
        </div>
      </div>

      {/* Deep Link Banner if available */}
      {guidedTask && (
        <div className="px-4 pt-2">
          <DeepLinkBanner guidedTask={guidedTask} onClear={() => {}} />
        </div>
      )}

      {/* MAIN BODY PER ACTIVE TAB */}
      <div className="flex-1 overflow-hidden p-3 sm:p-4">
        {/* ================= TAB 1: TERMINAL ================= */}
        {activeTab === 'terminal' && (
          <div className="relative h-full overflow-hidden">
            {/* Shift Inactive Lock Overlay */}
            {!isShiftOpen && (
              <div className="absolute inset-0 z-40 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 select-none rounded-2xl">
                <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full flex flex-col items-center text-center space-y-4 animate-in fade-in zoom-in duration-200">
                  <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-inner">
                    <Lock className="w-7 h-7" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      Vùng thao tác bị khóa cho tới khi mở ca
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Bạn cần khai báo số dư quỹ đầu ca (Opening Float) và kích hoạt ca làm việc để thực hiện chọn hàng, quét mã vạch và thanh toán đơn hàng.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpenShiftModal(true)}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Mở ca làm việc ngay</span>
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 h-full overflow-hidden">
              {/* Left Panel: Parked Orders, Top Search Bar, Pinned Quick Pick & Full Catalog (Col 7) */}
              <div className="lg:col-span-7 flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden p-3.5">
                {/* 1. Parked Orders Multi-Cart Tabs (Fixed at Top of Product Area) */}
                <ParkedOrdersManager
                  parkedOrders={parkedOrders}
                  activeParkedId={activeParkedId}
                  onSelectMainCart={handleSelectMainCart}
                  onSelectParkedOrder={handleSelectParkedOrder}
                  onParkCurrentCart={handleParkCurrentCart}
                  onDeleteParkedOrder={handleDeleteParkedOrder}
                  currentCartItemCount={cart.reduce((s, i) => s + i.qty, 0)}
                />

                {/* 2. Search & Barcode Input (Top Priority Input Position above Quick-Pick) */}
                <div className="relative mb-3 shrink-0">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Tìm sản phẩm theo tên, mã SKU, barcode... (Nhấn F2 để focus)"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-16 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  />
                  <div className="absolute right-2.5 top-2.5 flex items-center gap-1 text-[10px] text-slate-400">
                    <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300 font-mono font-bold">
                      F2
                    </kbd>
                  </div>
                </div>

                {/* 3. Pinned Quick-Pick Best Sellers Bar (Surface-1, Borderless, Distinct Spacing) */}
                <PinnedQuickPickGrid
                  products={products}
                  onAddToCart={handleAddToCart}
                />

                {/* 4. Full Catalog Section: Category Filters & Product Grid */}
                <div className="flex-1 flex flex-col min-h-0 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                  {/* Category Pills with SKU Counts */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-2 text-xs shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('ALL')}
                      className={`min-h-[32px] px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                        selectedCategory === 'ALL'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      Tất cả ({products.length})
                    </button>
                    {categories.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`min-h-[32px] px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                          selectedCategory === cat
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {cat} ({categoryCounts[cat] || 0})
                      </button>
                    ))}
                  </div>

                  {/* Product Grid (Bordered Cards) */}
                  <div className="flex-1 overflow-y-auto pr-1 mt-1">
                    {filteredProducts.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 py-10">
                        <Boxes className="w-12 h-12 text-slate-300 dark:text-slate-700" />
                        <p className="text-xs font-medium">Không tìm thấy sản phẩm nào khớp với tìm kiếm</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
                        {filteredProducts.map(product => {
                          const price = product.retailPrice ?? product.price ?? 150000;
                          const stock = product.stockAvailable ?? product.stockPhysical ?? product.stockQuantity ?? 50;

                          return (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => handleAddToCart(product)}
                              className="p-3 bg-white dark:bg-slate-800/90 hover:bg-blue-50/80 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 rounded-2xl text-left transition-all shadow-2xs group flex flex-col justify-between cursor-pointer min-h-[105px]"
                            >
                              <div>
                                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300 truncate max-w-[80px]">
                                    {product.sku ?? `SKU-${product.id}`}
                                  </span>
                                  <span className={`font-semibold ${stock <= 5 ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                    {stock} tồn
                                  </span>
                                </div>
                                <div className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                  {product.name}
                                </div>
                              </div>

                              <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-700/60">
                                <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                                  {formatVNDCurrency(price)}
                                </span>
                                <span className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                  <Plus className="w-3.5 h-3.5" />
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Panel: Customer Selector, Cart, Contract Price, Promo & Checkout (Col 5) */}
              <div className="lg:col-span-5 flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden p-3.5 justify-between space-y-3">
                <div className="space-y-2.5 flex-1 flex flex-col overflow-hidden">
                  {/* Customer Selector & Contract Price Banner */}
                  <div className="p-2 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 shrink-0">
                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                    <select
                      value={selectedCustomer?.id || ''}
                      onChange={e => {
                        const cid = Number(e.target.value);
                        const cust = customers.find(c => c.id === cid) || null;
                        handleCustomerChange(cust);
                      }}
                      className="flex-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 font-medium text-slate-800 dark:text-slate-200"
                    >
                      <option value="">Khách lẻ vãng lai (Giá niêm yết)</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.phone ? `(${c.phone})` : ''} — Nhóm: {c.customerGroup || 'VIP'}
                        </option>
                      ))}
                    </select>
                    {selectedCustomer && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/80 dark:text-purple-200 border border-purple-200 shrink-0">
                        Giá hợp đồng
                      </span>
                    )}
                  </div>

                {/* Cart Items Table */}
                <div className="flex-1 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 p-2">
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 py-8">
                      <ShoppingCart className="w-10 h-10 text-slate-300 dark:text-slate-700" />
                      <p className="text-xs font-medium">Giỏ hàng đang trống</p>
                      <p className="text-[11px] text-slate-400">Chọn sản phẩm bên trái hoặc quét mã barcode</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {cart.map((item, idx) => {
                        const isSelected = selectedCartIndex === idx;
                        return (
                          <div
                            key={`${item.productId}-${idx}`}
                            onClick={() => setSelectedCartIndex(idx)}
                            className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 cursor-pointer ${
                              isSelected
                                ? 'bg-white dark:bg-slate-800 border-blue-400 dark:border-blue-500 shadow-2xs'
                                : 'bg-white/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[10px] text-slate-400">{item.sku}</span>
                                {item.priceSource === 'CONTRACT_PRICE' && (
                                  <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                                    Hợp đồng
                                  </span>
                                )}
                              </div>
                              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {item.name}
                              </div>
                              <div className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                                {formatVNDCurrency(item.price)}
                              </div>
                            </div>

                            {/* Quantity Controls (Touch-Friendly 44px) */}
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateQty(idx, item.qty - 1);
                                }}
                                className="min-w-[36px] min-h-[36px] rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold cursor-pointer transition-colors"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>

                              <input
                                ref={isSelected ? qtyInputRef : undefined}
                                type="number"
                                min={1}
                                value={item.qty}
                                onChange={(e) => handleUpdateQty(idx, Number(e.target.value) || 1)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-12 h-9 text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-white"
                              />

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateQty(idx, item.qty + 1);
                                }}
                                className="min-w-[36px] min-h-[36px] rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold cursor-pointer transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveItem(idx);
                                }}
                                className="min-w-[36px] min-h-[36px] text-slate-400 hover:text-rose-600 rounded-lg flex items-center justify-center hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer ml-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Promo Code Input & Minimum Margin Engine (Group B) */}
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Mã giảm giá / Voucher (F8):
                    </span>
                  </div>

                  <div className="flex gap-1.5">
                    <input
                      ref={promoInputRef}
                      type="text"
                      placeholder="Nhập mã coupon (VD: SUMMER10)..."
                      value={promoCodeInput}
                      onChange={e => setPromoCodeInput(e.target.value.toUpperCase())}
                      className="flex-1 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-mono font-bold uppercase text-slate-900 dark:text-white"
                    />
                    {appliedPromo ? (
                      <button
                        type="button"
                        onClick={handleRemovePromoCode}
                        className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-950 dark:text-rose-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        Gỡ bỏ
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleApplyPromoCode}
                        disabled={promoLoading || !promoCodeInput.trim()}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1"
                      >
                        {promoLoading && <RefreshCw className="w-3 h-3 animate-spin" />}
                        <span>Áp dụng</span>
                      </button>
                    )}
                  </div>

                  {appliedPromo && (
                    <div className="flex items-center justify-between text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 pt-0.5">
                      <span>Đã áp dụng mã {appliedPromo.code}: -{appliedPromo.discountPercent}%</span>
                      <span>-{formatVNDCurrency(promoDiscountAmount)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Cart Summary & Checkout Action */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <div className="space-y-1 text-xs font-mono">
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Tạm tính tiền hàng:</span>
                    <span className="tabular-nums font-semibold">{formatVNDCurrency(rawCartSubtotal)}</span>
                  </div>
                  {promoDiscountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                      <span>Giảm giá khuyến mãi:</span>
                      <span className="tabular-nums">-{formatVNDCurrency(promoDiscountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Thuế GTGT (VAT 10%):</span>
                    <span className="tabular-nums font-semibold">{formatVNDCurrency(cartTax)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-700">
                    <span>TỔNG THANH TOÁN:</span>
                    <span className="text-base text-blue-600 dark:text-blue-400 tabular-nums">
                      {formatVNDCurrency(cartGrandTotal)}
                    </span>
                  </div>
                </div>

                {/* Checkout & Clear Buttons (Touch Target 44px) */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleClearCart}
                    disabled={cart.length === 0}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/50 dark:text-slate-300 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    title="Xóa toàn bộ giỏ hàng"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    disabled={cart.length === 0}
                    onClick={() => setCheckoutModalOpen(true)}
                    className="min-h-[44px] flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Thanh Toán & In HĐ (F9)</span>
                    <span className="font-mono tabular-nums">({formatVNDCurrency(cartGrandTotal)})</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* ================= TAB 2: QUẢN LÝ CA (SHIFTS) ================= */}
        {activeTab === 'shift' && (
          <div className="space-y-4 h-full overflow-y-auto pr-1">
            {/* Active Shift Card */}
            {activeShift ? (
              <div className="p-5 bg-gradient-to-r from-blue-900 to-slate-900 text-white rounded-2xl shadow-md border border-blue-800/50 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
                      <Unlock className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold">Ca Đang Mở: {activeShift.shiftNo ?? activeShift.id}</h2>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white">
                          ĐANG HOẠT ĐỘNG
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">
                        Thu ngân: <span className="font-bold text-white">{activeShift.cashierName ?? 'Admin'}</span> • Giờ mở ca: {activeShift.openedAt ? formatLocalDateTime(activeShift.openedAt) : '-'} • Két #{activeShift.cashDrawerId ?? 1}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCashInOutModalOpen(true)}
                      className="min-h-[44px] px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <ArrowDownRight className="w-4 h-4" />
                      <span>Thu / Chi Quỹ Két (Cash In/Out)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCloseShiftModal(true)}
                      className="min-h-[44px] px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Chốt & Kết Toán Ca</span>
                    </button>
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-3 bg-white/10 rounded-xl backdrop-blur-xs border border-white/10">
                    <span className="text-[11px] text-slate-300 block mb-0.5">Tiền quỹ ban đầu (Opening)</span>
                    <span className="text-sm font-mono font-bold text-white tabular-nums">
                      {formatVNDCurrency(activeShift.openingFloat ?? 2000000)}
                    </span>
                  </div>
                  <div className="p-3 bg-white/10 rounded-xl backdrop-blur-xs border border-white/10">
                    <span className="text-[11px] text-slate-300 block mb-0.5">Doanh thu bán tiền mặt</span>
                    <span className="text-sm font-mono font-bold text-emerald-400 tabular-nums">
                      {formatVNDCurrency(activeShift.cashSalesTotal ?? 0)}
                    </span>
                  </div>
                  <div className="p-3 bg-white/10 rounded-xl backdrop-blur-xs border border-white/10">
                    <span className="text-[11px] text-slate-300 block mb-0.5">Thanh toán Thẻ / VietQR</span>
                    <span className="text-sm font-mono font-bold text-cyan-400 tabular-nums">
                      {formatVNDCurrency(activeShift.nonCashSalesTotal ?? 0)}
                    </span>
                  </div>
                  <div className="p-3 bg-white/10 rounded-xl backdrop-blur-xs border border-white/10">
                    <span className="text-[11px] text-slate-300 block mb-0.5">Tiền mặt kỳ vọng trong két</span>
                    <span className="text-sm font-mono font-bold text-amber-300 tabular-nums">
                      {formatVNDCurrency(activeShift.reconstructedExpectedCash ?? ((activeShift.openingFloat ?? 2000000) + (activeShift.cashSalesTotal ?? 0)))}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Hiện Chưa Có Ca Bán Hàng Nào Đang Mở</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                    Mở ca làm việc mới để bắt đầu nhận đơn tại quầy POS, khai báo tiền quỹ ban đầu và đối soát két.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenShiftModal(true)}
                  className="min-h-[44px] px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
                >
                  + Khởi tạo Mở Ca Làm Việc Mới
                </button>
              </div>
            )}

            {/* Shift History Log Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Lịch Sử & Nhật Ký Đối Soát Ca Làm Việc</h3>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Tìm mã ca, thu ngân..."
                    value={shiftSearchQuery}
                    onChange={e => setShiftSearchQuery(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium"
                  />
                  <select
                    value={shiftStatusFilter}
                    onChange={e => setShiftStatusFilter(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium"
                  >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="OPEN">Đang mở (OPEN)</option>
                    <option value="CLOSED">Đã chốt (CLOSED)</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3">Mã Ca</th>
                      <th className="p-3">Thu Ngân</th>
                      <th className="p-3">Giờ Mở / Đóng</th>
                      <th className="p-3 text-right">Quỹ Đầu Ca</th>
                      <th className="p-3 text-right">DT Tiền Mặt</th>
                      <th className="p-3 text-right">Thực Tế Kiểm Kê</th>
                      <th className="p-3 text-right">Chênh Lệch</th>
                      <th className="p-3 text-center">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                    {filteredShifts.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-slate-400 font-sans">
                          Chưa có dữ liệu ca làm việc
                        </td>
                      </tr>
                    ) : (
                      filteredShifts.slice((shiftPage - 1) * shiftPageSize, shiftPage * shiftPageSize).map(s => {
                        const diff = s.cashDifference ?? ((s.actualCashCount ?? 0) - (s.reconstructedExpectedCash ?? s.expectedCash ?? 0));
                        return (
                          <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                            <td className="p-3 font-bold text-blue-600 dark:text-blue-400">{s.shiftNo ?? s.id}</td>
                            <td className="p-3 font-sans font-medium text-slate-900 dark:text-slate-100">{s.cashierName ?? 'Admin'}</td>
                            <td className="p-3 text-[11px] text-slate-500 dark:text-slate-400">
                              <div>Mở: {s.openedAt ? formatLocalDateTime(s.openedAt) : '-'}</div>
                              {s.closedAt && <div>Đóng: {formatLocalDateTime(s.closedAt)}</div>}
                            </td>
                            <td className="p-3 text-right tabular-nums">{formatVNDCurrency(s.openingFloat ?? 2000000)}</td>
                            <td className="p-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">{formatVNDCurrency(s.cashSalesTotal ?? 0)}</td>
                            <td className="p-3 text-right tabular-nums font-bold">{s.actualCashCount ? formatVNDCurrency(s.actualCashCount) : '-'}</td>
                            <td className="p-3 text-right tabular-nums font-bold">
                              {s.status === 'CLOSED' ? (
                                <span className={diff === 0 ? 'text-emerald-600' : diff > 0 ? 'text-blue-600' : 'text-rose-600'}>
                                  {diff > 0 ? `+${formatVNDCurrency(diff)}` : formatVNDCurrency(diff)}
                                </span>
                              ) : '-'}
                            </td>
                            <td className="p-3 text-center font-sans">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                s.status === 'OPEN' || s.status === 'ACTIVE'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              }`}>
                                {s.status === 'OPEN' || s.status === 'ACTIVE' ? 'Đang mở' : 'Đã chốt ca'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {filteredShifts.length > shiftPageSize && (
                <div className="p-3 border-t border-slate-200 dark:border-slate-800">
                  <PaginationControl
                    currentPage={shiftPage}
                    totalPages={Math.ceil(filteredShifts.length / shiftPageSize)}
                    pageSize={shiftPageSize}
                    totalItems={filteredShifts.length}
                    startIndex={(shiftPage - 1) * shiftPageSize + 1}
                    endIndex={Math.min(shiftPage * shiftPageSize, filteredShifts.length)}
                    onPageChange={setShiftPage}
                    onPageSizeChange={s => {
                      setShiftPageSize(s);
                      setShiftPage(1);
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 3: LỊCH SỬ ĐƠN BÁN POS ================= */}
        {activeTab === 'history' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Danh Sách Hóa Đơn & Đơn Hàng POS</h3>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Tìm theo số HĐ, khách hàng..."
                  value={txSearchQuery}
                  onChange={e => setTxSearchQuery(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium"
                />
                <select
                  value={txPaymentMethodFilter}
                  onChange={e => setTxPaymentMethodFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium"
                >
                  <option value="ALL">Tất cả PTTT</option>
                  <option value="CASH">Tiền mặt (CASH)</option>
                  <option value="CARD">Thẻ ngân hàng (CARD)</option>
                  <option value="VIETQR">VietQR động</option>
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3">Số Hóa Đơn</th>
                    <th className="p-3">Thời Gian</th>
                    <th className="p-3">Khách Hàng</th>
                    <th className="p-3">PTTT</th>
                    <th className="p-3 text-right">Tổng Tiền</th>
                    <th className="p-3 text-right">Giá Vốn (COGS)</th>
                    <th className="p-3 text-center">Trạng Thái</th>
                    <th className="p-3 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-400 font-sans">
                        Chưa có giao dịch bán lẻ nào
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.slice((txPage - 1) * txPageSize, txPage * txPageSize).map(t => (
                      <tr key={t.id || t.orderId} className="hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                        <td className="p-3 font-bold text-blue-600 dark:text-blue-400">{t.orderId ?? t.code}</td>
                        <td className="p-3 text-[11px] text-slate-500 dark:text-slate-400 font-sans">
                          {t.createdAt ? formatLocalDateTime(t.createdAt) : '-'}
                        </td>
                        <td className="p-3 font-sans font-medium text-slate-900 dark:text-slate-100">{t.customerName ?? 'Khách lẻ vãng lai'}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {t.paymentMethod ?? 'CASH'}
                          </span>
                        </td>
                        <td className="p-3 text-right tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                          {formatVNDCurrency(t.totalAmount ?? 0)}
                        </td>
                        <td className="p-3 text-right tabular-nums text-slate-500">
                          {t.cogsStatus === 'PENDING' || t.cogsAmount === null ? (
                            <span className="text-[10px] text-amber-600">Đang tính</span>
                          ) : (
                            formatVNDCurrency(t.cogsAmount)
                          )}
                        </td>
                        <td className="p-3 text-center font-sans">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            {t.paymentStatus ?? 'PAID'}
                          </span>
                        </td>
                        <td className="p-3 text-center font-sans">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTransactionDetail(t);
                              setDetailModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Xem chi tiết hóa đơn & Bút toán GL"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {filteredTransactions.length > txPageSize && (
              <div className="p-3 border-t border-slate-200 dark:border-slate-800">
                <PaginationControl
                  currentPage={txPage}
                  totalPages={Math.ceil(filteredTransactions.length / txPageSize)}
                  pageSize={txPageSize}
                  totalItems={filteredTransactions.length}
                  startIndex={(txPage - 1) * txPageSize + 1}
                  endIndex={Math.min(txPage * txPageSize, filteredTransactions.length)}
                  onPageChange={setTxPage}
                  onPageSizeChange={s => {
                    setTxPageSize(s);
                    setTxPage(1);
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* L4 Footer: Shortcut Hint Bar */}
      <div className="p-2 sm:px-4 bg-slate-900 border-t border-slate-800">
        <POSHotkeysBar
          onSearchFocus={() => searchInputRef.current?.focus()}
          onQtyFocus={() => qtyInputRef.current?.focus()}
          onParkOrder={handleParkCurrentCart}
          onPromoFocus={() => promoInputRef.current?.focus()}
          onCheckout={() => {
            if (cart.length > 0) setCheckoutModalOpen(true);
          }}
          onReprint={() => {
            if (lastCompletedOrder) setReceiptModalOpen(true);
          }}
        />
      </div>

      {/* ================= MODALS & DRAWERS ================= */}

      {/* 1. Split Payment Modal (Group A) */}
      <SplitPaymentModal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        cartGrandTotal={cartGrandTotal}
        cartSubtotal={cartSubtotal}
        cartTax={cartTax}
        discountAmount={promoDiscountAmount}
        itemCount={cart.reduce((s, i) => s + i.qty, 0)}
        customer={selectedCustomer}
        requiresVatInvoice={requiresVatInvoice}
        setRequiresVatInvoice={setRequiresVatInvoice}
        vatDetails={vatDetails}
        setVatDetails={setVatDetails}
        onConfirmCheckout={handleConfirmSplitCheckout}
        processing={processingPayment}
      />

      {/* 2. 80mm Thermal Receipt Print Preview (Group A) */}
      <ThermalReceiptModal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        orderData={lastCompletedOrder}
      />

      {/* 3. Cash In / Out (Safe Drop & Float Top-up) Modal (Group B) */}
      <CashInOutModal
        isOpen={cashInOutModalOpen}
        onClose={() => setCashInOutModalOpen(false)}
        activeShift={activeShift}
        onSubmit={handleCashMovementSubmit}
      />

      {/* 4. Open Shift Modal */}
      {openShiftModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <form onSubmit={handleOpenShiftSubmit} className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Unlock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Mở Ca Làm Việc POS Mới</h3>
              </div>
              <button type="button" onClick={() => setOpenShiftModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Tiền quỹ đầu ca (Opening Float - VND):</label>
                <input
                  type="number"
                  value={openingFloatInput}
                  onChange={e => setOpeningFloatInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Mã quầy / Két tiền (Cash Drawer):</label>
                <select
                  value={cashDrawerIdInput}
                  onChange={e => setCashDrawerIdInput(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium"
                >
                  <option value={1}>Quầy số 1 (Drawer #1 - POS-REG-01)</option>
                  <option value={2}>Quầy số 2 (Drawer #2 - POS-REG-02)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setOpenShiftModal(false)}
                className="min-h-[44px] flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer"
              >
                Hủy bỏ (Esc)
              </button>
              <button
                type="submit"
                className="min-h-[44px] flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md cursor-pointer"
              >
                Xác nhận mở ca
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 5. Close Shift Modal */}
      {closeShiftModal && activeShift && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <form onSubmit={handleCloseShiftSubmit} className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Chốt & Đối Soát Ca: {activeShift.shiftNo ?? activeShift.id}</h3>
              </div>
              <button type="button" onClick={() => setCloseShiftModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Nhập số lượng từng mệnh giá tiền mặt thực tế trong két hoặc điền trực tiếp tổng số tiền mặt đếm được.
              </p>

              <div className="bg-blue-50/80 dark:bg-blue-950/60 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-3 space-y-1.5">
                <label className="text-xs font-bold text-blue-900 dark:text-blue-200 block">Tổng tiền mặt thực tế (Actual Cash):</label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    placeholder="VD: 5000000"
                    value={totalCashInput}
                    onChange={e => setTotalCashInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border-2 border-blue-300 dark:border-blue-700 rounded-xl text-lg font-bold font-mono text-blue-700 dark:text-blue-300 focus:outline-hidden focus:border-blue-600"
                  />
                  <span className="absolute right-3.5 top-3 text-xs font-bold text-blue-500">VND</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                  <span>Tự động tính từ bảng mệnh giá:</span>
                  <span className="font-mono font-bold text-blue-700 dark:text-blue-300">{formatVNDCurrency(totalCountedCash)}</span>
                </div>
              </div>

              {/* Denominations breakdown */}
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {[500000, 200000, 100000, 50000, 20000, 10000, 5000, 2000, 1000].map(denom => (
                  <div key={denom} className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{formatVNDCurrency(denom)}</span>
                    <input
                      type="number"
                      min={0}
                      value={denominations[denom] ?? 0}
                      onChange={e => setDenominations({ ...denominations, [denom]: Number(e.target.value) ?? 0 })}
                      className="w-20 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-right font-mono font-bold"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Ghi chú đối soát ca:</label>
                <input
                  type="text"
                  value={closeNotesInput}
                  onChange={e => setCloseNotesInput(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setCloseShiftModal(false)}
                className="min-h-[44px] flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer"
              >
                Hủy bỏ (Esc)
              </button>
              <button
                type="submit"
                className="min-h-[44px] flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-md cursor-pointer"
              >
                Xác nhận chốt ca
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 6. Transaction Detail 360° Drawer / Modal */}
      {detailModalOpen && selectedTransactionDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-xl w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Hóa Đơn Bán Lẻ: {selectedTransactionDetail.orderId ?? selectedTransactionDetail.code}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    Khách hàng: {selectedTransactionDetail.customerName ?? 'Khách lẻ'} • Thời gian: {selectedTransactionDetail.createdAt ? formatLocalDateTime(selectedTransactionDetail.createdAt) : '-'}
                  </p>
                </div>
              </div>
              <button onClick={() => setDetailModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-500 block">Phương thức</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{selectedTransactionDetail.paymentMethod ?? 'CASH'}</span>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-500 block">Tổng tiền</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatVNDCurrency(selectedTransactionDetail.totalAmount ?? 0)}</span>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-500 block">Trạng thái</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedTransactionDetail.paymentStatus ?? 'PAID'}</span>
                </div>
              </div>

              {/* Accounting GL Double Entry Preview */}
              <div className="p-3 bg-blue-50/70 dark:bg-blue-950/50 rounded-xl border border-blue-100 dark:border-blue-900/60 space-y-1.5">
                <span className="text-[11px] font-bold text-blue-900 dark:text-blue-200 block">Bút Toán Định Khoản Sổ Cái (GL Posting):</span>
                <div className="space-y-1 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span>Nợ TK 1111 (Tiền mặt tại quỹ):</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">{formatVNDCurrency(selectedTransactionDetail.totalAmount ?? 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Có TK 5111 (Doanh thu bán hàng):</span>
                    <span>{formatVNDCurrency(Math.round((selectedTransactionDetail.totalAmount ?? 0) / 1.1))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Có TK 3331 (Thuế GTGT đầu ra):</span>
                    <span>{formatVNDCurrency(Math.round((selectedTransactionDetail.totalAmount ?? 0) - (selectedTransactionDetail.totalAmount ?? 0) / 1.1))}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-blue-200/60 dark:border-blue-900/60">
                    <span>Nợ TK 632 / Có TK 156 (Giá vốn):</span>
                    {selectedTransactionDetail.cogsStatus === 'PENDING' || selectedTransactionDetail.cogsAmount === null ? (
                      <span className="font-semibold text-amber-600 dark:text-amber-400">Đang chờ tính giá vốn (Chưa xác định)</span>
                    ) : (
                      <span className="font-bold text-slate-800 dark:text-slate-200">{formatVNDCurrency(selectedTransactionDetail.cogsAmount)}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => {
                  window.print();
                  onNotify('info', 'In Hóa Đơn', 'Lệnh in hóa đơn POS đã được gửi.');
                }}
                className="min-h-[44px] flex-1 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In Hóa Đơn</span>
              </button>
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="min-h-[44px] flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enterprise Confirm Dialog (Rule #19) */}
      <ConfirmDialog state={confirmDialog} setState={setConfirmDialog} />
    </div>
  );
};

export default M16POSWorkspace;
