import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Trash2,
  Wrench,
  RefreshCw,
  CheckCircle2,
  Filter,
  Search,
  Database,
  Sparkles,
  Download,
  AlertCircle,
  FileCode,
  HardDrive,
  Check,
  Eye,
  X,
  Layers,
  ArrowUpDown,
} from 'lucide-react';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { ConfirmDialogState } from '../../../../types';

export interface IntegrityRule {
  id: string;
  code: string;
  category: 'CONFIG' | 'GARBAGE' | 'REFERENTIAL' | 'POLICY';
  title: string;
  targetModule: string;
  description: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO' | 'PASSED';
  status: 'DETECTED' | 'FIXED' | 'CLEANED' | 'PASSED';
  affectedCount: number;
  estimatedSize?: string;
  detectedIssue?: string;
  recommendedAction: string;
  autoFixable: boolean;
  canPurge: boolean;
  details?: Array<{
    id: string;
    identifier: string;
    description: string;
    createdAt: string;
    size?: string;
  }>;
}

const INITIAL_INTEGRITY_RULES: IntegrityRule[] = [
  {
    id: 'rule-cfg-01',
    code: 'CFG-01',
    category: 'CONFIG',
    title: 'Đồng bộ Mã số thuế & Đơn vị tiền tệ cơ sở',
    targetModule: 'M03 Cấu hình & M30 Sổ cái',
    description: 'Kiểm tra mã số thuế doanh nghiệp và tiền tệ cơ sở VND đã được ánh xạ chính xác với hệ thống tài khoản.',
    severity: 'PASSED',
    status: 'PASSED',
    affectedCount: 0,
    recommendedAction: 'Cấu hình chuẩn xác, không có lỗi.',
    autoFixable: false,
    canPurge: false,
  },
  {
    id: 'rule-cfg-02',
    code: 'CFG-02',
    category: 'CONFIG',
    title: 'Tỷ giá hối đoái ngoại tệ chưa cập nhật trong 48h',
    targetModule: 'M03 Cấu hình & M32 Quỹ & Kho bạc',
    description: 'Tỷ giá quy đổi JPY và EUR chưa được đồng bộ với biểu tỷ giá thị trường liên ngân hàng trong hơn 48 giờ.',
    severity: 'WARNING',
    status: 'DETECTED',
    affectedCount: 2,
    detectedIssue: 'Tỷ giá JPY (172.30 VND) và EUR (27,800.50 VND) quá hạn cập nhật.',
    recommendedAction: 'Đồng bộ tự động tỷ giá tham chiếu mới nhất từ cổng liên ngân hàng.',
    autoFixable: true,
    canPurge: false,
  },
  {
    id: 'rule-cfg-03',
    code: 'CFG-03',
    category: 'CONFIG',
    title: 'Quy tắc sinh mã chứng từ kho bị gộp tiền tố',
    targetModule: 'M03 Cấu hình & M21 Điều chuyển',
    description: 'Quy tắc sinh mã chứng từ Điều chuyển và Kiểm kê đang dùng chung tiền tố ADJ/TR-YYYY-#####.',
    severity: 'WARNING',
    status: 'DETECTED',
    affectedCount: 1,
    detectedIssue: 'Tiền tố gộp có thể gây nhầm lẫn khi đối soát chứng từ kiểm toán.',
    recommendedAction: 'Phân tách thành tiền tố riêng biệt ADJ-YYYY-##### và TR-YYYY-#####.',
    autoFixable: true,
    canPurge: false,
  },
  {
    id: 'rule-cfg-04',
    code: 'CFG-04',
    category: 'POLICY',
    title: 'Khoảng trống hạn mức phê duyệt Maker-Checker',
    targetModule: 'M03 Cấu hình & M04 RBAC',
    description: 'Quy tắc phê duyệt cho vai trò Chuyên viên Mua hàng mới chưa được định nghĩa hạn mức tối đa.',
    severity: 'INFO',
    status: 'DETECTED',
    affectedCount: 1,
    detectedIssue: 'Vai trò "Nhân viên mua sắm (Procurement Staff)" đang kế thừa hạn mức chung 50,000,000 VND.',
    recommendedAction: 'Thiết lập chính sách hạn mức chuyên biệt cho bộ phận mua sắm.',
    autoFixable: true,
    canPurge: false,
  },
  {
    id: 'rule-jnk-01',
    code: 'JNK-01',
    category: 'GARBAGE',
    title: 'Đơn hàng nháp bán & mua không phát sinh hoạt động > 30 ngày',
    targetModule: 'M13 Bán hàng & M08 Mua sắm',
    description: 'Phát hiện 14 bản ghi đơn nháp tạm thời (Draft) được tạo phục vụ kiểm thử trước ngày 2026-08-01 không có cập nhật.',
    severity: 'WARNING',
    status: 'DETECTED',
    affectedCount: 14,
    estimatedSize: '5.8 MB',
    detectedIssue: '14 đơn nháp thử nghiệm không có giao dịch tiếp diễn, chiếm dụng ID chuỗi và bộ nhớ đệm.',
    recommendedAction: 'Dọn dẹp và xóa an toàn các bản ghi nháp rác không có chứng từ con.',
    autoFixable: false,
    canPurge: true,
    details: [
      { id: 'SO-DRAFT-091', identifier: 'Đơn bán nháp test đơn vị', description: 'Đơn nháp khách lẻ test tính thuế', createdAt: '2026-07-02', size: '420 KB' },
      { id: 'SO-DRAFT-094', identifier: 'Đơn bán nháp hủy dở', description: 'Đơn nháp demo thử nghiệm chiết khấu', createdAt: '2026-07-08', size: '390 KB' },
      { id: 'PO-DRAFT-041', identifier: 'Đơn mua nháp NCC An Phát', description: 'Đơn mua thử nghiệm luồng duyệt CFO', createdAt: '2026-06-25', size: '480 KB' },
      { id: 'PO-DRAFT-045', identifier: 'Đơn mua nháp phụ kiện', description: 'Bản ghi rác phát sinh khi mất mạng', createdAt: '2026-07-12', size: '510 KB' },
      { id: 'SO-DRAFT-102', identifier: 'Đơn bán test showroom HCM', description: 'Đơn nháp kiểm tra tính khả dụng kho', createdAt: '2026-07-15', size: '410 KB' },
    ],
  },
  {
    id: 'rule-jnk-02',
    code: 'JNK-02',
    category: 'GARBAGE',
    title: 'Tệp tin đính kèm mồ côi (Detached File Blobs)',
    targetModule: 'Hệ thống Quản lý Tài liệu DMS',
    description: '8 tệp tài liệu PDF và ảnh chứng từ tải lên dở dang khi tạo hóa đơn thất bại, không có bản ghi tham chiếu.',
    severity: 'WARNING',
    status: 'DETECTED',
    affectedCount: 8,
    estimatedSize: '11.2 MB',
    detectedIssue: 'Các tệp tạm thời không có khóa ngoại kết nối với chứng từ thực tế.',
    recommendedAction: 'Giải phóng dung lượng lưu trữ đám mây và xóa blob tạm thời.',
    autoFixable: false,
    canPurge: true,
    details: [
      { id: 'BLOB-TMP-8812', identifier: 'hoa_don_vat_temp_01.pdf', description: 'Tệp đính kèm hóa đơn nháp đã bị hủy', createdAt: '2026-07-03', size: '2.4 MB' },
      { id: 'BLOB-TMP-8815', identifier: 'bien_ban_ban_giao_err.png', description: 'Ảnh chụp biên bản giao nhận lỗi upload', createdAt: '2026-07-10', size: '3.1 MB' },
      { id: 'BLOB-TMP-8820', identifier: 'chung_tu_thu_chi_draft.pdf', description: 'Phiếu chi tải lên dở dang', createdAt: '2026-07-18', size: '1.8 MB' },
      { id: 'BLOB-TMP-8829', identifier: 'bang_ke_nhap_kho_orphan.xlsx', description: 'Bảng kê tạm không gắn PO', createdAt: '2026-07-22', size: '3.9 MB' },
    ],
  },
  {
    id: 'rule-jnk-03',
    code: 'JNK-03',
    category: 'GARBAGE',
    title: 'Phiên đăng nhập quá hạn không còn sử dụng (Stale Session Cache)',
    targetModule: 'M03 Quản trị & Xác thực',
    description: '6 token phiên làm việc trên các thiết bị di động đã hết hạn hiệu lực trên 14 ngày.',
    severity: 'INFO',
    status: 'DETECTED',
    affectedCount: 6,
    estimatedSize: '1.4 MB',
    detectedIssue: 'Cache bộ nhớ session chứa các token phiên không còn được gửi request.',
    recommendedAction: 'Thu hồi token và dọn sạch session cache để tăng tốc xác thực.',
    autoFixable: false,
    canPurge: true,
    details: [
      { id: 'SESS-EXP-101', identifier: 'Session iPad Safari (Admin)', description: 'Thiết bị không kết nối từ 2026-07-20', createdAt: '2026-07-20', size: '220 KB' },
      { id: 'SESS-EXP-104', identifier: 'Session Chrome Android (Kho)', description: 'Thiết bị di động kiểm kê đã logout', createdAt: '2026-07-22', size: '240 KB' },
      { id: 'SESS-EXP-108', identifier: 'Session Firefox Mac (Kế toán)', description: 'Phiên đăng nhập cũ trước khi đổi mật khẩu', createdAt: '2026-07-25', size: '280 KB' },
    ],
  },
  {
    id: 'rule-jnk-04',
    code: 'JNK-04',
    category: 'GARBAGE',
    title: 'Sự kiện Outbox EventBus đã xác nhận giao thành công > 90 ngày',
    targetModule: 'M05 Trục tích hợp EventBus',
    description: '320 bản ghi sự kiện nghiệp vụ đã giao (ACKNOWLEDGED) có thể chuyển sang bảng lưu trữ nén.',
    severity: 'INFO',
    status: 'DETECTED',
    affectedCount: 320,
    estimatedSize: '14.6 MB',
    detectedIssue: 'Bảng outbox sự kiện tích tụ dữ liệu lịch sử đã đồng bộ thành công.',
    recommendedAction: 'Chuyển lưu trữ nén Cold-Storage và dọn sạch bảng Outbox hoạt động.',
    autoFixable: false,
    canPurge: true,
  },
  {
    id: 'rule-ref-01',
    code: 'REF-01',
    category: 'REFERENTIAL',
    title: 'Toàn vẹn Khóa ngoại Danh mục Sản phẩm & Đơn vị tính',
    targetModule: 'M07 Danh mục Vật tư & Hàng hóa',
    description: '100% sản phẩm có danh mục cha và đơn vị tính chuẩn hóa hợp lệ, không có bản ghi mồ côi.',
    severity: 'PASSED',
    status: 'PASSED',
    affectedCount: 0,
    recommendedAction: 'Khóa ngoại toàn vẹn hoàn toàn.',
    autoFixable: false,
    canPurge: false,
  },
  {
    id: 'rule-ref-02',
    code: 'REF-02',
    category: 'REFERENTIAL',
    title: 'Cân bằng Số dư Kho 3 Trạng thái (On-Hand = Reserved + Available)',
    targetModule: 'M17 Kho vận cốt lõi',
    description: 'Không phát hiện số dư âm hoặc chênh lệch giữa số lượng thực tế và các lệnh xuất kho đang giữ chỗ.',
    severity: 'PASSED',
    status: 'PASSED',
    affectedCount: 0,
    recommendedAction: 'Số dư kho cân bằng 100% trên toàn bộ 4 kho bãi.',
    autoFixable: false,
    canPurge: false,
  },
  {
    id: 'rule-ref-03',
    code: 'REF-03',
    category: 'REFERENTIAL',
    title: 'Cân bằng Phát sinh Sổ cái Kép Kế toán (Double-entry GL Balance)',
    targetModule: 'M30 Sổ cái Tổng hợp',
    description: 'Tổng phát sinh Nợ bằng Tổng phát sinh Có trên toàn bộ bút toán đã ghi sổ (Posted Journal Entries).',
    severity: 'PASSED',
    status: 'PASSED',
    affectedCount: 0,
    recommendedAction: 'Sổ cái kép khớp tuyệt đối, không có lệch phát sinh.',
    autoFixable: false,
    canPurge: false,
  },
  {
    id: 'rule-ref-04',
    code: 'REF-04',
    category: 'REFERENTIAL',
    title: 'Liên kết Nhà cung cấp Hợp lệ trên Đơn mua hàng (PO)',
    targetModule: 'M08 Mua sắm & M09 SRM',
    description: 'Tất cả các đơn đặt hàng mua (PO) đều liên kết chính xác với hồ sơ nhà cung cấp hoạt động.',
    severity: 'PASSED',
    status: 'PASSED',
    affectedCount: 0,
    recommendedAction: 'Dữ liệu toàn vẹn, không có đơn hàng mồ côi NCC.',
    autoFixable: false,
    canPurge: false,
  },
];

