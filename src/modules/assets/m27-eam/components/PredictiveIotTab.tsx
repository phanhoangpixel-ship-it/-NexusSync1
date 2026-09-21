import React, { useState, useEffect } from 'react';
import {
  Activity,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Cpu,
  Flame,
  Gauge,
  Layers,
  Wrench,
  Radio,
} from 'lucide-react';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';

interface PredictiveIotTabProps {
  onOpenCreateWoModal: (asset?: any) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const PredictiveIotTab: React.FC<PredictiveIotTabProps> = ({
  onOpenCreateWoModal,
  onNotify,
}) => {
  const [telemetryData, setTelemetryData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isScanConfirmOpen, setIsScanConfirmOpen] = useState(false);

  const fetchTelemetry = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/eam/iot-telemetry');
      if (res.ok) {
        const data = await res.json();
        setTelemetryData(data);
      }
    } catch (err) {
      console.error('Error fetching IoT telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, []);

  const handleRunAiScan = async () => {
    setIsScanConfirmOpen(false);
    setIsScanning(true);
    try {
      const res = await fetch('/api/eam/iot-telemetry/scan', {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        onNotify(
          'warning',
          'AI Anomaly Detection: Phát hiện 1 bất thường',
          data.details?.[0]?.observation || 'Phát hiện cảnh báo độ rung trên trạm robot hàn laser AST-0003.'
        );
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi quét IoT', err.message);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* L0 BANNER / TELEMETRY HERO */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-xs">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold rounded">
                MQTT GATEWAY: 12/12 ONLINE
              </span>
              <span className="text-[11px] text-slate-400 font-mono">Edge Computing • Sampling Rate 100Hz</span>
            </div>
            <h3 className="text-base font-bold text-white mt-1">
              Giám Sát Cảm Biến Thời Gian Thực &amp; Dự Đoán Hỏng Hóc (Predictive AI)
            </h3>
            <p className="text-xs text-slate-300 mt-0.5 max-w-2xl">
              Thu thập rung động 3 trục (Vibration mm/s), nhiệt độ ổ bi (°C), dòng tải điện và áp suất để dự đoán sớm nguy cơ hư hỏng.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsScanConfirmOpen(true)}
          disabled={isScanning}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 whitespace-nowrap cursor-pointer disabled:opacity-50"
        >
          <Activity className="w-4 h-4" />
          <span>{isScanning ? 'Đang Chạy AI Anomaly Scan...' : 'Chạy Quét AI Anomaly Detection'}</span>
        </button>
      </div>

      {/* KPI METRICS OVERVIEW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Cảm Biến Trực Tuyến
          </span>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">12 / 12</div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">100% gateway kết nối ổn định</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Nhiệt Độ Trục Bình Quân
          </span>
          <div className="mt-2 text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">58.2 °C</div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">Ngưỡng cảnh báo: &gt; 70 °C</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Độ Rung Động Bình Quân
          </span>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">1.6 mm/s</div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">Đạt chuẩn ISO 10816 Loại II</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Rủi Ro Dừng Máy (Downtime)
          </span>
          <div className="mt-2 text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400">2.4%</div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">Mức độ an toàn cao</span>
        </div>
      </div>

      {/* SENSORS TELEMETRY LIST */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
            Dữ Liệu Đo Lường Cảm Biến Theo Từng Trạm Thiết Bị
          </h4>
          <button
            onClick={fetchTelemetry}
            className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            title="Cập nhật cảm biến"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(telemetryData?.telemetry || []).map((t: any, idx: number) => {
            const isWarning = t.status === 'WARNING';
            return (
              <div
                key={idx}
                className={`p-4 rounded-2xl border transition-all space-y-3 ${
                  isWarning
                    ? 'border-amber-400 dark:border-amber-600/80 bg-amber-50/40 dark:bg-amber-950/20'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-400">
                        {t.assetCode}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isWarning
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white mt-1">{t.assetName}</h5>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Health Score</span>
                    <span
                      className={`font-mono text-base font-bold ${
                        t.healthScore < 85 ? 'text-amber-600' : 'text-emerald-600'
                      }`}
                    >
                      {t.healthScore}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center text-xs pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Nhiệt Độ</span>
                    <strong className="font-mono text-slate-900 dark:text-white text-xs">{t.temperature}°C</strong>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Độ Rung</span>
                    <strong className="font-mono text-slate-900 dark:text-white text-xs">{t.vibration} mm/s</strong>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Dòng Tải</span>
                    <strong className="font-mono text-slate-900 dark:text-white text-xs">{t.current} A</strong>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Áp Suất</span>
                    <strong className="font-mono text-slate-900 dark:text-white text-xs">{t.pressure} bar</strong>
                  </div>
                </div>

                {isWarning && (
                  <div className="p-2.5 bg-amber-100 dark:bg-amber-950/80 rounded-xl border border-amber-300 dark:border-amber-700 text-xs flex items-center justify-between gap-2">
                    <span className="text-amber-900 dark:text-amber-200 text-[11px] font-semibold">
                      Cảnh báo rung động &gt; 3.0 mm/s. Cần tra dầu &amp; siết bạc đạn!
                    </span>
                    <button
                      onClick={() => onOpenCreateWoModal()}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold transition-all shrink-0 cursor-pointer"
                    >
                      Lập Phiếu WO
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* CONFIRM AI ANOMALY SCAN */}
      <ConfirmDialog
        isOpen={isScanConfirmOpen}
        title="Chạy Quét Cảm Biến & Dự Đoán Hỏng Hóc (Predictive AI)?"
        message="Hệ thống sẽ đồng bộ dữ liệu tức thời từ 12 cụm cảm biến IoT công nghiệp, phân tích phổ tần FFT và ước lượng rủi ro dừng máy dây chuyền."
        variant="primary"
        confirmText="Bắt Đầu Quét AI"
        cancelText="Hủy"
        onConfirm={handleRunAiScan}
        onClose={() => setIsScanConfirmOpen(false)}
      />
    </div>
  );
};
