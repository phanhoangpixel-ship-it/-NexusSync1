import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  M07CustomerMasterProfile,
  M07CustomerCreditCheckResult,
  M13IntegratedSalesOrder,
  M16PosOrderPayload
} from '../types/salesOrderIntegration';
import { SalesOrderSyncService, SalesOrderCustomerValidationResult } from '../services/SalesOrderSyncService';
import { normalizeSalesOrder, safeNumber } from '../utils/salesOrderDataNormalizer';

// Default Fallback M07 Customers for instant offline-safe experience
export const DEFAULT_M07_CUSTOMERS: M07CustomerMasterProfile[] = [
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
    billingAddress: 'Tầng 12, Tòa nhà Keangnam Landmark 72, Nam Từ Liêm, Hà Nội',
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
    billingAddress: 'KCN Quế Võ 1, TP. Bắc Ninh, Tỉnh Bắc Ninh',
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
    billingAddress: 'Số 45 Đường Hoàng Diệu, Quận 4, TP. Hồ Chí Minh',
    creditLimit: 500000000,
    availableCredit: 380000000,
    outstandingBalance: 120000000,
    paymentTermsDays: 15,
    defaultDiscountPercent: 0,
    isCreditBlocked: false
  },
  {
    customerId: 4,
    customerCode: 'CUST-B2B-004',
    customerName: 'Tổng công ty Dệt May Sài Gòn',
    companyName: 'Tổng công ty Dệt May Sài Gòn',
    taxCode: '0301122334',
    tier: 'VIP_GOLD',
    email: 'dang.ph@saigontextile.vn',
    billingEmail: 'ketoan@saigontextile.vn',
    phone: '0934556677',
    address: 'Số 188 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    billingAddress: 'Số 188 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    creditLimit: 1500000000,
    availableCredit: 900000000,
    outstandingBalance: 600000000,
    paymentTermsDays: 30,
    defaultDiscountPercent: 2,
    isCreditBlocked: false
  }
];

export interface UseSalesOrderSyncOptions {
  autoSync?: boolean;
  syncIntervalMs?: number;
}

