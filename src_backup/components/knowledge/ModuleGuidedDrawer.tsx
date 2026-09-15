import React, { useState } from 'react';
import { ModuleDefinition } from '../../config/moduleRegistry';
import {
  HelpCircle,
  X,
  AlertCircle,
  CheckCircle2,
  Cpu,
  Database,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  CornerDownRight,
  Sparkles,
  ExternalLink,
  BookOpen,
  Route,
} from 'lucide-react';

interface ModuleGuidedDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  module: ModuleDefinition;
  onSelectModule?: (module: ModuleDefinition) => void;
  onNavigateToModule?: (moduleId: string) => void;
  onNavigateModule?: (moduleId: string) => void;
}

// Generate rich, authoritative module contract for any module
export function getModuleContract(mod: ModuleDefinition) {
  const code = mod.moduleId;

  // Domain authority mapping
  let engine = 'OrchestrationEngine & ProcessEngine';
  let dbImpact = `Ghi nhận bản ghi nghiệp vụ ${mod.readEndpoint}, kiểm tra tính hợp lệ và ghi vết Audit SHA-256.`;
  let whenNotToUse = 'Không dùng khi giao dịch không có chứng từ gốc phê duyệt hoặc vượt quá thẩm quyền.';
  let commonMistake = 'Cố tình thao tác nhảy cóc bỏ qua bước duyệt trước đó.';
  let invariants = [
    'Tuân thủ Single Writer: Mọi biến động kho phải qua InventoryService, sổ cái qua AccountingEngine.',
    'Mọi hành động đều được mã hóa và lưu vào Audit Ledger SHA-256 bất biến.',
  ];

  if (code === 'M08' || code === 'M09' || code === 'M10') {
    engine = 'Procurement & 3-Way Matching Engine';
    dbImpact = 'Ghi purchase_orders, po_items. KHÔNG tăng tồn kho vật lý tại PO; chỉ cập nhật khi nhận GRN.';
    whenNotToUse = 'Không dùng PO để nhập hàng chuyển kho nội bộ (dùng M21) hoặc nhập thành phẩm sản xuất (dùng M25).';
    commonMistake = 'Nghĩ rằng tạo PO là kho đã có hàng; nhập sai nhà cung cấp hoặc bỏ qua đối soát đơn giá.';
    invariants = [
      'PO chưa nhận hàng tuyệt đối không làm tăng Physical Stock.',
      'Dung sai 3-Way Matching không được vượt quá 2% so với giá hợp đồng.',
    ];
  } else if (code === 'M13' || code === 'M14' || code === 'M41') {
    engine = 'PriceResolutionService & OrchestrationEngine';
    dbImpact = 'Ghi sales_orders, so_items. Kích hoạt InventoryService.reserveStock() để khóa Allocated Stock.';
    whenNotToUse = 'Không dùng cho bán lẻ thu tiền trao tay trực tiếp tại quầy (bắt buộc dùng M16 POS).';
    commonMistake = 'Tạo đơn vượt quá Credit Limit của khách hàng mà không xin phê duyệt bảo lãnh.';
    invariants = [
      'Available Stock = Physical - Allocated; Available không bao giờ được phép âm.',
      'Đơn giá bán phải tuân thủ bảng giá hiệu lực tại M41 Price Resolution.',
    ];
  } else if (code === 'M17' || code === 'M18' || code === 'M19' || code === 'M20' || code === 'M21') {
    engine = 'InventoryService (Single Writer Lõi Kho)';
    dbImpact = 'Chèn bản ghi bất biến vào stock_ledger, cập nhật stock_balances (Physical, Allocated, Available).';
    whenNotToUse = 'Tuyệt đối cấm can thiệp trực tiếp CSDL. Không dùng phiếu điều chỉnh để nhập hàng mua thông thường.';
    commonMistake = 'Tự ý sửa số lượng tồn sổ sách khi phát hiện lệch kho thay vì lập đợt kiểm kê đếm mù M19.';
    invariants = [
      'stock_ledger là nguồn sự thật duy nhất (Single Source of Truth), cấm UPDATE/DELETE.',
      'Giao dịch điều chuyển nội bộ M21 là Atomic: Kho xuất -> In-transit -> Kho nhập.',
    ];
  } else if (code === 'M30' || code === 'M31' || code === 'M32' || code === 'M33') {
    engine = 'AccountingEngine (Single Writer Sổ Cái GL)';
    dbImpact = 'Chèn bút toán kép vào journal_entries và journal_lines. Cập nhật số dư tài khoản Nợ/Có.';
    whenNotToUse = 'Không hạch toán khi chưa có đầy đủ chứng từ thanh toán hợp lệ (Hóa đơn GTGT, Phiếu xuất kho).';
    commonMistake = 'Định khoản lệch Nợ/Có hoặc sửa trực tiếp số dư tài khoản mà không qua bút toán điều chỉnh.';
    invariants = [
      'Tổng Nợ (Debit) bắt buộc phải bằng Tổng Có (Credit) trong mọi chứng từ kế toán.',
      'Hóa đơn điện tử đã phát hành ký số không được phép xóa; phải lập biên bản hủy hoặc điều chỉnh.',
    ];
  } else if (code === 'M25' || code === 'M26') {
    engine = 'Manufacturing ProcessEngine & CostingEngine';
    dbImpact = 'Ghi manufacturing_orders, boms. Xuất NVL ghi Nợ 154 / Có 152; Nhập TP ghi Nợ 155 / Có 154.';
    whenNotToUse = 'Không lập lệnh MO khi định mức BOM chưa được kỹ thuật trưởng phê duyệt hiệu lực.';
    commonMistake = 'Không ghi nhận hao hụt thực tế (Scrap rate) dẫn đến sai lệch chi phí giá thành sản phẩm.';
    invariants = [
      'Chỉ được xuất vật tư theo đúng phiên bản BOM đang Active.',
      'Giá thành thành phẩm sản xuất = Chi phí NVL + Chi phí Nhân công + Chi phí SX chung.',
    ];
  } else if (code === 'M16') {
    engine = 'ShiftEngine & CashMovementService';
    dbImpact = 'Ghi nhận ca bán hàng shifts, biến động tiền mặt cash_movements. Đối soát mệnh giá và tự động khóa ca.';
    whenNotToUse = 'Không dùng cho bán sỉ/B2B xuất hóa đơn công nợ dài hạn (bắt buộc dùng M13 Sales Order & M31 AR Invoice).';
    commonMistake = 'Thu ngân tự phê duyệt chênh lệch ca của chính mình (vi phạm Separation of Duties).';
    invariants = [
      'Tiền dự kiến (Expected Cash) = Tiền đầu ca (Opening Float) + Tổng các khoản thu/chi thực tế phát sinh trong ca.',
      'Chỉ Quản lý (Manager/Admin) mới có thẩm quyền phê duyệt chênh lệch ca (Variance Approval).',
    ];
  } else if (code === 'M27' || code === 'M28') {
    engine = 'PayrollEngine & HRService';
    dbImpact = 'Tính bảng lương payrolls, trích thuế TNCN/BHXH. Kích hoạt AccountingEngine hạch toán chi phí nhân công (Nợ 642 / Có 334).';
    whenNotToUse = 'Không chạy tính lương khi chưa chốt dữ liệu chấm công hiệu lực trong kỳ.';
    commonMistake = 'Sửa thủ công lương thực nhận mà không qua công thức định mức phụ cấp/giảm trừ.';
    invariants = [
      'Lương thực nhận = Lương cơ bản + Phụ cấp - Các khoản giảm trừ (Thuế TNCN, BHXH, Công đoàn).',
      'Bảng lương sau khi duyệt (Approved) sẽ được sinh mã SHA-256 niêm phong và hạch toán tự động vào Sổ cái GL.',
    ];
  }

  return {
    engine,
    dbImpact,
    whenNotToUse,
    commonMistake,
    invariants,
  };
}

