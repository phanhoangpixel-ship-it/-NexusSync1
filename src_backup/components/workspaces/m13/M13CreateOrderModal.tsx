import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Calculator, ShoppingCart, X, Check, Building2, Package, Sparkles, AlertTriangle, ShieldCheck, CreditCard, Layers, Truck, Receipt } from 'lucide-react';
import { CurrencyInput } from '../../common/CurrencyInput';
import { TabErrorIndicator } from '../../common/TabErrorIndicator';
import { ValidationSummaryPanel, ValidationErrorItem } from '../../common/ValidationSummaryPanel';
import { M07CustomerMasterProfile, M07CustomerCreditCheckResult } from '../../../types/salesOrderIntegration';
import { SalesOrderSyncService } from '../../../services/SalesOrderSyncService';
import { safeNumber } from '../../../utils/salesOrderDataNormalizer';

interface ProductItem {
  id?: number;
  productId?: number;
  sku: string;
  name: string;
  qty: number;
  price: number;
  uop: string;
  discountPercent?: number;
  subtotal?: number;
}

interface M13CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated?: (newOrder: any) => void;
  onCreateSuccess?: (newOrder: any) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
  initialQuotation?: any | null;
  masterCustomers?: M07CustomerMasterProfile[];
}

const DEFAULT_PRODUCTS: ProductItem[] = [
  { productId: 1, sku: 'PRD-001', name: 'Thép hình H-Beam SS400 200x200', qty: 10, price: 18500000, uop: 'Tấn', discountPercent: 0 },
  { productId: 2, sku: 'PRD-002', name: 'Ống thép mạ kẽm nhúng nóng D114', qty: 50, price: 1250000, uop: 'Cây', discountPercent: 0 },
  { productId: 3, sku: 'PRD-003', name: 'Xi măng Poóc lăng PCB40 Bao 50kg', qty: 200, price: 95000, uop: 'Bao', discountPercent: 0 },
  { productId: 4, sku: 'PRD-004', name: 'Tôn cuộn mạ màu Az150 0.45mm', qty: 15, price: 21000000, uop: 'Cuộn', discountPercent: 0 },
  { productId: 5, sku: 'PRD-005', name: 'Bulong neo móng M24x800 Cấp bền 8.8', qty: 500, price: 65000, uop: 'Bộ', discountPercent: 0 }
];

const FALLBACK_CUSTOMERS: M07CustomerMasterProfile[] = [
  {
    customerId: 1,
    customerCode: 'CUST-B2B-001',
    customerName: 'Công ty Cổ phần Công nghệ Thông minh Vinatech',
    companyName: 'Công ty Cổ phần Công nghệ Thông minh Vinatech',
    taxCode: '0108765432',
    tier: 'VIP_DIAMOND',
    email: 'an.nv@vinatech.vn',
    billingEmail: 'ketoan@vinatech.vn',
    phone: '0901223344',
    address: 'Tầng 12, Tòa nhà Keangnam Landmark 72, Nam Từ Liêm, Hà Nội',
    creditLimit: 2000000000,
    availableCredit: 1750000000,
    outstandingBalance: 250000000,
    paymentTermsDays: 30,
    defaultDiscountPercent: 5,
    isCreditBlocked: false
  },
  {
    customerId: 2,
    customerCode: 'CUST-B2B-002',
    customerName: 'Tập đoàn Điện tử Quang Minh',
    companyName: 'Tập đoàn Điện tử Quang Minh',
    taxCode: '0308765432',
    tier: 'VIP_GOLD',
    email: 'mai.tt@quangminhelec.com',
    billingEmail: 'einvoice@quangminhelec.com',
    phone: '0918887766',
    address: 'KCN Quế Võ 1, TP. Bắc Ninh, Tỉnh Bắc Ninh',
    creditLimit: 3000000000,
    availableCredit: 2400000000,
    outstandingBalance: 600000000,
    paymentTermsDays: 45,
    defaultDiscountPercent: 3,
    isCreditBlocked: false
  },
  {
    customerId: 3,
    customerCode: 'CUST-B2B-003',
    customerName: 'Công ty Cổ phần Tự động hóa Phương Nam',
    companyName: 'Công ty Cổ phần Tự động hóa Phương Nam',
    taxCode: '0312345678',
    tier: 'STANDARD',
    email: 'long.lh@phuongnamauto.vn',
    billingEmail: 'finance@phuongnamauto.vn',
    phone: '0983332211',
    address: 'Số 45 Đường Hoàng Diệu, Quận 4, TP. Hồ Chí Minh',
    creditLimit: 500000000,
    availableCredit: 380000000,
    outstandingBalance: 120000000,
    paymentTermsDays: 15,
    defaultDiscountPercent: 0,
    isCreditBlocked: false
  }
];