export function useSalesOrderSync(options: UseSalesOrderSyncOptions = {}) {
  const { autoSync = true, syncIntervalMs = 30000 } = options;

  const [customers, setCustomers] = useState<M07CustomerMasterProfile[]>(DEFAULT_M07_CUSTOMERS);
  const [posOrders, setPosOrders] = useState<any[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState<boolean>(false);
  const [isLoadingPos, setIsLoadingPos] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [syncErrors, setSyncErrors] = useState<string[]>([]);

  // Fast O(1) Lookups
  const customerMap = useMemo(() => {
    const map = new Map<number, M07CustomerMasterProfile>();
    customers.forEach((c) => map.set(c.customerId, c));
    return map;
  }, [customers]);

  const customerCodeMap = useMemo(() => {
    const map = new Map<string, M07CustomerMasterProfile>();
    customers.forEach((c) => map.set(c.customerCode.toUpperCase(), c));
    return map;
  }, [customers]);

  /**
   * Fetch and Normalize M07 Customer Master Data from `/api/customers`
   */
  const fetchCustomers = useCallback(async (): Promise<M07CustomerMasterProfile[]> => {
    setIsLoadingCustomers(true);
    try {
      const res = await fetch('/api/customers');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const formatted: M07CustomerMasterProfile[] = data.map((raw: any) => {
            const rawLimit = safeNumber(raw.creditLimit, 1000000000);
            const rawOutstanding = safeNumber(raw.outstandingBalance ?? raw.creditUsed, 0);
            const availableCredit = Math.max(0, rawLimit - rawOutstanding);
            const isBlocked = Boolean(raw.isCreditBlocked || raw.status === 'BLOCKED' || raw.status === 'INACTIVE');

            let tier: 'STANDARD' | 'VIP_SILVER' | 'VIP_GOLD' | 'VIP_DIAMOND' | 'ENTERPRISE' = 'STANDARD';
            const rawTier = (raw.tier || raw.customerTier || raw.customerGroup || '').toUpperCase();
            if (rawTier.includes('DIAMOND')) tier = 'VIP_DIAMOND';
            else if (rawTier.includes('GOLD')) tier = 'VIP_GOLD';
            else if (rawTier.includes('SILVER')) tier = 'VIP_SILVER';
            else if (rawTier.includes('ENTERPRISE')) tier = 'ENTERPRISE';

            return {
              customerId: Number(raw.id ?? raw.customerId),
              customerCode: raw.code ?? raw.customerCode ?? `CUST-${String(raw.id).padStart(3, '0')}`,
              customerName: raw.name ?? raw.customerName ?? 'Khách hàng',
              companyName: raw.companyName ?? raw.name ?? raw.customerName,
              taxCode: raw.taxCode ?? raw.tax_code ?? '',
              tier,
              email: raw.email ?? '',
              billingEmail: raw.billingEmail ?? raw.billing_email ?? raw.email ?? '',
              phone: raw.phone ?? '',
              address: raw.address ?? '',
              billingAddress: raw.billingAddress ?? raw.address ?? '',
              creditLimit: rawLimit,
              availableCredit,
              outstandingBalance: rawOutstanding,
              paymentTermsDays: raw.paymentTermsDays ?? 30,
              defaultDiscountPercent: raw.defaultDiscountPercent ?? 0,
              isCreditBlocked: isBlocked,
              status: raw.status ?? 'ACTIVE'
            };
          });

          // Merge with default dataset to ensure zero missing demo entries
          const existingIds = new Set(formatted.map(c => c.customerId));
          const combined = [...formatted];
          for (const def of DEFAULT_M07_CUSTOMERS) {
            if (!existingIds.has(def.customerId)) {
              combined.push(def);
            }
          }

          setCustomers(combined);
          return combined;
        }
      }
    } catch (err: any) {
      console.warn('M07 Customers fetch failed, using memory master profile:', err);
    } finally {
      setIsLoadingCustomers(false);
    }
    return DEFAULT_M07_CUSTOMERS;
  }, []);

  /**
   * Fetch POS Omnichannel Orders from `/api/sales/omnichannel`
   */
  const fetchPosOrders = useCallback(async (): Promise<any[]> => {
    setIsLoadingPos(true);
    try {
      const res = await fetch('/api/sales/omnichannel');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setPosOrders(data);
          return data;
        }
      }
    } catch (err: any) {
      console.warn('M16 POS fetch failed:', err);
    } finally {
      setIsLoadingPos(false);
    }
    return [];
  }, []);

  /**
   * Complete Cross-Module Sync (M07 + M16 -> M13)
   */
  const syncAll = useCallback(async () => {
    setIsSyncing(true);
    const errors: string[] = [];

    try {
      const [fetchedCusts, fetchedPos] = await Promise.all([
        fetchCustomers(),
        fetchPosOrders()
      ]);

      // Reconcile POS orders against customers
      const normalizedPosOrders: M13IntegratedSalesOrder[] = [];
      fetchedPos.forEach((posItem: any) => {
        try {
          const recon = SalesOrderSyncService.reconcilePosOrder(posItem, fetchedCusts);
          normalizedPosOrders.push(recon.normalizedOrder);
        } catch (e: any) {
          errors.push(`POS Reconcile error (${posItem.orderId || 'N/A'}): ${e.message}`);
        }
      });

      setLastSyncedAt(new Date());
      setSyncErrors(errors);

      return {
        customers: fetchedCusts,
        posOrders: fetchedPos,
        normalizedPosOrders
      };
    } catch (err: any) {
      errors.push(err.message || 'Lỗi đồng bộ tổng thể');
      setSyncErrors(errors);
      throw err;
    } finally {
      setIsSyncing(false);
    }
  }, [fetchCustomers, fetchPosOrders]);

  /**
   * Validate a sales order against customer master data
   */
  const validateOrder = useCallback(
    (order: Partial<M13IntegratedSalesOrder>): SalesOrderCustomerValidationResult => {
      return SalesOrderSyncService.validateOrderConsistency(order, customers);
    },
    [customers]
  );

  /**
   * Check Credit Limit for a customer
   */
  const checkCredit = useCallback(
    (customerOrId: M07CustomerMasterProfile | number, amount: number): M07CustomerCreditCheckResult => {
      let cust: M07CustomerMasterProfile | undefined;
      if (typeof customerOrId === 'number') {
        cust = customerMap.get(customerOrId);
      } else {
        cust = customerOrId;
      }

      if (!cust) {
        return {
          approved: false,
          customerId: typeof customerOrId === 'number' ? customerOrId : 0,
          customerName: 'Không xác định',
          creditLimit: 0,
          currentOutstanding: 0,
          newOrderAmount: amount,
          availableCreditAfterOrder: -amount,
          exceededAmount: amount,
          reason: 'Không tìm thấy hồ sơ khách hàng trong Master Data M07.'
        };
      }

      return SalesOrderSyncService.checkCustomerCredit(cust, amount);
    },
    [customerMap]
  );

  /**
   * Match/find customer from M07
   */
  const findCustomer = useCallback(
    (query: { id?: number; code?: string; taxCode?: string; name?: string; email?: string }) => {
      return SalesOrderSyncService.matchCustomer(query, customers);
    },
    [customers]
  );

  // Initial Auto-Sync & Periodic sync
  useEffect(() => {
    if (autoSync) {
      syncAll();
      const interval = setInterval(() => {
        syncAll();
      }, syncIntervalMs);
      return () => clearInterval(interval);
    }
  }, [autoSync, syncIntervalMs, syncAll]);

  return {
    customers,
    posOrders,
    isLoadingCustomers,
    isLoadingPos,
    isSyncing,
    lastSyncedAt,
    syncErrors,
    customerMap,
    customerCodeMap,
    fetchCustomers,
    fetchPosOrders,
    syncAll,
    validateOrder,
    checkCredit,
    findCustomer
  };
}
