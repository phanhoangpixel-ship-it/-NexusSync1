import React, { useState } from 'react';
import { Fingerprint, ScanFace, CheckCircle2, RefreshCw, X, Zap, ShieldCheck, Database, ArrowRight, Smartphone, AlertCircle, Copy, Check } from 'lucide-react';

interface TimeAttendanceWebhookSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete: () => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const TimeAttendanceWebhookSyncModal: React.FC<TimeAttendanceWebhookSyncModalProps> = ({
  isOpen,
  onClose,
  onSyncComplete,
  onNotify
}) => {
  if (!isOpen) return null;

  const [webhookUrl] = useState<string>('https://erp.nexussync.io/api/v1/hr/biometric/webhook-listener');
  const [apiKey] = useState<string>('nx_live_bio_77a9c21f8e9944b2');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncLogs, setSyncLogs] = useState<any[]>([]);

  const samplePayload = {
    deviceId: 'ZK-TECO-UFACE-800-FACTORY-01',
    timestamp: new Date().toISOString(),
    logs: [
      { empCode: 'EMP-00128', name: 'Nguyễn Văn An', time: '07:54:12', method: 'FACE_RECOGNITION', temp: 36.5, status: 'SUCCESS' },
      { empCode: 'EMP-00129', name: 'Trần Thị Bích', time: '07:58:33', method: 'FINGERPRINT', temp: 36.6, status: 'SUCCESS' },
      { empCode: 'EMP-00130', name: 'Lê Hoàng Minh', time: '08:04:19', method: 'FACE_RECOGNITION', temp: 36.4, status: 'LATE' },
      { empCode: 'EMP-00131', name: 'Phạm Thu Hằng', time: '08:00:00', method: 'FINGERPRINT', temp: 36.5, status: 'SUCCESS' },
      { empCode: 'EMP-00128', name: 'Nguyễn Văn An', time: '07:54:14', method: 'FACE_RECOGNITION', temp: 36.5, status: 'DUPLICATE_IGNORED' }
    ]
  };

  const copyText = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    onNotify('info', 'Đã Sao Chép', `Đã chép: ${field}`);
  };

  const handleTriggerWebhookSync = async () => {
    setIsSyncing(true);
    setSyncLogs([]);

    setTimeout(() => {
      setSyncLogs(samplePayload.logs);
      setIsSyncing(false);
      onNotify('success', 'Đồng Bộ Thành Công', `Đã tiếp nhận 5 bản ghi quẹt thẻ từ Máy chấm công Khuôn mặt Nhà máy SMT. Lọc bỏ 1 bản ghi trùng lặp (Deduplicated).`);
      onSyncComplete();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <ScanFace className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Cổng Webhook Máy Chấm Công Vân Tay & Khuôn Mặt</h3>
              <p className="text-[11px] text-slate-300">Tự động đẩy dữ liệu quẹt thẻ theo thời gian thực (Push Data Protocol)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Webhook Configuration Box */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Cấu Hình Kết Nối API Thiết Bị (Hardware Webhook URL)
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold">
                Port: 443 HTTPS Active
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <div className="truncate pr-2">
                  <span className="text-[10px] text-slate-500 block">Webhook Listener Endpoint:</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold text-[11px]">{webhookUrl}</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyText(webhookUrl, 'Webhook URL')}
                  className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                >
                  {copiedField === 'Webhook URL' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <div className="truncate pr-2">
                  <span className="text-[10px] text-slate-500 block">Secret Token (Authorization Bearer):</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-[11px]">{apiKey}</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyText(apiKey, 'API Key')}
                  className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                >
                  {copiedField === 'API Key' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Simulate Action Button */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800">
            <div>
              <span className="font-bold text-indigo-950 dark:text-indigo-200 block">Thử Nghiệm Nhận Payload Chấm Công</span>
              <span className="text-[11px] text-indigo-700 dark:text-indigo-400">Giả lập máy ZKTeco / Hikvision gửi gói tin quẹt thẻ ca sáng</span>
            </div>
            <button
              type="button"
              disabled={isSyncing}
              onClick={handleTriggerWebhookSync}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              Bắn Payload Chấm Công (Simulate Push)
            </button>
          </div>

          {/* Live Ingested Logs */}
          {syncLogs.length > 0 && (
            <div className="space-y-2 animate-in fade-in duration-200">
              <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                Nhật Ký Quẹt Thẻ Vừa Tiếp Nhận ({syncLogs.length} bản ghi):
              </span>
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="p-2">Mã NV</th>
                      <th className="p-2">Họ & Tên</th>
                      <th className="p-2 text-center">Giờ Quẹt</th>
                      <th className="p-2 text-center">Phương Thức</th>
                      <th className="p-2 text-center">Trạng Thái Xử Lý</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
                    {syncLogs.map((log, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-2 font-mono font-bold text-indigo-600 dark:text-indigo-400">{log.empCode}</td>
                        <td className="p-2 font-medium">{log.name}</td>
                        <td className="p-2 text-center font-mono">{log.time}</td>
                        <td className="p-2 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {log.method === 'FACE_RECOGNITION' ? 'Nhận diện Khuôn mặt' : 'Vân tay'}
                          </span>
                        </td>
                        <td className="p-2 text-center">
                          {log.status === 'DUPLICATE_IGNORED' ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700">
                              Trùng lặp (Bỏ qua)
                            </span>
                          ) : log.status === 'LATE' ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                              Đi muộn (+4p)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                              Hợp lệ (Đúng giờ)
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-colors shadow-xs"
          >
            Hoàn Tất & Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
