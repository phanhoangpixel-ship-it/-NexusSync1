import React, { useState } from 'react';
import {
  Send,
  Radio,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Zap,
  RotateCcw,
  Sparkles,
  Layers,
  Database,
  ShoppingCart,
  Boxes,
  DollarSign,
  AlertOctagon,
  Truck,
  Award,
  Users
} from 'lucide-react';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';

interface EventPublisherTabProps {
  onPublishEvent: (topic: string, payload: any, extra?: any) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message?: string) => void;
}

const PRESET_TOPICS = [
  {
    label: 'M13 Đơn Bán Hàng Xác Nhận (Sales Order Confirmed)',
    domain: 'Sales',
    eventType: 'OrderConfirmed',
    aggregateType: 'SalesOrder',
    aggregateId: 'SO-2026-00492',
    sourceModule: 'M13 Bán Hàng & Phân Phối',
    topic: 'erp.sales.order.created',
    payload: {
      soCode: 'SO-2026-00492',
      customerCode: 'CUST-VIN-HN',
      customerName: 'Tập đoàn VinFast Auto Việt Nam',
      totalAmountVND: 520000000,
      currency: 'VND',
      linesCount: 6,
      targetWarehouse: 'WH-HN-01',
      deliveryDeadline: '2026-09-20'
    }
  },
  {
    label: 'M17 Phân Bổ Giữ Chỗ Kho (Stock Hard Reservation)',
    domain: 'Inventory',
    eventType: 'StockReserved',
    aggregateType: 'StockReservation',
    aggregateId: 'RES-2026-9041',
    sourceModule: 'M17 Quản Lý Kho & Tồn Kho',
    topic: 'erp.inventory.stock.reserved',
    payload: {
      reservationCode: 'RES-2026-9041',
      warehouseCode: 'WH-HN-01',
      warehouseName: 'Kho Tổng Hà Nội - Khu B',
      sku: 'SKU-PIN-LITHIUM-100AH',
      productName: 'Pack Pin Lithium 100Ah 48V',
      quantityReserved: 120,
      uom: 'CÁI',
      targetOrder: 'SO-2026-00492',
      binLocation: 'BIN-B2-01-RACK3'
    }
  },
  {
    label: 'M30 Sổ Cái Ghi Nhận Doanh Thu (GL Revenue Recognition)',
    domain: 'Finance',
    eventType: 'GLJournalPosted',
    aggregateType: 'JournalEntry',
    aggregateId: 'JE-2026-0955',
    sourceModule: 'M30 Sổ Cái & Báo Cáo Tài Chính',
    topic: 'erp.finance.gl.posted',
    payload: {
      journalEntryCode: 'JE-2026-0955',
      debitAccount: '1311 - Phải thu khách hàng',
      creditAccount: '5111 - Doanh thu bán hàng',
      amountVND: 520000000,
      fiscalPeriod: '2026-09',
      checksumSHA256: '9f8e7d6c5b4a3210e4d3c2b1a0987654',
      postedBy: 'kt_truong_nguyen'
    }
  },
  {
    label: 'M08 Xác Nhận Phiếu Nhập Kho PO (GRN Completed)',
    domain: 'Procurement',
    eventType: 'GoodsReceiptCompleted',
    aggregateType: 'GoodsReceipt',
    aggregateId: 'GRN-2026-0245',
    sourceModule: 'M08 Quản Lý Mua Hàng & PO',
    topic: 'erp.procurement.grn.completed',
    payload: {
      grnCode: 'GRN-2026-0245',
      poCode: 'PO-2026-00388',
      supplierCode: 'SUPP-HOAPHAT-01',
      supplierName: 'Tập đoàn Thép Hòa Phát',
      warehouseId: 'WH-DN-02',
      totalWeightKg: 8500,
      qualityStatus: 'QC_PASSED',
      dockNumber: 'DOCK-04'
    }
  },
  {
    label: 'M39 Cảnh Báo Lô Hàng Lỗi QC (QC Inspection Failed)',
    domain: 'Quality',
    eventType: 'QualityInspectionFailed',
    aggregateType: 'QCInspection',
    aggregateId: 'QC-2026-0512',
    sourceModule: 'M39 Quản Lý Chất Lượng QC/QA',
    topic: 'erp.quality.inspection.failed',
    payload: {
      qcCode: 'QC-2026-0512',
      lotNumber: 'LOT-VALVE-2026-SEPT',
      supplier: 'Công ty Van Công Nghiệp Á Châu',
      defectsFound: ['Áp suất nổ dưới 12 bar (chuẩn 16 bar)', 'Ren nối rò rỉ khí'],
      defectRatePercent: 24.0,
      quarantineAction: 'LOCK_BATCH_AND_NOTIFY_PURCHASING'
    }
  },
  {
    label: 'M26 Cảnh Báo Thiếu Hụt Vật Tư MRP (Material Shortage)',
    domain: 'Manufacturing',
    eventType: 'MRPMaterialShortage',
    aggregateType: 'ManufacturingOrder',
    aggregateId: 'MO-2026-0089',
    sourceModule: 'M26 Kế Hoạch Cung Ứng & MRP',
    topic: 'erp.manufacturing.mrp.failed',
    payload: {
      mrpRunId: 'MRP-2026-RUN-14',
      plantCode: 'PLANT-HP-01',
      shortageSku: 'CHIP-M3-INDUSTRIAL',
      requiredQty: 1800,
      availableQty: 310,
      shortageQty: 1490,
      severity: 'CRITICAL_STOPPAGE'
    }
  }
];