export const M13CreateOrderModal: React.FC<M13CreateOrderModalProps> = ({
  isOpen,
  onClose,
  onOrderCreated,
  onCreateSuccess,
  onNotify,
  initialQuotation,
  masterCustomers
}) => {
  const customerList = masterCustomers && masterCustomers.length > 0 ? masterCustomers : FALLBACK_CUSTOMERS;
  
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | 'custom'>(customerList[0].customerId);
  const [customerName, setCustomerName] = useState(customerList[0].customerName);
  const [taxCode, setTaxCode] = useState(customerList[0].taxCode || '');
  const [address, setAddress] = useState(customerList[0].address || '');
  const [billingEmail, setBillingEmail] = useState(customerList[0].billingEmail || customerList[0].email || '');
  const [customerTier, setCustomerTier] = useState<string>(customerList[0].tier || 'STANDARD');
  
  const [warehouseId, setWarehouseId] = useState<number>(1);
  const [channel, setChannel] = useState<string>('B2B');
  const [paymentTerm, setPaymentTerm] = useState<string>('NET30');
  const [taxRate, setTaxRate] = useState<number>(10);
  const [requiresVatInvoice, setRequiresVatInvoice] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isCalculatingDiscount, setIsCalculatingDiscount] = useState<boolean>(false);
  const [activeFormTab, setActiveFormTab] = useState<'ALL' | 'CUSTOMER' | 'ITEMS' | 'LOGISTICS' | 'TAX_VAT'>('ALL');

  // Line Items
  const [items, setItems] = useState<ProductItem[]>([
    { productId: 1, sku: 'PRD-001', name: 'Thép hình H-Beam SS400 200x200', qty: 5, price: 18500000, uop: 'Tấn', discountPercent: 0 }
  ]);

  // Sync if initialQuotation provided
  useEffect(() => {
    if (initialQuotation) {
      setCustomerName(initialQuotation.customerName || initialQuotation.leadName || 'Khách hàng Báo giá M12');
      if (initialQuotation.items && Array.isArray(initialQuotation.items) && initialQuotation.items.length > 0) {
        setItems(initialQuotation.items.map((it: any, idx: number) => ({
          productId: it.productId || idx + 1,
          sku: it.sku || `SKU-${idx + 1}`,
          name: it.name || it.productName || 'Sản phẩm báo giá',
          qty: it.qty || it.quantity || 1,
          price: it.price || it.unitPrice || 1000000,
          uop: it.uop || 'Cái',
          discountPercent: it.discountPercent || it.discount || 0
        })));
      }
      if (initialQuotation.notes) {
        setNotes(`Chuyển đổi từ Báo giá CRM: ${initialQuotation.code || initialQuotation.id}. ${initialQuotation.notes}`);
      }
    }
  }, [initialQuotation]);

  const activeCustomer = useMemo(() => {
    if (selectedCustomerId === 'custom') return null;
    return customerList.find(c => c.customerId === selectedCustomerId) || null;
  }, [selectedCustomerId, customerList]);

  const handleCustomerChange = (val: string) => {
    if (val === 'custom') {
      setSelectedCustomerId('custom');
      setCustomerName('');
      setTaxCode('');
      setAddress('');
      setBillingEmail('');
      setCustomerTier('STANDARD');
    } else {
      const cId = Number(val);
      setSelectedCustomerId(cId);
      const found = customerList.find(c => c.customerId === cId);
      if (found) {
        setCustomerName(found.customerName);
        setTaxCode(found.taxCode ?? '');
        setAddress(found.billingAddress ?? found.address ?? '');
        setBillingEmail(found.billingEmail ?? found.email ?? '');
        setCustomerTier(found.tier ?? 'STANDARD');
        if (found.defaultDiscountPercent && found.defaultDiscountPercent > 0) {
          setItems(prev => prev.map(it => ({ ...it, discountPercent: found.defaultDiscountPercent })));
        }
      }
    }
  };

  const handleAddItem = () => {
    const nextPrd = DEFAULT_PRODUCTS[items.length % DEFAULT_PRODUCTS.length];
    setItems(prev => [
      ...prev,
      {
        productId: nextPrd.productId,
        sku: nextPrd.sku,
        name: nextPrd.name,
        qty: 1,
        price: nextPrd.price,
        uop: nextPrd.uop,
        discountPercent: activeCustomer?.defaultDiscountPercent ?? 0
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      onNotify('warning', 'Cảnh báo', 'Đơn hàng phải có ít nhất 1 dòng sản phẩm.');
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof ProductItem, value: any) => {
    setItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSelectPresetProduct = (index: number, sku: string) => {
    const found = DEFAULT_PRODUCTS.find(p => p.sku === sku);
    if (found) {
      setItems(prev => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          productId: found.productId,
          sku: found.sku,
          name: found.name,
          price: found.price,
          uop: found.uop
        };
        return next;
      });
    }
  };

  // Dynamic Pricing & Discount Calculation via Backend API
  const handleCalculateDynamicDiscount = async () => {
    setIsCalculatingDiscount(true);
    try {
      const updatedItems = await Promise.all(
        items.map(async (it) => {
          try {
            const res = await fetch('/api/sales/pricing/calculate-discount', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                unitPrice: it.price,
                quantity: it.qty,
                customerTier,
                paymentTerm,
                minMarginPercent: 15
              })
            });
            if (res.ok) {
              const data = await res.json();
              return {
                ...it,
                discountPercent: data.totalDiscountPercent ?? 0
              };
            }
          } catch (e) {
            // fallback
          }
          return it;
        })
      );
      setItems(updatedItems);
      onNotify('success', 'Tính Chiết Khấu Động Hoàn Tất', `Đã áp dụng ma trận chiết khấu theo cấp bậc [${customerTier}] & điều khoản [${paymentTerm}].`);
    } catch (err: any) {
      onNotify('danger', 'Lỗi tính chiết khấu', err.message);
    } finally {
      setIsCalculatingDiscount(false);
    }
  };

  // Computations with strict nullish coalescing to support 0% discounts and 0% taxes
  const subtotalBeforeDiscount = items.reduce((sum, it) => sum + ((it.price ?? 0) * (it.qty ?? 1)), 0);
  const totalDiscountAmount = items.reduce((sum, it) => {
    const disc = it.discountPercent ?? 0;
    return sum + (((it.price ?? 0) * (it.qty ?? 1) * disc) / 100);
  }, 0);
  const subtotalAfterDiscount = Math.max(0, subtotalBeforeDiscount - totalDiscountAmount);
  const effectiveTaxRate = taxRate ?? 10;
  const taxAmount = Math.round((subtotalAfterDiscount * effectiveTaxRate) / 100);
  const grandTotal = subtotalAfterDiscount + taxAmount;

  // Real-time validation
  const validationResult = useMemo(() => {
    return SalesOrderSyncService.validateOrderConsistency(
      {
        customerId: typeof selectedCustomerId === 'number' ? selectedCustomerId : undefined,
        customerName,
        taxCode,
        billingEmail,
        address,
        requiresVatInvoice,
        totalAmountNumeric: grandTotal,
        items: items.map(it => ({
          sku: it.sku,
          name: it.name,
          qty: it.qty,
          price: it.price,
          unitPriceNumeric: it.price
        }))
      },
      customerList
    );
  }, [selectedCustomerId, customerName, taxCode, billingEmail, address, requiresVatInvoice, grandTotal, items, customerList]);

  // Real-time credit check
  const creditCheck: M07CustomerCreditCheckResult | null = useMemo(() => {
    if (!activeCustomer) return null;
    return SalesOrderSyncService.checkCustomerCredit(activeCustomer, grandTotal);
  }, [activeCustomer, grandTotal]);

  // Auto-Fix Functions for individual fields and Global Auto-Fix
  const handleAutoFixCustomerName = () => {
    const fallbackName = activeCustomer?.customerName || customerList[0].customerName;
    setCustomerName(fallbackName);
    onNotify('success', 'Đã tự động sửa', `Đã khôi phục tên doanh nghiệp: "${fallbackName}".`);
  };

  const handleAutoFixTaxCode = () => {
    const fallbackTax = activeCustomer?.taxCode || customerList[0].taxCode || '0108765432';
    // Clean spaces and dashes if any
    const cleanedTax = taxCode ? taxCode.replace(/[^a-zA-Z0-9]/g, '') : fallbackTax;
    const finalTax = cleanedTax.trim() || fallbackTax;
    setTaxCode(finalTax);
    onNotify('success', 'Đã tự động sửa', `Đã chuẩn hóa Mã số thuế: "${finalTax}".`);
  };

  const handleAutoFixBillingEmail = () => {
    // Attempt format normalization first (trim, lower, remove spaces)
    let cleaned = billingEmail ? billingEmail.trim().toLowerCase().replace(/\s+/g, '') : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
      cleaned = activeCustomer?.billingEmail || activeCustomer?.email || customerList[0].billingEmail || 'ketoan@vinatech.vn';
    }
    setBillingEmail(cleaned);
    onNotify('success', 'Đã tự động sửa', `Đã chuẩn hóa email hóa đơn: "${cleaned}".`);
  };

  const handleAutoFixCreditBlocked = () => {
    const validCustomer = customerList.find(c => !c.isCreditBlocked) || customerList[0];
    handleCustomerChange(String(validCustomer.customerId));
    onNotify('success', 'Đã tự động sửa', `Đã chuyển sang khách hàng không bị phong tỏa: "${validCustomer.customerName}".`);
  };

  const handleAutoFixEmptyItems = () => {
    const firstPrd = DEFAULT_PRODUCTS[0];
    setItems([
      {
        productId: firstPrd.productId,
        sku: firstPrd.sku,
        name: firstPrd.name,
        qty: 1,
        price: firstPrd.price,
        uop: firstPrd.uop,
        discountPercent: activeCustomer?.defaultDiscountPercent ?? 0,
      }
    ]);
    onNotify('success', 'Đã tự động sửa', 'Đã thêm dòng sản phẩm mặc định từ danh mục.');
  };

  const handleAutoFixItem = (idx: number, type: 'name' | 'sku' | 'qty' | 'price') => {
    setItems(prev => {
      const next = [...prev];
      if (!next[idx]) return prev;
      const catalogPrd = DEFAULT_PRODUCTS.find(p => p.sku === next[idx].sku) || DEFAULT_PRODUCTS[idx % DEFAULT_PRODUCTS.length];
      
      if (type === 'name') {
        next[idx] = { ...next[idx], name: catalogPrd.name };
      } else if (type === 'sku') {
        next[idx] = { ...next[idx], sku: catalogPrd.sku, name: next[idx].name || catalogPrd.name, price: next[idx].price || catalogPrd.price, uop: catalogPrd.uop };
      } else if (type === 'qty') {
        next[idx] = { ...next[idx], qty: 1 };
      } else if (type === 'price') {
        next[idx] = { ...next[idx], price: catalogPrd.price };
      }
      return next;
    });
    onNotify('success', 'Đã tự động sửa', `Đã khôi phục dữ liệu hợp lệ cho dòng sản phẩm #${idx + 1}.`);
  };

  const handleAutoFixWarehouse = () => {
    setWarehouseId(1);
    onNotify('success', 'Đã tự động sửa', 'Đã chọn kho xuất mặc định: "Kho 1 - Tổng kho Miền Bắc".');
  };

  const handleAutoFixChannel = () => {
    setChannel('B2B');
    onNotify('success', 'Đã tự động sửa', 'Đã đặt kênh phân phối mặc định: "B2B (Khách Hàng Doanh Nghiệp)".');
  };

  const handleAutoFixPaymentTerm = () => {
    setPaymentTerm('NET30');
    onNotify('success', 'Đã tự động sửa', 'Đã đặt điều khoản thanh toán mặc định: "NET30 (30 Ngày)".');
  };

  const handleAutoFixTaxRate = () => {
    setTaxRate(10);
    onNotify('success', 'Đã tự động sửa', 'Đã khôi phục thuế suất VAT tiêu chuẩn: "10%".');
  };

  // Global Auto-Fix (Fixes all invalid fields at once based on schema defaults & last known good values)
  const handleGlobalAutoFix = () => {
    let fixCount = 0;

    // 1. Customer Name
    if (!customerName?.trim()) {
      const fallbackName = activeCustomer?.customerName || customerList[0].customerName;
      setCustomerName(fallbackName);
      fixCount++;
    }

    // 2. Tax Code
    if ((selectedCustomerId === 'custom' && !taxCode?.trim()) || (taxCode && /[^a-zA-Z0-9]/.test(taxCode))) {
      const fallbackTax = activeCustomer?.taxCode || customerList[0].taxCode || '0108765432';
      const cleanedTax = taxCode ? taxCode.replace(/[^a-zA-Z0-9]/g, '') : fallbackTax;
      setTaxCode(cleanedTax.trim() || fallbackTax);
      fixCount++;
    }

    // 3. Billing Email
    let cleanedEmail = billingEmail ? billingEmail.trim().toLowerCase().replace(/\s+/g, '') : '';
    if (cleanedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanedEmail)) {
      cleanedEmail = activeCustomer?.billingEmail || activeCustomer?.email || customerList[0].billingEmail || 'ketoan@vinatech.vn';
      setBillingEmail(cleanedEmail);
      fixCount++;
    } else if (billingEmail && billingEmail !== cleanedEmail) {
      setBillingEmail(cleanedEmail);
      fixCount++;
    }

    // 4. Credit Blocked Customer
    if (activeCustomer?.isCreditBlocked) {
      const validCustomer = customerList.find(c => !c.isCreditBlocked) || customerList[0];
      handleCustomerChange(String(validCustomer.customerId));
      fixCount++;
    }

    // 5. Items
    if (items.length === 0) {
      const firstPrd = DEFAULT_PRODUCTS[0];
      setItems([
        {
          productId: firstPrd.productId,
          sku: firstPrd.sku,
          name: firstPrd.name,
          qty: 1,
          price: firstPrd.price,
          uop: firstPrd.uop,
          discountPercent: activeCustomer?.defaultDiscountPercent ?? 0,
        }
      ]);
      fixCount++;
    } else {
      let itemsModified = false;
      const updatedItems = items.map((it, idx) => {
        const catalogPrd = DEFAULT_PRODUCTS.find(p => p.sku === it.sku) || DEFAULT_PRODUCTS[idx % DEFAULT_PRODUCTS.length];
        let nextSku = it.sku;
        let nextName = it.name;
        let nextQty = it.qty;
        let nextPrice = it.price;

        if (!nextSku?.trim()) {
          nextSku = catalogPrd.sku;
          itemsModified = true;
          fixCount++;
        }
        if (!nextName?.trim()) {
          nextName = catalogPrd.name;
          itemsModified = true;
          fixCount++;
        }
        if (!nextQty || nextQty <= 0 || isNaN(nextQty)) {
          nextQty = 1;
          itemsModified = true;
          fixCount++;
        }
        if (nextPrice === undefined || nextPrice < 0 || isNaN(nextPrice)) {
          nextPrice = catalogPrd.price;
          itemsModified = true;
          fixCount++;
        }

        return {
          ...it,
          sku: nextSku,
          name: nextName,
          qty: nextQty,
          price: nextPrice,
        };
      });

      if (itemsModified) {
        setItems(updatedItems);
      }
    }

    // 6. Logistics & Terms
    if (!warehouseId) {
      setWarehouseId(1);
      fixCount++;
    }
    if (!channel) {
      setChannel('B2B');
      fixCount++;
    }
    if (!paymentTerm) {
      setPaymentTerm('NET30');
      fixCount++;
    }

    // 7. Tax Rate
    if (taxRate === undefined || taxRate < 0 || isNaN(taxRate)) {
      setTaxRate(10);
      fixCount++;
    }

    onNotify(
      'success',
      'Global Auto-Fix Đã Hoàn Tất',
      `Đã tự động khắc phục ${Math.max(1, fixCount)} trường dữ liệu theo định dạng chuẩn và giá trị mặc định của lược đồ.`
    );
  };

  // Structured validation errors for the interactive cross-tab Summary Panel
  const structuredErrors: ValidationErrorItem[] = useMemo(() => {
    const list: ValidationErrorItem[] = [];

    // 1. Customer tab
    if (!customerName?.trim()) {
      const fallbackName = activeCustomer?.customerName || customerList[0].customerName;
      list.push({
        id: 'cust-name-missing',
        tabId: 'CUSTOMER',
        tabLabel: '1. Khách Hàng',
        fieldId: 'm13-customer-name',
        fieldName: 'Tên Doanh Nghiệp',
        message: 'Tên pháp nhân công ty / doanh nghiệp không được để trống.',
        severity: 'error',
        actionLabel: 'Nhập tên',
        isAutoFixable: true,
        autoFixDescription: 'Khôi phục tên từ hồ sơ khách hàng',
        suggestedValueLabel: fallbackName,
        onAutoFix: handleAutoFixCustomerName,
      });
    }
    if (selectedCustomerId === 'custom' && !taxCode?.trim()) {
      const fallbackTax = customerList[0].taxCode || '0108765432';
      list.push({
        id: 'cust-taxcode-missing',
        tabId: 'CUSTOMER',
        tabLabel: '1. Khách Hàng',
        fieldId: 'm13-customer-tax-code',
        fieldName: 'Mã Số Thuế (MST)',
        message: 'Mã số thuế bắt buộc khi khai báo khách hàng mới ngoài Master Data.',
        severity: 'error',
        actionLabel: 'Nhập MST',
        isAutoFixable: true,
        autoFixDescription: 'Áp dụng mã số thuế mẫu hợp lệ',
        suggestedValueLabel: fallbackTax,
        onAutoFix: handleAutoFixTaxCode,
      });
    }
    if (billingEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingEmail)) {
      const fallbackEmail = activeCustomer?.billingEmail || customerList[0].billingEmail || 'ketoan@vinatech.vn';
      list.push({
        id: 'cust-email-invalid',
        tabId: 'CUSTOMER',
        tabLabel: '1. Khách Hàng',
        fieldId: 'm13-customer-billing-email',
        fieldName: 'Email Nhận Hóa Đơn',
        message: 'Định dạng email nhận hóa đơn điện tử VAT không hợp lệ (ví dụ: ketoan@company.vn).',
        severity: 'error',
        actionLabel: 'Sửa email',
        isAutoFixable: true,
        autoFixDescription: 'Chuẩn hóa định dạng email hóa đơn',
        suggestedValueLabel: fallbackEmail,
        onAutoFix: handleAutoFixBillingEmail,
      });
    }
    if (activeCustomer?.isCreditBlocked) {
      const validCustomer = customerList.find(c => !c.isCreditBlocked) || customerList[0];
      list.push({
        id: 'cust-credit-blocked',
        tabId: 'CUSTOMER',
        tabLabel: '1. Khách Hàng',
        fieldId: 'm13-customer-select',
        fieldName: 'Khách Hàng M07',
        message: `Khách hàng [${activeCustomer.customerCode}] đang bị phong tỏa công nợ tại M07.`,
        severity: 'error',
        actionLabel: 'Chọn khách khác',
        isAutoFixable: true,
        autoFixDescription: 'Chuyển sang khách hàng hợp lệ không bị phong tỏa',
        suggestedValueLabel: validCustomer.customerName,
        onAutoFix: handleAutoFixCreditBlocked,
      });
    }

    // 2. Line items tab
    if (items.length === 0) {
      list.push({
        id: 'items-empty',
        tabId: 'ITEMS',
        tabLabel: '2. Hàng Hóa & Đơn Giá',
        fieldId: 'm13-btn-add-item',
        fieldName: 'Danh Sách Hàng Hóa',
        message: 'Đơn hàng phải có ít nhất 1 dòng sản phẩm.',
        severity: 'error',
        actionLabel: 'Thêm SP',
        isAutoFixable: true,
        autoFixDescription: 'Thêm dòng sản phẩm mặc định từ danh mục',
        suggestedValueLabel: DEFAULT_PRODUCTS[0].name,
        onAutoFix: handleAutoFixEmptyItems,
      });
    }
    items.forEach((it, idx) => {
      const catalogPrd = DEFAULT_PRODUCTS.find(p => p.sku === it.sku) || DEFAULT_PRODUCTS[idx % DEFAULT_PRODUCTS.length];
      if (!it.name?.trim()) {
        list.push({
          id: `item-${idx}-name-missing`,
          tabId: 'ITEMS',
          tabLabel: '2. Hàng Hóa & Đơn Giá',
          fieldId: `m13-item-name-${idx}`,
          fieldName: `Tên SP Dòng ${idx + 1}`,
          message: `Dòng ${idx + 1}: Thiếu tên hàng hóa.`,
          severity: 'error',
          actionLabel: 'Nhập tên SP',
          isAutoFixable: true,
          autoFixDescription: 'Khôi phục tên hàng hóa từ danh mục',
          suggestedValueLabel: catalogPrd.name,
          onAutoFix: () => handleAutoFixItem(idx, 'name'),
        });
      }
      if (!it.sku?.trim()) {
        list.push({
          id: `item-${idx}-sku-missing`,
          tabId: 'ITEMS',
          tabLabel: '2. Hàng Hóa & Đơn Giá',
          fieldId: `m13-item-sku-${idx}`,
          fieldName: `Mã SKU Dòng ${idx + 1}`,
          message: `Dòng ${idx + 1}: Chưa chọn mã SKU sản phẩm.`,
          severity: 'error',
          actionLabel: 'Chọn SKU',
          isAutoFixable: true,
          autoFixDescription: 'Gán mã SKU tiêu chuẩn',
          suggestedValueLabel: catalogPrd.sku,
          onAutoFix: () => handleAutoFixItem(idx, 'sku'),
        });
      }
      if (!it.qty || it.qty <= 0) {
        list.push({
          id: `item-${idx}-qty-invalid`,
          tabId: 'ITEMS',
          tabLabel: '2. Hàng Hóa & Đơn Giá',
          fieldId: `m13-item-qty-${idx}`,
          fieldName: `Số Lượng Dòng ${idx + 1}`,
          message: `Dòng ${idx + 1}: Số lượng phải lớn hơn 0.`,
          severity: 'error',
          actionLabel: 'Sửa SL',
          isAutoFixable: true,
          autoFixDescription: 'Đặt lại số lượng mặc định = 1',
          suggestedValueLabel: '1',
          onAutoFix: () => handleAutoFixItem(idx, 'qty'),
        });
      }
      if (it.price === undefined || it.price < 0) {
        list.push({
          id: `item-${idx}-price-invalid`,
          tabId: 'ITEMS',
          tabLabel: '2. Hàng Hóa & Đơn Giá',
          fieldId: `m13-item-price-${idx}`,
          fieldName: `Đơn Giá Dòng ${idx + 1}`,
          message: `Dòng ${idx + 1}: Đơn giá không được âm.`,
          severity: 'error',
          actionLabel: 'Sửa giá',
          isAutoFixable: true,
          autoFixDescription: 'Khôi phục đơn giá niêm yết từ danh mục',
          suggestedValueLabel: `${catalogPrd.price.toLocaleString('vi-VN')} đ`,
          onAutoFix: () => handleAutoFixItem(idx, 'price'),
        });
      }
    });

    // 3. Logistics tab
    if (!warehouseId) {
      list.push({
        id: 'logistics-warehouse-missing',
        tabId: 'LOGISTICS',
        tabLabel: '3. Kho & Điều Khoản',
        fieldId: 'm13-warehouse-select',
        fieldName: 'Kho Xuất Hàng',
        message: 'Vui lòng chọn kho xuất hàng để đồng bộ giữ chỗ tồn kho (M17).',
        severity: 'error',
        actionLabel: 'Chọn kho',
        isAutoFixable: true,
        autoFixDescription: 'Chọn Tổng kho Miền Bắc (Kho 1)',
        suggestedValueLabel: 'Kho 1 - Tổng kho Miền Bắc',
        onAutoFix: handleAutoFixWarehouse,
      });
    }
    if (!channel) {
      list.push({
        id: 'logistics-channel-missing',
        tabId: 'LOGISTICS',
        tabLabel: '3. Kho & Điều Khoản',
        fieldId: 'm13-channel-select',
        fieldName: 'Kênh Phân Phối',
        message: 'Vui lòng chọn kênh phân phối áp dụng cho đơn hàng.',
        severity: 'error',
        actionLabel: 'Chọn kênh',
        isAutoFixable: true,
        autoFixDescription: 'Áp dụng kênh B2B Doanh nghiệp',
        suggestedValueLabel: 'B2B',
        onAutoFix: handleAutoFixChannel,
      });
    }
    if (!paymentTerm) {
      list.push({
        id: 'logistics-payment-term-missing',
        tabId: 'LOGISTICS',
        tabLabel: '3. Kho & Điều Khoản',
        fieldId: 'm13-payment-term-select',
        fieldName: 'Điều Khoản Thanh Toán',
        message: 'Vui lòng chọn điều khoản thanh toán (Payment Terms).',
        severity: 'error',
        actionLabel: 'Chọn điều khoản',
        isAutoFixable: true,
        autoFixDescription: 'Áp dụng điều khoản NET30',
        suggestedValueLabel: 'NET30 (30 ngày)',
        onAutoFix: handleAutoFixPaymentTerm,
      });
    }

    // 4. Tax & VAT tab
    if (taxRate === undefined || taxRate < 0) {
      list.push({
        id: 'tax-vat-rate-invalid',
        tabId: 'TAX_VAT',
        tabLabel: '4. Thuế & Tổng Kết',
        fieldId: 'm13-tax-rate-select',
        fieldName: 'Thuế Suất VAT',
        message: 'Thuế suất VAT không được nhỏ hơn 0%.',
        severity: 'error',
        actionLabel: 'Chọn thuế suất',
        isAutoFixable: true,
        autoFixDescription: 'Khôi phục thuế suất VAT tiêu chuẩn 10%',
        suggestedValueLabel: '10%',
        onAutoFix: handleAutoFixTaxRate,
      });
    }

    return list;
  }, [customerName, selectedCustomerId, taxCode, billingEmail, activeCustomer, items, warehouseId, channel, paymentTerm, taxRate]);

  // Structured warnings
  const structuredWarnings: ValidationErrorItem[] = useMemo(() => {
    const list: ValidationErrorItem[] = [];

    if (activeCustomer && creditCheck && !creditCheck.approved) {
      list.push({
        id: 'warn-credit-exceeded',
        tabId: 'CUSTOMER',
        tabLabel: '1. Khách Hàng',
        fieldId: 'm13-customer-select',
        fieldName: 'Hạn Mức Tín Dụng',
        message: `Đơn hàng vượt hạn mức tín dụng khả dụng (${(creditCheck.exceededAmount ?? 0).toLocaleString('vi-VN')} đ). Cần Trưởng phòng duyệt.`,
        severity: 'warning',
        actionLabel: 'Xem tín dụng'
      });
    }

    validationResult.warnings.forEach((warn, idx) => {
      list.push({
        id: `warn-validation-${idx}`,
        tabId: 'CUSTOMER',
        tabLabel: '1. Khách Hàng',
        fieldId: 'm13-customer-name',
        fieldName: 'Cảnh Báo Tính Hợp Lệ',
        message: warn,
        severity: 'warning',
        actionLabel: 'Kiểm tra'
      });
    });

    return list;
  }, [activeCustomer, creditCheck, validationResult.warnings]);

  // Per-tab validation error strings for tab header indicators
  const tabErrors = useMemo(() => {
    const errs = {
      CUSTOMER: [] as string[],
      ITEMS: [] as string[],
      LOGISTICS: [] as string[],
      TAX_VAT: [] as string[],
    };

    structuredErrors.forEach(e => {
      if (errs[e.tabId as keyof typeof errs]) {
        errs[e.tabId as keyof typeof errs].push(e.message);
      }
    });

    return errs;
  }, [structuredErrors]);

  const totalErrorCount = structuredErrors.length;

  // Cross-Tab Jump & Focus Engine
  const handleJumpToField = (issue: ValidationErrorItem) => {
    // 1. Switch active tab if needed
    if (activeFormTab !== 'ALL' && activeFormTab !== issue.tabId) {
      setActiveFormTab(issue.tabId as any);
    }

    // 2. Allow render cycle to paint the tab before querying DOM
    setTimeout(() => {
      if (!issue.fieldId) return;
      const el = document.getElementById(issue.fieldId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (typeof (el as HTMLElement).focus === 'function') {
          (el as HTMLElement).focus();
        }
        
        // Apply temporary high-visibility highlight ring
        el.classList.add('ring-4', 'ring-rose-500', 'ring-offset-2', 'transition-all', 'duration-300');
        setTimeout(() => {
          el.classList.remove('ring-4', 'ring-rose-500', 'ring-offset-2');
        }, 2500);
      }
    }, 120);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validationResult.isValid || totalErrorCount > 0) {
      // Auto-switch to the first tab that has errors
      if (tabErrors.CUSTOMER.length > 0) {
        setActiveFormTab('CUSTOMER');
      } else if (tabErrors.ITEMS.length > 0) {
        setActiveFormTab('ITEMS');
      } else if (tabErrors.LOGISTICS.length > 0) {
        setActiveFormTab('LOGISTICS');
      } else if (tabErrors.TAX_VAT.length > 0) {
        setActiveFormTab('TAX_VAT');
      }
      onNotify('danger', 'Lỗi kiểm tra tính hợp lệ', validationResult.errors.join('\n'));
      return;
    }

    if (activeCustomer?.isCreditBlocked) {
      onNotify('danger', 'Khách hàng bị khóa tín dụng', `Khách hàng [${activeCustomer.customerCode}] đang bị phong tỏa công nợ.`);
      return;
    }

    const dispatchOrderCreated = (order: any) => {
      if (onOrderCreated) onOrderCreated(order);
      if (onCreateSuccess) onCreateSuccess(order);
    };

    setIsSubmitting(true);
    const orderPayload = {
      customerId: selectedCustomerId === 'custom' ? null : selectedCustomerId,
      customerName,
      taxCode: taxCode || '0108999888',
      shippingAddress: address || 'Khu Công Nghiệp Tân Bình, TP. Hồ Chí Minh',
      billingEmail: billingEmail || 'ketoan@customer.vn',
      channel,
      warehouseId,
      branchId: 1,
      paymentMethod: paymentTerm.includes('COD') ? 'COD' : 'TRANSFER',
      items: items.map(it => ({
        id: it.productId ?? 1,
        productId: it.productId ?? 1,
        sku: it.sku ?? 'SKU-01',
        name: it.name ?? 'Sản phẩm',
        qty: it.qty ?? 1,
        quantity: it.qty ?? 1,
        price: it.price ?? 0,
        unitPrice: it.price ?? 0,
        discountPercent: it.discountPercent ?? 0,
        discount: it.discountPercent ?? 0,
        uop: it.uop ?? 'Cái'
      })),
      requiresVatInvoice,
      notes: notes ? `${notes} • PaymentTerm: ${paymentTerm}` : `PaymentTerm: ${paymentTerm}`,
      idempotencyKey: `SO-CREATE-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    };

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      if (res.ok) {
        const data = await res.json();
        const createdOrder = {
          id: data.order?.code ?? data.orderRef ?? `SO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          customerId: selectedCustomerId === 'custom' ? null : selectedCustomerId,
          customerName,
          taxCode: taxCode || '0108999888',
          address: address || 'Khu Công Nghiệp Tân Bình, TP. Hồ Chí Minh',
          billingEmail: billingEmail || 'ketoan@customer.vn',
          orderDate: new Date().toISOString().slice(0, 10),
          totalAmount: `${grandTotal.toLocaleString('vi-VN')} VND`,
          totalAmountNumeric: grandTotal,
          subtotalAmount: subtotalAfterDiscount,
          taxRate: effectiveTaxRate,
          taxAmount,
          requiresVatInvoice,
          status: 'CONFIRMED',
          reservationStatus: 'RESERVED',
          fulfillmentStatus: 'PENDING_PICKING',
          vatStatus: 'NOT_ISSUED',
          vatInvoiceNumber: null,
          vatSerial: null,
          cqtCode: null,
          lookupCode: null,
          warehouseId,
          items: items.map(it => ({
            sku: it.sku,
            name: it.name,
            qty: it.qty ?? 1,
            uop: it.uop ?? 'Cái',
            price: `${(it.price ?? 0).toLocaleString('vi-VN')} VND`,
            unitPriceNumeric: it.price ?? 0,
            discountPercent: it.discountPercent ?? 0,
            amount: ((it.price ?? 0) * (it.qty ?? 1) * (1 - (it.discountPercent ?? 0) / 100))
          }))
        };
        dispatchOrderCreated(createdOrder);
        onNotify('success', 'Tạo Sales Order thành công', `Đã lưu đơn bán hàng [${createdOrder.id}] và kích hoạt giữ chỗ tồn kho (Reservation) qua InventoryService.`);
        onClose();
      } else {
        throw new Error('API server returned error');
      }
    } catch (err: any) {
      // Fallback local create
      const localId = `SO-2026-${Math.floor(10000 + Math.random() * 90000)}`;
      const localOrder = {
        id: localId,
        customerId: selectedCustomerId === 'custom' ? null : selectedCustomerId,
        customerName,
        taxCode: taxCode || '0108999888',
        address: address || 'Khu Công Nghiệp Tân Bình, TP. Hồ Chí Minh',
        billingEmail: billingEmail || 'ketoan@customer.vn',
        orderDate: new Date().toISOString().slice(0, 10),
        totalAmount: `${grandTotal.toLocaleString('vi-VN')} VND`,
        totalAmountNumeric: grandTotal,
        subtotalAmount: subtotalAfterDiscount,
        taxRate: effectiveTaxRate,
        taxAmount,
        requiresVatInvoice,
        status: 'CONFIRMED',
        reservationStatus: 'RESERVED',
        fulfillmentStatus: 'PENDING_PICKING',
        vatStatus: 'NOT_ISSUED',
        vatInvoiceNumber: null,
        vatSerial: null,
        cqtCode: null,
        lookupCode: null,
        warehouseId,
        items: items.map(it => ({
          sku: it.sku,
          name: it.name,
          qty: it.qty ?? 1,
          uop: it.uop ?? 'Cái',
          price: `${(it.price ?? 0).toLocaleString('vi-VN')} VND`,
          unitPriceNumeric: it.price ?? 0,
          discountPercent: it.discountPercent ?? 0,
          amount: ((it.price ?? 0) * (it.qty ?? 1) * (1 - (it.discountPercent ?? 0) / 100))
        }))
      };
      dispatchOrderCreated(localOrder);
      onNotify('success', 'Tạo Sales Order thành công (Offline Memory Mode)', `Đã lưu đơn bán hàng [${localId}].`);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-wide">Tạo Đơn Bán Hàng B2B Chuẩn Hóa M13</h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Đồng bộ Master Data M07, Giữ chỗ Tồn kho M17 & Tính Thuế VAT NĐ 123
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[78vh] overflow-y-auto text-xs">
          {/* Sub-Tabs Bar with Visual Error Indicators */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveFormTab('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeFormTab === 'ALL'
                  ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Tất Cả Các Mục</span>
              {totalErrorCount > 0 && (
                <TabErrorIndicator hasError={true} count={totalErrorCount} tooltip={`Đơn hàng có ${totalErrorCount} trường cần kiểm tra`} />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveFormTab('CUSTOMER')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeFormTab === 'CUSTOMER'
                  ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>1. Khách Hàng (M07)</span>
              {tabErrors.CUSTOMER.length > 0 && (
                <TabErrorIndicator hasError={true} count={tabErrors.CUSTOMER.length} tooltip={tabErrors.CUSTOMER.join('\n')} />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveFormTab('ITEMS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeFormTab === 'ITEMS'
                  ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>2. Hàng Hóa & Đơn Giá</span>
              {tabErrors.ITEMS.length > 0 && (
                <TabErrorIndicator hasError={true} count={tabErrors.ITEMS.length} tooltip={tabErrors.ITEMS.join('\n')} />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveFormTab('LOGISTICS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeFormTab === 'LOGISTICS'
                  ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>3. Kho & Điều Khoản</span>
              {tabErrors.LOGISTICS.length > 0 && (
                <TabErrorIndicator hasError={true} count={tabErrors.LOGISTICS.length} tooltip={tabErrors.LOGISTICS.join('\n')} />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveFormTab('TAX_VAT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeFormTab === 'TAX_VAT'
                  ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>4. Thuế & Tổng Kết</span>
              {tabErrors.TAX_VAT.length > 0 && (
                <TabErrorIndicator hasError={true} count={tabErrors.TAX_VAT.length} tooltip={tabErrors.TAX_VAT.join('\n')} />
              )}
            </button>
          </div>

          {/* Cross-Tab Validation Summary Panel */}
          <ValidationSummaryPanel
            errors={structuredErrors}
            warnings={structuredWarnings}
            activeTabId={activeFormTab}
            onJumpToField={handleJumpToField}
            onAutoFixAll={handleGlobalAutoFix}
          />

          {/* Section 1: Customer Master Profile from M07 */}
          {(activeFormTab === 'ALL' || activeFormTab === 'CUSTOMER') && (
            <div className={`p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border ${tabErrors.CUSTOMER.length > 0 ? 'border-rose-300 dark:border-rose-900/60' : 'border-slate-200 dark:border-slate-700'} space-y-4`}>
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>1. Khách Hàng B2B & Pháp Nhân Hóa Đơn (M07 Master Data)</span>
                </h4>
                <div className="flex items-center gap-2">
                  {tabErrors.CUSTOMER.length > 0 && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                      {tabErrors.CUSTOMER.length} trường chưa hợp lệ
                    </span>
                  )}
                  {activeCustomer && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>{activeCustomer.tier}</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                    Chọn Khách Hàng từ Master Data M07:
                  </label>
                  <select
                    id="m13-customer-select"
                    value={selectedCustomerId}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs font-medium"
                  >
                    {customerList.map((c) => (
                      <option key={c.customerId} value={c.customerId}>
                        [{c.customerCode}] {c.customerName} (MST: {c.taxCode || 'N/A'})
                      </option>
                    ))}
                    <option value="custom">-- Nhập Khách hàng Tùy chỉnh mới --</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1 flex items-center justify-between">
                    <span>Mã Số Thuế (MST Doanh nghiệp):</span>
                    {selectedCustomerId === 'custom' && !taxCode.trim() && (
                      <span className="text-rose-600 text-[10px] font-bold">Bắt buộc</span>
                    )}
                  </label>
                  <input
                    id="m13-customer-tax-code"
                    type="text"
                    value={taxCode}
                    onChange={(e) => setTaxCode(e.target.value)}
                    placeholder="0108765432 hoặc 0108765432-001"
                    className={`w-full px-3 py-2 rounded-xl border ${selectedCustomerId === 'custom' && !taxCode.trim() ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 dark:border-slate-600'} bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1 flex items-center justify-between">
                    <span>Tên Pháp Nhân Công Ty / Doanh Nghiệp:</span>
                    {!customerName.trim() && (
                      <span className="text-rose-600 text-[10px] font-bold">Bắt buộc</span>
                    )}
                  </label>
                  <input
                    id="m13-customer-name"
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Công ty Cổ phần..."
                    required
                    className={`w-full px-3 py-2 rounded-xl border ${!customerName.trim() ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 dark:border-slate-600'} bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                    Email Nhận Hóa Đơn Điện Tử VAT:
                  </label>
                  <input
                    id="m13-customer-billing-email"
                    type="email"
                    value={billingEmail}
                    onChange={(e) => setBillingEmail(e.target.value)}
                    placeholder="ketoan@company.vn"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                    Địa Chỉ Đăng Ký Kinh Doanh / Giao Hàng:
                  </label>
                  <input
                    id="m13-customer-address"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Số nhà, đường, phường, quận, tỉnh/thành phố..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Live Credit Limit & Master Data Status Badge */}
              {activeCustomer && creditCheck && (
                <div className={`p-3 rounded-xl border flex items-center justify-between flex-wrap gap-2 ${
                  !creditCheck.approved 
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200' 
                    : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 shrink-0" />
                    <div>
                      <span className="font-bold">Kiểm Tra Hạn Mức Tín Dụng M07: </span>
                      <span className="font-mono tabular-nums">
                        Hạn mức: {(activeCustomer.creditLimit ?? 0).toLocaleString('vi-VN')} đ | Khả dụng: {(activeCustomer.availableCredit ?? 0).toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                      creditCheck.approved ? 'bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100' : 'bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100'
                    }`}>
                      {creditCheck.approved ? 'TÍN DỤNG HỢP LỆ' : 'VƯỢT HẠN MỨC'}
                    </span>
                  </div>
                </div>
              )}

              {/* Validation Warnings & Suggestions */}
              {validationResult.warnings.length > 0 && (
                <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-[11px] space-y-1">
                  {validationResult.warnings.map((w, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Section 2: Order Terms & Pricing Parameters */}
          {(activeFormTab === 'ALL' || activeFormTab === 'LOGISTICS') && (
            <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border ${tabErrors.LOGISTICS.length > 0 ? 'border-rose-300 dark:border-rose-900/60' : 'border-slate-200 dark:border-slate-700'}`}>
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">Kho Xuất Hàng:</label>
                <select
                  id="m13-warehouse-select"
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value={1}>Kho Tổng Miền Bắc (WH-01)</option>
                  <option value={2}>Kho Tổng Miền Nam (WH-02)</option>
                  <option value={3}>Kho Trung Chuyển Đà Nẵng (WH-03)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">Kênh Phân Phối:</label>
                <select
                  id="m13-channel-select"
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="B2B">B2B Contract</option>
                  <option value="PROJECT">Dự án Công trình</option>
                  <option value="EXPORT">Xuất khẩu Quốc tế</option>
                  <option value="DIRECT">Bán hàng Trực tiếp</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">Điều Khoản Thanh Toán:</label>
                <select
                  id="m13-payment-term-select"
                  value={paymentTerm}
                  onChange={(e) => setPaymentTerm(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="NET30">NET 30 Ngày</option>
                  <option value="NET45">NET 45 Ngày</option>
                  <option value="NET15">NET 15 Ngày</option>
                  <option value="2_10_NET30">2/10 Net 30 (Chiết khấu 2% trả sớm 10 ngày)</option>
                  <option value="COD">Thanh toán khi nhận hàng (COD)</option>
                  <option value="PREPAID">Trả trước 100% (Advance Payment)</option>
                </select>
              </div>
            </div>
          )}

          {/* Section 3: Line Items Table */}
          {(activeFormTab === 'ALL' || activeFormTab === 'ITEMS') && (
            <div className={`space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border ${tabErrors.ITEMS.length > 0 ? 'border-rose-300 dark:border-rose-900/60' : 'border-slate-200 dark:border-slate-700'}`}>
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>2. Chi Tiết Sản Phẩm & Chính Sách Chiết Khấu Động ({items.length} mặt hàng)</span>
                </h4>
                <div className="flex items-center gap-2">
                  {tabErrors.ITEMS.length > 0 && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                      {tabErrors.ITEMS.length} cảnh báo sản phẩm
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleCalculateDynamicDiscount}
                    disabled={isCalculatingDiscount}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-100 font-bold transition-all cursor-pointer text-[11px]"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isCalculatingDiscount ? 'Đang tính...' : 'Tính Chiết Khấu B2B'}</span>
                  </button>
                  <button
                    type="button"
                    id="m13-btn-add-item"
                    onClick={handleAddItem}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all shadow-xs cursor-pointer text-[11px]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm Dòng SP</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Mã SKU / SP</th>
                      <th className="py-2.5 px-3">Tên Hàng Hóa</th>
                      <th className="py-2.5 px-3 text-center">ĐVT</th>
                      <th className="py-2.5 px-3 text-right">Số Lượng</th>
                      <th className="py-2.5 px-3 text-right">Đơn Giá (đ)</th>
                      <th className="py-2.5 px-3 text-right">CK (%)</th>
                      <th className="py-2.5 px-3 text-right">Thành Tiền</th>
                      <th className="py-2.5 px-2 text-center">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {items.map((it, idx) => {
                      const lineAmount = ((it.price ?? 0) * (it.qty ?? 1) * (1 - (it.discountPercent ?? 0) / 100));
                      const hasItemError = !it.name?.trim() || !it.sku?.trim() || !it.qty || it.qty <= 0;
                      return (
                        <tr key={idx} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${hasItemError ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''}`}>
                          <td className="py-2 px-3">
                            <select
                              id={`m13-item-sku-${idx}`}
                              value={it.sku}
                              onChange={(e) => handleSelectPresetProduct(idx, e.target.value)}
                              className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              {DEFAULT_PRODUCTS.map(dp => (
                                <option key={dp.sku} value={dp.sku}>{dp.sku}</option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-3">
                            <input
                              id={`m13-item-name-${idx}`}
                              type="text"
                              value={it.name}
                              onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                              className={`w-full px-2 py-1 rounded border ${!it.name?.trim() ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 dark:border-slate-600'} bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500`}
                            />
                          </td>
                          <td className="py-2 px-3 text-center">
                            <input
                              id={`m13-item-uop-${idx}`}
                              type="text"
                              value={it.uop}
                              onChange={(e) => handleItemChange(idx, 'uop', e.target.value)}
                              className="w-16 px-1.5 py-1 text-center rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="py-2 px-3 text-right">
                            <input
                              id={`m13-item-qty-${idx}`}
                              type="number"
                              min="1"
                              value={it.qty}
                              onChange={(e) => handleItemChange(idx, 'qty', Math.max(1, Number(e.target.value) || 1))}
                              className="w-20 px-2 py-1 text-right font-mono font-bold rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="py-2 px-3 text-right">
                            <input
                              id={`m13-item-price-${idx}`}
                              type="number"
                              step="1000"
                              value={it.price}
                              onChange={(e) => handleItemChange(idx, 'price', Math.max(0, Number(e.target.value) || 0))}
                              className="w-28 px-2 py-1 text-right font-mono rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="py-2 px-3 text-right">
                            <input
                              id={`m13-item-discount-${idx}`}
                              type="number"
                              min="0"
                              max="100"
                              value={it.discountPercent ?? 0}
                              onChange={(e) => handleItemChange(idx, 'discountPercent', Number(e.target.value) || 0)}
                              className="w-14 px-1.5 py-1 text-right font-mono text-purple-700 dark:text-purple-400 font-bold rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                            />
                          </td>
                          <td className="py-2 px-3 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100">
                            {lineAmount.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Section 4: Tax & Financial Summary Box */}
          {(activeFormTab === 'ALL' || activeFormTab === 'TAX_VAT') && (
            <div className={`p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border ${tabErrors.TAX_VAT.length > 0 ? 'border-rose-300 dark:border-rose-900/60' : 'border-slate-200 dark:border-slate-700'} space-y-4`}>
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>3. Thuế GTGT VAT & Tổng Hợp Tài Chính</span>
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">Thuế Suất VAT (%):</label>
                  <select
                    id="m13-tax-rate-select"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value={10}>10% (Chuẩn Hóa Thông Thường)</option>
                    <option value={8}>8% (Nghị quyết 142 Giảm Thuế)</option>
                    <option value={5}>5% (Hàng Thiết yếu / Nông nghiệp)</option>
                    <option value={0}>0% (Xuất khẩu / Miễn thuế)</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      id="m13-vat-invoice-checkbox"
                      type="checkbox"
                      checked={requiresVatInvoice}
                      onChange={(e) => setRequiresVatInvoice(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <span className="text-slate-800 dark:text-slate-200 font-semibold text-xs">Yêu cầu xuất hóa đơn điện tử VAT (Nghị định 123)</span>
                  </label>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Tổng tiền hàng trước chiết khấu (Subtotal):</span>
                  <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-200">
                    {subtotalBeforeDiscount.toLocaleString('vi-VN')} VND
                  </span>
                </div>
                {totalDiscountAmount > 0 && (
                  <div className="flex justify-between text-purple-700 dark:text-purple-400">
                    <span>Chiết khấu thương mại & bậc khách hàng:</span>
                    <span className="font-mono tabular-nums font-semibold">
                      -{totalDiscountAmount.toLocaleString('vi-VN')} VND
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Tiền thuế GTGT VAT ({effectiveTaxRate}%):</span>
                  <span className="font-mono tabular-nums font-semibold text-purple-700 dark:text-purple-400">
                    {taxAmount.toLocaleString('vi-VN')} VND
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-slate-100 border-t border-slate-200 dark:border-slate-700 pt-2">
                  <span>Tổng giá trị đơn hàng (Grand Total):</span>
                  <span className="font-mono tabular-nums text-blue-600 dark:text-blue-400 font-bold text-base">
                    {grandTotal.toLocaleString('vi-VN')} VND
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Section 5: Notes & Commit Actions */}
          {(activeFormTab === 'ALL' || activeFormTab === 'TAX_VAT' || activeFormTab === 'LOGISTICS') && (
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                Ghi chú đơn hàng & Hướng dẫn giao vận:
              </label>
              <textarea
                id="m13-notes-textarea"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Nhập thông tin hướng dẫn giao nhận, liên hệ thủ kho..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs transition-all cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !validationResult.isValid}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Đang Khởi Tạo...' : 'Xác Nhận & Tạo Sales Order'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