export const ModuleGuidedDrawer: React.FC<ModuleGuidedDrawerProps> = ({
  isOpen,
  onClose,
  module,
  onSelectModule,
  onNavigateToModule,
  onNavigateModule,
}) => {
  const [activeTab, setActiveTab] = useState<'CONTRACT' | 'INVARIANTS' | 'UP_DOWN' | 'API_FLOW'>('CONTRACT');

  if (!isOpen) return null;

  const contract = getModuleContract(module);

  return (
    <div
      id={`module-guided-drawer-${module.moduleId}`}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-end animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white w-full max-w-xl h-full shadow-2xl border-l border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 text-blue-300 flex items-center justify-center font-mono font-bold text-xs">
              {module.moduleId}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">{module.moduleName}</h3>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Business Contract
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Miền: <span className="font-semibold text-slate-300">{module.domain}</span> • Endpoint:{' '}
                <span className="font-mono text-slate-400">{module.readEndpoint}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 py-2.5 border-b border-slate-100 bg-slate-50 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('CONTRACT')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'CONTRACT' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hợp Đồng Nghiệp Vụ (What / When / Why)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('INVARIANTS')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'INVARIANTS' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Quy Tắc Bất Biến & Sai Lầm
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('UP_DOWN')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'UP_DOWN' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Luồng Dữ Liệu
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('API_FLOW')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'API_FLOW' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Luồng API & SLA
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 text-xs">
          {activeTab === 'CONTRACT' && (
            <>
              {/* Question 1: What is this? */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-1.5 text-xs">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>1. Phân hệ này là gì? (Bản chất & Mục đích kinh doanh)</span>
                </div>
                <p className="text-slate-600 leading-relaxed">{module.description}</p>
              </div>

              {/* Question 2: When to use & When NOT to use */}
              <div className="grid grid-cols-1 gap-2.5">
                <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-900 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Khi nào NÊN sử dụng phân hệ này?</span>
                  </div>
                  <p className="text-emerald-800 leading-relaxed">
                    Sử dụng khi phát sinh nghiệp vụ chính thức thuộc nhóm thẩm quyền {module.group} của miền{' '}
                    {module.domain}, tuân thủ quy trình chuẩn và có tài liệu chứng từ phê duyệt đầy đủ.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-rose-200 bg-rose-50/50">
                  <div className="flex items-center gap-1.5 font-bold text-rose-900 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Khi nào KHÔNG ĐƯỢC sử dụng? (When NOT to use)</span>
                  </div>
                  <p className="text-rose-800 leading-relaxed">{contract.whenNotToUse}</p>
                </div>
              </div>

              {/* Question 3: Core Engine & DB Impact */}
              <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 flex flex-col gap-2">
                <div className="flex items-center gap-1.5 font-bold text-blue-900 text-xs">
                  <Cpu className="w-4 h-4 text-blue-600" />
                  <span>Động cơ xử lý lõi (Core Business Engine):</span>
                </div>
                <p className="text-blue-950 font-mono font-medium">{contract.engine}</p>

                <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs mt-1">
                  <Database className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tác động CSDL & Sổ cái (Database & Ledger Effect):</span>
                </div>
                <p className="text-slate-600 font-mono text-[11px] leading-relaxed">{contract.dbImpact}</p>
              </div>

              {/* RBAC */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Quyền hạn & Vai trò yêu cầu (RBAC Permissions):</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {module.permissions.map((p) => (
                    <span
                      key={p}
                      className="px-2 py-0.5 rounded bg-white text-slate-700 font-mono text-[10px] font-bold border border-slate-200"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'INVARIANTS' && (
            <>
              {/* Business Invariants */}
              <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50">
                <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Các quy tắc bất biến bắt buộc tuân thủ (Business Invariants):</span>
                </div>
                <ul className="space-y-1.5 text-amber-900 text-xs">
                  {contract.invariants.map((inv, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="font-mono font-bold text-amber-700 shrink-0">#{idx + 1}</span>
                      <span>{inv}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Common Pitfalls & Mistakes */}
              <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40">
                <div className="flex items-center gap-1.5 font-bold text-rose-900 mb-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Sai lầm phổ biến & Cách phòng tránh:</span>
                </div>
                <p className="text-rose-800 leading-relaxed">{contract.commonMistake}</p>
                <div className="mt-2.5 p-2 bg-white rounded-lg border border-rose-200 text-rose-900 text-[11px]">
                  <strong>Khuyến nghị:</strong> Luôn kiểm tra kỹ chứng từ nguồn và tuân thủ các quy tắc nghiệp vụ chuẩn trước khi
                  bấm duyệt hoặc thực thi giao dịch.
                </div>
              </div>
            </>
          )}

          {activeTab === 'UP_DOWN' && (
            <>
              {/* Upstream & Downstream Flow */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col gap-3">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>Liên kết Luồng Dữ liệu Đầu vào & Đầu ra:</span>
                </div>

                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <strong className="text-slate-700 text-[11px] uppercase block mb-1">
                    ← Phân hệ Tiền nhiệm (Upstream):
                  </strong>
                  <p className="text-slate-600 text-xs">
                    Tiếp nhận dữ liệu đầu vào từ các phân hệ trước đó trong chuỗi giá trị và kiểm tra tính toàn vẹn (Master Data, Approval Status).
                  </p>
                </div>

                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <strong className="text-slate-700 text-[11px] uppercase block mb-1">
                    → Phân hệ Kế nhiệm (Downstream):
                  </strong>
                  <p className="text-slate-600 text-xs">
                    Sau khi hoàn thành, kết quả được đồng bộ tự động sang Sổ cái Tổng hợp GL (M30), Báo cáo Phân tích BI (M37) và Nhật ký Kiểm toán SHA-256 (M02).
                  </p>
                </div>
              </div>
            </>
          )}

          {activeTab === 'API_FLOW' && (
            <>
              {/* API Endpoints & Contracts for this specific module */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-900 text-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Route className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white text-xs">API Endpoints Chuẩn Hóa ({module.moduleId})</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    SLA &lt; 500ms
                  </span>
                </div>

                <div className="space-y-2 font-mono text-[11px]">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <span className="text-blue-400 font-bold">GET {module.readEndpoint}</span>
                    <span className="text-[10px] text-slate-400 font-sans">Đọc dữ liệu / Tra cứu</span>
                  </div>
                  {module.writeEndpoint && (
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <span className="text-emerald-400 font-bold">POST {module.writeEndpoint}</span>
                      <span className="text-[10px] text-slate-400 font-sans">Tạo mới / Ghi sổ</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Protocol & Headers */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Cơ chế Xác thực & Giao vận (Protocol & Auth)</span>
                </div>
                <div className="space-y-1.5 text-slate-600">
                  <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                    <span>Header Bắt Buộc:</span>
                    <span className="font-mono font-bold text-slate-800 text-[11px]">Authorization: Bearer &lt;Token&gt;</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                    <span>Chuẩn Đóng Gói (Envelope):</span>
                    <span className="font-mono font-bold text-slate-800 text-[11px]">{`{ success: true, data: [...] }`}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                    <span>Giới Hạn Tần Suất (Rate Limit):</span>
                    <span className="font-bold text-slate-800 text-[11px]">100 requests / phút / người dùng</span>
                  </div>
                </div>
              </div>

              {/* Event Driven & Audit */}
              <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-blue-900">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Outbox Pattern & Kiểm toán Bất biến</span>
                </div>
                <p className="text-blue-950 leading-relaxed text-[11px]">
                  Mỗi thao tác ghi thành công sẽ đồng thời xuất bản một sự kiện miền (Domain Event) vào bảng <span className="font-mono font-bold">outbox_events</span>, đảm bảo tính nhất quán cuối cùng (Eventual Consistency) và ghi vết SHA-256 vào <span className="font-mono font-bold">audit_logs</span>.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-slate-300 hover:bg-white text-slate-700 font-semibold transition-colors text-xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