export const EventPublisherTab: React.FC<EventPublisherTabProps> = ({
  onPublishEvent,
  onNotify,
}) => {
  const [topic, setTopic] = useState('erp.sales.order.created');
  const [sourceModule, setSourceModule] = useState('M13 Bán Hàng & Phân Phối');
  const [eventType, setEventType] = useState('OrderConfirmed');
  const [aggregateType, setAggregateType] = useState('SalesOrder');
  const [aggregateId, setAggregateId] = useState('SO-2026-00492');
  const [simulateFailure, setSimulateFailure] = useState(false);

  const [payloadText, setPayloadText] = useState(
    JSON.stringify(
      PRESET_TOPICS[0].payload,
      null,
      2
    )
  );

  // ConfirmDialog State cho Rule #19
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [parsedPayloadToPublish, setParsedPayloadToPublish] = useState<any>(null);

  const handleApplyPreset = (preset: typeof PRESET_TOPICS[0]) => {
    setTopic(preset.topic);
    setSourceModule(preset.sourceModule);
    setEventType(preset.eventType);
    setAggregateType(preset.aggregateType);
    setAggregateId(preset.aggregateId);
    setPayloadText(JSON.stringify(preset.payload, null, 2));
    onNotify('info', 'Đã áp dụng mẫu sự kiện', `Mẫu "${preset.label}" đã được nạp vào trình phát.`);
  };

  const handleFormatJson = () => {
    try {
      const obj = JSON.parse(payloadText);
      setPayloadText(JSON.stringify(obj, null, 2));
      onNotify('success', 'Đã định dạng JSON', 'Payload JSON đã được căn chỉnh chuẩn.');
    } catch {
      onNotify('warning', 'JSON không hợp lệ', 'Không thể định dạng cú pháp JSON bị lỗi.');
    }
  };

  const handleValidateAndOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      onNotify('warning', 'Thiếu Topic Name', 'Vui lòng nhập tên Topic sự kiện hợp lệ.');
      return;
    }

    let parsed: any;
    try {
      parsed = JSON.parse(payloadText);
    } catch {
      parsed = { rawText: payloadText };
      onNotify('info', 'Thông báo', 'Payload không phải JSON thuần túy, sẽ được đóng gói dưới dạng chuỗi thô rawText.');
    }

    setParsedPayloadToPublish(parsed);
    setIsConfirmOpen(true);
  };

  const handleExecutePublish = () => {
    try {
      onPublishEvent(topic, parsedPayloadToPublish, {
        sourceModule,
        eventType,
        aggregateType,
        aggregateId,
        simulateFailure
      });
      setIsConfirmOpen(false);
    } catch (err: any) {
      onNotify('danger', 'Lỗi phát sự kiện', err?.message || 'Có lỗi xảy ra khi phát sự kiện.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Trình Phát Sự Kiện Nghiệp Vụ & Console EDA (Event Publisher)
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Phát sự kiện nghiệp vụ trực tiếp vào Outbox EventBus theo chuẩn Transactional Outbox Pattern
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-blue-600" />
            Outbox Table: <code>outbox_events</code>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Cột 1: Preset Templates */}
        <div className="lg:col-span-1 space-y-3">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Mẫu Sự Kiện Nghiệp Vụ (Presets)
                </h4>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Chọn mẫu sự kiện từ các phân hệ để nạp nhanh cấu trúc Payload chuẩn:
            </p>

            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {PRESET_TOPICS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="w-full text-left p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-950/40 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 group-hover:bg-blue-100 dark:group-hover:bg-blue-900 group-hover:text-blue-800 dark:group-hover:text-blue-200">
                      {preset.domain}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {preset.aggregateType}
                    </span>
                  </div>
                  <div className="font-semibold text-xs text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {preset.label}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 truncate mt-1">
                    {preset.topic}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cột 2 & 3: Form phát sự kiện */}
        <div className="lg:col-span-2">
          <form onSubmit={handleValidateAndOpenConfirm} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Topic / Channel *
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Ví dụ: erp.sales.order.created"
                  className="w-full text-xs font-mono font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Phân Hệ Nguồn (Source Module) *
                </label>
                <input
                  type="text"
                  value={sourceModule}
                  onChange={(e) => setSourceModule(e.target.value)}
                  placeholder="Ví dụ: M13 Bán Hàng"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Loại Thực Thể (Aggregate Type)
                </label>
                <input
                  type="text"
                  value={aggregateType}
                  onChange={(e) => setAggregateType(e.target.value)}
                  placeholder="Ví dụ: SalesOrder, Stock, JournalEntry"
                  className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mã Thực Thể (Aggregate ID)
                </label>
                <input
                  type="text"
                  value={aggregateId}
                  onChange={(e) => setAggregateId(e.target.value)}
                  placeholder="Ví dụ: SO-2026-00492"
                  className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* JSON Payload Editor */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-blue-600" />
                  <span>Nội Dung Sự Kiện (Event Payload JSON) *</span>
                </label>
                <button
                  type="button"
                  onClick={handleFormatJson}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Định dạng JSON</span>
                </button>
              </div>

              <textarea
                value={payloadText}
                onChange={(e) => setPayloadText(e.target.value)}
                rows={10}
                className="w-full font-mono text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-950 text-emerald-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 leading-relaxed"
                placeholder="Nhập nội dung JSON sự kiện..."
                required
              />
            </div>

            {/* Simulation Options */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={simulateFailure}
                  onChange={(e) => setSimulateFailure(e.target.checked)}
                  className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <AlertOctagon className="w-3.5 h-3.5 text-rose-500" />
                  Mô phỏng lỗi Consumer (Simulate DLQ Failure) để kiểm thử hàng đợi chết
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleApplyPreset(PRESET_TOPICS[0])}
                className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-xs cursor-pointer"
              >
                Đặt Lại
              </button>

              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-xs cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Xác Nhận & Phát Lên EventBus</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ConfirmDialog cho Rule #19 */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Xác Nhận Phát Sự Kiện Lên EventBus"
        message={`Bạn có chắc chắn muốn phát sự kiện vào Topic "${topic}" từ phân hệ "${sourceModule}"? Sự kiện sẽ được ghi nhận vào bảng outbox_events và phân phối tới các Consumer liên quan.`}
        confirmLabel="Phát Ngay"
        cancelLabel="Hủy Bỏ"
        variant={simulateFailure ? 'danger' : 'info'}
        onConfirm={handleExecutePublish}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
};