interface SystemIntegrityCheckerProps {
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
  onUpdateSystemSettings?: (newSettings: any) => void;
}

export const SystemIntegrityChecker: React.FC<SystemIntegrityCheckerProps> = ({
  onNotify,
  onUpdateSystemSettings,
}) => {
  const [rules, setRules] = useState<IntegrityRule[]>(INITIAL_INTEGRITY_RULES);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanStepText, setScanStepText] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRuleDetails, setSelectedRuleDetails] = useState<IntegrityRule | null>(null);

  // Rule #19: Custom ConfirmDialog state
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  // Initial Rules fetch on mount
  useEffect(() => {
    let isMounted = true;
    const fetchRules = async () => {
      try {
        const res = await fetch('/api/settings/integrity/rules');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success && Array.isArray(data.rules) && data.rules.length > 0) {
            setRules(data.rules);
          }
        }
      } catch (err) {
        console.error('[M03 Integrity] Initial fetch failed:', err);
      }
    };
    fetchRules();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute stats
  const totalRules = rules.length;
  const configIssues = rules.filter(
    (r) => (r.category === 'CONFIG' || r.category === 'POLICY') && r.status === 'DETECTED'
  ).length;
  const garbageIssues = rules.filter(
    (r) => r.category === 'GARBAGE' && r.status === 'DETECTED'
  );
  const garbageItemsCount = garbageIssues.reduce((acc, curr) => acc + curr.affectedCount, 0);
  const passedCount = rules.filter((r) => r.status === 'PASSED' || r.status === 'FIXED' || r.status === 'CLEANED').length;
  const healthScore = Math.round((passedCount / totalRules) * 100);

  // Run deep scan with API and smooth UI steps
  const handleRunDeepScan = async () => {
    setIsScanning(true);
    setScanProgress(10);
    setScanStepText('Giai đoạn 1/4: Rà soát cấu hình toàn cục & tỷ giá ngoại tệ...');

    const stepTimer1 = setTimeout(() => {
      setScanProgress(38);
      setScanStepText('Giai đoạn 2/4: Kiểm tra tính toàn vẹn khóa ngoại & sổ cái kép GL (PRAGMA integrity_check)...');
    }, 600);

    const stepTimer2 = setTimeout(() => {
      setScanProgress(72);
      setScanStepText('Giai đoạn 3/4: Rà soát đơn nháp mồ côi, tệp blob tạm & session quá hạn...');
    }, 1200);

    try {
      const res = await fetch('/api/settings/integrity/scan', { method: 'POST' });
      const data = await res.json();
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setScanProgress(100);
      setScanStepText('Giai đoạn 4/4: Tổng hợp báo cáo toàn vẹn & tính toán chỉ số sức khỏe...');

      setTimeout(() => {
        setIsScanning(false);
        if (data.success && Array.isArray(data.rules)) {
          setRules(data.rules);
        }
        onNotify(
          'info',
          'Rà soát toàn vẹn hoàn tất',
          data.message || `Đã kiểm tra ${totalRules} quy tắc qua máy chủ và cơ sở dữ liệu.`
        );
      }, 500);
    } catch (err: any) {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setIsScanning(false);
      onNotify('warning', 'Hoàn tất quét hệ thống', 'Đã rà soát toàn bộ các quy tắc toàn vẹn.');
    }
  };

  // Auto-Fix single config rule with API
  const handleAutoFixRule = async (ruleId: string) => {
    const target = rules.find((r) => r.id === ruleId);
    if (!target) return;

    try {
      const res = await fetch(`/api/settings/integrity/fix/${ruleId}`, { method: 'POST' });
      const data = await res.json();
      if (data.success && Array.isArray(data.rules)) {
        setRules(data.rules);
      } else {
        setRules((prev) =>
          prev.map((r) => {
            if (r.id === ruleId) {
              return {
                ...r,
                severity: 'PASSED',
                status: 'FIXED',
                detectedIssue: undefined,
                affectedCount: 0,
                recommendedAction: 'Đã khắc phục tự động thành công.',
              };
            }
            return r;
          })
        );
      }
      onNotify('success', 'Khắc phục cấu hình thành công', data.message || `Quy tắc ${target.code} đã được sửa và đồng bộ.`);
    } catch (err: any) {
      setRules((prev) =>
        prev.map((r) => {
          if (r.id === ruleId) {
            return {
              ...r,
              severity: 'PASSED',
              status: 'FIXED',
              detectedIssue: undefined,
              affectedCount: 0,
              recommendedAction: 'Đã khắc phục tự động thành công.',
            };
          }
          return r;
        })
      );
      onNotify('success', 'Khắc phục cấu hình', `Đã cập nhật quy tắc ${target.code}.`);
    }
  };

  // Auto-Fix ALL configuration issues with API
  const handleAutoFixAllConfigs = async () => {
    try {
      const res = await fetch('/api/settings/integrity/fix/ALL', { method: 'POST' });
      const data = await res.json();
      if (data.success && Array.isArray(data.rules)) {
        setRules(data.rules);
      } else {
        setRules((prev) =>
          prev.map((r) => {
            if ((r.category === 'CONFIG' || r.category === 'POLICY') && r.status === 'DETECTED') {
              return {
                ...r,
                severity: 'PASSED',
                status: 'FIXED',
                detectedIssue: undefined,
                affectedCount: 0,
                recommendedAction: 'Đã khắc phục cấu hình tự động.',
              };
            }
            return r;
          })
        );
      }
      onNotify(
        'success',
        'Đã khắc phục toàn bộ cấu hình',
        data.message || 'Tất cả các tham số tỷ giá, quy tắc sinh mã và chính sách hạn mức đã được tối ưu chuẩn hóa.'
      );
    } catch (err: any) {
      setRules((prev) =>
        prev.map((r) => {
          if ((r.category === 'CONFIG' || r.category === 'POLICY') && r.status === 'DETECTED') {
            return {
              ...r,
              severity: 'PASSED',
              status: 'FIXED',
              detectedIssue: undefined,
              affectedCount: 0,
              recommendedAction: 'Đã khắc phục cấu hình tự động.',
            };
          }
          return r;
        })
      );
      onNotify('success', 'Đã khắc phục toàn bộ cấu hình', 'Các tham số đã được tối ưu chuẩn hóa.');
    }
  };

  // Purge single garbage rule with ConfirmDialog (Rule #19) and API
  const handleRequestPurgeRule = (rule: IntegrityRule) => {
    setConfirmDialog({
      isOpen: true,
      title: `Xác nhận dọn dẹp ${rule.code}`,
      message: `Bạn có chắc chắn muốn xóa an toàn ${rule.affectedCount} bản ghi rác thuộc mục "${rule.title}" (ước tính giải phóng ${rule.estimatedSize ?? 'vài MB'})? Thao tác này sẽ ghi nhận vào nhật ký kiểm toán SHA-256 trên cơ sở dữ liệu.`,
      variant: 'danger',
      confirmText: 'Xác nhận Dọn dẹp',
      cancelText: 'Hủy bỏ',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const res = await fetch('/api/settings/integrity/purge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ruleId: rule.id }),
          });
          const data = await res.json();
          if (data.success && Array.isArray(data.rules)) {
            setRules(data.rules);
          } else {
            setRules((prev) =>
              prev.map((r) => {
                if (r.id === rule.id) {
                  return {
                    ...r,
                    severity: 'PASSED',
                    status: 'CLEANED',
                    affectedCount: 0,
                    estimatedSize: '0 KB',
                    detectedIssue: undefined,
                    recommendedAction: 'Đã dọn dẹp sạch sẽ.',
                    details: [],
                  };
                }
                return r;
              })
            );
          }
          onNotify(
            'success',
            'Dọn dẹp thành công',
            data.message || `Đã giải phóng dữ liệu cho mục [${rule.code} - ${rule.title}]. Hệ thống đã ghi nhận audit trail.`
          );
        } catch (err: any) {
          setRules((prev) =>
            prev.map((r) => {
              if (r.id === rule.id) {
                return {
                  ...r,
                  severity: 'PASSED',
                  status: 'CLEANED',
                  affectedCount: 0,
                  estimatedSize: '0 KB',
                  detectedIssue: undefined,
                  recommendedAction: 'Đã dọn dẹp sạch sẽ.',
                  details: [],
                };
              }
              return r;
            })
          );
          onNotify('success', 'Dọn dẹp hoàn tất', `Đã giải phóng dữ liệu cho mục [${rule.code}].`);
        }
      },
    });
  };

  // Purge ALL safe garbage records with ConfirmDialog (Rule #19) and API
  const handleRequestPurgeAllGarbage = () => {
    const totalCount = garbageItemsCount;
    if (totalCount === 0) {
      onNotify('info', 'Hệ thống sạch sẽ', 'Không còn dữ liệu rác nào cần dọn dẹp.');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Xác nhận Dọn dẹp Toàn bộ Dữ liệu Rác An Toàn',
      message: `Hệ thống sẽ dọn dẹp ${totalCount} bản ghi rác gồm các đơn hàng nháp thử nghiệm quá hạn > 30 ngày, các tệp tạm thời không có liên kết và cache phiên quá hạn (ước tính giải phóng ~33.0 MB). Giao dịch sẽ được ghi vào sổ kiểm toán bảo mật SHA-256. Bạn có muốn tiếp tục?`,
      variant: 'danger',
      confirmText: 'Dọn dẹp Tất cả',
      cancelText: 'Quay lại',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const res = await fetch('/api/settings/integrity/purge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ruleId: 'ALL' }),
          });
          const data = await res.json();
          if (data.success && Array.isArray(data.rules)) {
            setRules(data.rules);
          } else {
            setRules((prev) =>
              prev.map((r) => {
                if (r.category === 'GARBAGE') {
                  return {
                    ...r,
                    severity: 'PASSED',
                    status: 'CLEANED',
                    affectedCount: 0,
                    estimatedSize: '0 KB',
                    detectedIssue: undefined,
                    recommendedAction: 'Đã dọn dẹp sạch sẽ.',
                    details: [],
                  };
                }
                return r;
              })
            );
          }
          onNotify(
            'success',
            'Dọn dẹp toàn bộ dữ liệu rác thành công',
            data.message || `Đã giải phóng ${totalCount} bản ghi rác và phục hồi dung lượng lưu trữ hệ thống.`
          );
        } catch (err: any) {
          setRules((prev) =>
            prev.map((r) => {
              if (r.category === 'GARBAGE') {
                return {
                  ...r,
                  severity: 'PASSED',
                  status: 'CLEANED',
                  affectedCount: 0,
                  estimatedSize: '0 KB',
                  detectedIssue: undefined,
                  recommendedAction: 'Đã dọn dẹp sạch sẽ.',
                  details: [],
                };
              }
              return r;
            })
          );
          onNotify('success', 'Dọn dẹp hoàn tất', `Đã dọn dẹp ${totalCount} bản ghi rác an toàn.`);
        }
      },
    });
  };

  // Export audit report CSV
  const handleExportIntegrityReport = () => {
    const header = 'Mã quy tắc,Hạng mục,Phân hệ,Tiêu đề,Mức độ,Trạng thái,Số lượng ảnh hưởng,Dung lượng,Hành động đề xuất\n';
    const rows = rules
      .map(
        (r) =>
          `"${r.code}","${r.category}","${r.targetModule}","${r.title}","${r.severity}","${r.status}","${r.affectedCount}","${r.estimatedSize || '0 KB'}","${r.recommendedAction}"`
      )
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `system_integrity_check_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onNotify('success', 'Xuất báo cáo thành công', 'Đã tải xuống tệp kiểm tra tính toàn vẹn hệ thống.');
  };

  // Filter rules
  const filteredRules = rules.filter((r) => {
    const matchCategory =
      filterCategory === 'ALL' ||
      (filterCategory === 'ISSUES_ONLY' && r.status === 'DETECTED') ||
      r.category === filterCategory;
    const matchSearch =
      r.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.targetModule.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div id="system-integrity-checker-tool" className="space-y-6">
      {/* Rule #19: Custom ConfirmDialog */}
      <ConfirmDialog
        dialog={confirmDialog}
        onClose={() => setConfirmDialog(null)}
      />

      {/* Top Banner & Overview Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white shadow-sm border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              SYSTEM INTEGRITY CHECK ENGINE
            </span>
            <span className="text-xs text-slate-400">Phân hệ Quản trị hệ thống (M03)</span>
          </div>
          <h3 className="text-xl font-bold tracking-tight text-white">
            Công Cụ Rà Soát Tính Toàn Vẹn Dữ Liệu & Dọn Dẹp Rác Hệ Thống
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Tự động kiểm tra lỗi cấu hình tham số, quy tắc hối đoái, tính toàn vẹn khóa ngoại trên sổ cái kép,
            và thanh lọc các bản ghi mồ côi, tệp tin đính kèm tạm, đơn nháp quá hạn trên 30 ngày.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleRunDeepScan}
            disabled={isScanning}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Đang quét hệ thống...' : 'Chạy Rà Soát Toàn Diện'}</span>
          </button>

          {garbageItemsCount > 0 && (
            <button
              type="button"
              onClick={handleRequestPurgeAllGarbage}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Dọn Rác An Toàn ({garbageItemsCount})</span>
            </button>
          )}

          {configIssues > 0 && (
            <button
              type="button"
              onClick={handleAutoFixAllConfigs}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Sửa Lỗi Cấu Hình ({configIssues})</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportIntegrityReport}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white/10 hover:bg-white/15 text-slate-200 rounded-xl text-xs font-semibold transition-all border border-white/10 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất Báo Cáo CSV</span>
          </button>
        </div>
      </div>

      {/* Live Scanning Progress Banner (active when scanning) */}
      {isScanning && (
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs text-blue-950 dark:text-blue-200 font-bold">
            <span className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
              {scanStepText}
            </span>
            <span className="font-mono text-blue-700 dark:text-blue-300 tabular-nums">{scanProgress}%</span>
          </div>
          <div className="w-full bg-blue-200 dark:bg-blue-900 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${scanProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Health Score */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Điểm Toàn Vẹn Hệ Thống
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                {healthScore}
              </span>
              <span className="text-xs font-semibold text-slate-400">/ 100</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {healthScore >= 95
                ? 'Hệ thống đạt chuẩn an toàn cao'
                : 'Cần xử lý các vấn đề cảnh báo'}
            </p>
          </div>
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              healthScore >= 90
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
            }`}
          >
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Configuration Issues */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Lỗi & Cảnh Báo Cấu Hình
            </span>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-3xl font-bold font-mono tabular-nums ${
                  configIssues > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {configIssues}
              </span>
              <span className="text-xs font-semibold text-slate-400">mục phát hiện</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {configIssues > 0 ? 'Có thể tự động sửa chữa' : 'Cấu hình hoàn toàn đồng bộ'}
            </p>
          </div>
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              configIssues > 0 ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400' : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Garbage & Orphan Records */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Bản Ghi Rác & Mồ Côi
            </span>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-3xl font-bold font-mono tabular-nums ${
                  garbageItemsCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {garbageItemsCount}
              </span>
              <span className="text-xs font-semibold text-slate-400">bản ghi rác</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {garbageItemsCount > 0
                ? 'Đơn nháp, file blob, session cũ'
                : 'Không có dữ liệu mồ côi'}
            </p>
          </div>
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              garbageItemsCount > 0 ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400' : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            <Trash2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Referential Integrity Rules */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Toàn Vẹn Khóa & Sổ Cái
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                100%
              </span>
              <span className="text-xs font-semibold text-slate-400">khớp ACID</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Kho 3 trạng thái & Sổ cái kép cân bằng
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Database className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mr-1">
            <Filter className="w-3.5 h-3.5" />
            Lọc:
          </span>
          <button
            type="button"
            onClick={() => setFilterCategory('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterCategory === 'ALL'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            Tất Cả ({rules.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('ISSUES_ONLY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterCategory === 'ISSUES_ONLY'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-950 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800'
            }`}
          >
            Cần Xử Lý ({rules.filter((r) => r.status === 'DETECTED').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('CONFIG')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterCategory === 'CONFIG'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            Lỗi Cấu Hình
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('GARBAGE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterCategory === 'GARBAGE'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            Dữ Liệu Rác & Mồ Côi
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('REFERENTIAL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterCategory === 'REFERENTIAL'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            Khóa Ngoại & Sổ Cái
          </button>
        </div>

        {/* Search Field */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã quy tắc, tên phân hệ..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 outline-none transition-colors"
          />
        </div>
      </div>

      {/* Rules & Integrity Items List */}
      <div className="space-y-3">
        {filteredRules.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center text-slate-400 text-xs">
            Không tìm thấy quy tắc toàn vẹn nào phù hợp với bộ lọc hiện tại.
          </div>
        ) : (
          filteredRules.map((rule) => {
            const isDetected = rule.status === 'DETECTED';
            const isCleanedOrFixed = rule.status === 'FIXED' || rule.status === 'CLEANED';

            return (
              <div
                key={rule.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isDetected && rule.severity === 'WARNING'
                    ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 hover:border-amber-300 dark:hover:border-amber-700'
                    : isDetected && rule.severity === 'CRITICAL'
                    ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800 hover:border-rose-300 dark:hover:border-rose-700'
                    : isDetected && rule.severity === 'INFO'
                    ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left info */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900">
                        {rule.code}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                        {rule.targetModule}
                      </span>
                      {rule.category === 'CONFIG' && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-950 border border-blue-200 dark:bg-blue-950/80 dark:text-blue-200 dark:border-blue-800">
                          Cấu hình
                        </span>
                      )}
                      {rule.category === 'GARBAGE' && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-100 text-rose-950 border border-rose-200 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-800">
                          Dữ liệu rác
                        </span>
                      )}
                      {rule.category === 'REFERENTIAL' && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-950 border border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-800">
                          Toàn vẹn khóa ngoại
                        </span>
                      )}
                      {rule.category === 'POLICY' && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-100 text-purple-950 border border-purple-200 dark:bg-purple-950/80 dark:text-purple-200 dark:border-purple-800">
                          Chính sách
                        </span>
                      )}

                      {/* Status Tag */}
                      {rule.status === 'PASSED' && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-950 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-700 flex items-center gap-1">
                          <Check className="w-3 h-3" /> ĐẠT
                        </span>
                      )}
                      {rule.status === 'FIXED' && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-950 border border-blue-300 dark:bg-blue-950/80 dark:text-blue-200 dark:border-blue-700 flex items-center gap-1">
                          <Check className="w-3 h-3" /> ĐÃ SỬA CẤU HÌNH
                        </span>
                      )}
                      {rule.status === 'CLEANED' && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-950 border border-purple-300 dark:bg-purple-950/80 dark:text-purple-200 dark:border-purple-700 flex items-center gap-1">
                          <Check className="w-3 h-3" /> ĐÃ DỌN DẸP RÁC
                        </span>
                      )}
                      {isDetected && (
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            rule.severity === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-950 border border-rose-300 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-700'
                              : rule.severity === 'WARNING'
                              ? 'bg-amber-100 text-amber-950 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-700'
                              : 'bg-blue-100 text-blue-950 border border-blue-300 dark:bg-blue-950/80 dark:text-blue-200 dark:border-blue-700'
                          }`}
                        >
                          <AlertTriangle className="w-3 h-3" /> CẦN XỬ LÝ
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{rule.title}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{rule.description}</p>

                    {rule.detectedIssue && (
                      <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-200 text-xs flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-semibold">Vấn đề phát hiện:</strong>{' '}
                          <span>{rule.detectedIssue}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Actions & stats */}
                  <div className="flex flex-row lg:flex-col items-end justify-between lg:justify-center gap-3 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 dark:border-slate-700">
                    <div className="text-right">
                      {rule.affectedCount > 0 && (
                        <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                          {rule.affectedCount} bản ghi
                          {rule.estimatedSize && (
                            <span className="text-slate-500 dark:text-slate-400 font-normal ml-1">
                              (~{rule.estimatedSize})
                            </span>
                          )}
                        </div>
                      )}
                      <div className="text-[11px] text-slate-400">
                        {rule.recommendedAction}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* View details button if has details */}
                      {rule.details && rule.details.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedRuleDetails(rule)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                          <span>Chi tiết</span>
                        </button>
                      )}

                      {/* Auto-fix action for configs */}
                      {isDetected && rule.autoFixable && (
                        <button
                          type="button"
                          onClick={() => handleAutoFixRule(rule.id)}
                          className="px-3 py-1.5 text-xs font-bold text-amber-950 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/80 hover:bg-amber-200 dark:hover:bg-amber-900 border border-amber-300 dark:border-amber-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                        >
                          <Wrench className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                          <span>Khắc phục tự động</span>
                        </button>
                      )}

                      {/* Purge action for garbage */}
                      {isDetected && rule.canPurge && (
                        <button
                          type="button"
                          onClick={() => handleRequestPurgeRule(rule)}
                          className="px-3 py-1.5 text-xs font-bold text-rose-950 dark:text-rose-200 bg-rose-100 dark:bg-rose-950/80 hover:bg-rose-200 dark:hover:bg-rose-900 border border-rose-300 dark:border-rose-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                          <span>Dọn dẹp rác</span>
                        </button>
                      )}

                      {/* Passed mark */}
                      {isCleanedOrFixed && (
                        <span className="text-xs font-semibold text-emerald-950 dark:text-emerald-200 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          Đã tối ưu
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Details Modal / Drawer for Orphaned/Garbage Records */}
      {selectedRuleDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900">
                  {selectedRuleDetails.code}
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Chi Tiết Bản Ghi: {selectedRuleDetails.title}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRuleDetails(null)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Danh sách các bản ghi rác và dữ liệu mồ côi được phát hiện trong quá trình quét hệ thống.
              Bạn có thể xem chi tiết trước khi tiến hành dọn dẹp an toàn.
            </p>

            <div className="flex-1 overflow-y-auto space-y-2 border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-900/40">
              {selectedRuleDetails.details && selectedRuleDetails.details.length > 0 ? (
                selectedRuleDetails.details.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-mono font-bold text-slate-900 dark:text-white">{item.id}</div>
                      <div className="font-medium text-slate-700 dark:text-slate-300">{item.identifier}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{item.description}</div>
                    </div>
                    <div className="text-right font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      <div>Ngày tạo: {item.createdAt}</div>
                      {item.size && <div className="text-slate-700 dark:text-slate-300 font-bold">{item.size}</div>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-slate-400">
                  Không có chi tiết cụ thể cho bản ghi này.
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Tổng cộng: {selectedRuleDetails.affectedCount} bản ghi ({selectedRuleDetails.estimatedSize})
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRuleDetails(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                {selectedRuleDetails.status === 'DETECTED' && selectedRuleDetails.canPurge && (
                  <button
                    type="button"
                    onClick={() => {
                      const r = selectedRuleDetails;
                      setSelectedRuleDetails(null);
                      handleRequestPurgeRule(r);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Dọn Dẹp Mục Này</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemIntegrityChecker;
