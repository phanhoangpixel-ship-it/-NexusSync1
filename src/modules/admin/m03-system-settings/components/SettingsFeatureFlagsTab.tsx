import React, { useState, useEffect } from 'react';
import {
  ToggleLeft,
  ToggleRight,
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Shield,
  Zap,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Tag,
  Search,
  Sparkles,
} from 'lucide-react';
import { SystemFeatureFlag, NotificationTemplate } from './types';
import ConfirmDialog, { ConfirmDialogProps } from '../../../../components/common/ConfirmDialog';

interface SettingsFeatureFlagsTabProps {
  onNotify?: (notification: { type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string }) => void;
  currentUser?: any;
}

export const SettingsFeatureFlagsTab: React.FC<SettingsFeatureFlagsTabProps> = ({
  onNotify,
  currentUser,
}) => {
  const [flags, setFlags] = useState<SystemFeatureFlag[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loadingFlags, setLoadingFlags] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [activeSection, setActiveSection] = useState<'FLAGS' | 'TEMPLATES'>('FLAGS');

  // Edit template modal
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Partial<NotificationTemplate> | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogProps['dialog'] | null>(null);

  const fetchFlags = async () => {
    setLoadingFlags(true);
    try {
      const res = await fetch('/api/settings/feature-flags');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setFlags(json.data);
      }
    } catch (err) {
      console.error('Error fetching flags:', err);
    } finally {
      setLoadingFlags(false);
    }
  };

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await fetch('/api/settings/notification-templates');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setTemplates(json.data);
      }
    } catch (err) {
      console.error('Error fetching templates:', err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  useEffect(() => {
    fetchFlags();
    fetchTemplates();
  }, []);

  const handleToggleFlag = (flag: SystemFeatureFlag) => {
    const nextState = !flag.isEnabled;
    setConfirmDialog({
      isOpen: true,
      title: `${nextState ? 'Bật' : 'Tắt'} Tính Năng: ${flag.flagName}`,
      message: `Bạn đang chuẩn bị ${nextState ? 'kích hoạt' : 'vô hiệu hóa'} cờ tính năng "${flag.flagKey}". Việc này sẽ thay đổi hành vi nghiệp vụ ngay lập tức cho toàn bộ người dùng trong hệ thống. Bạn có chắc chắn?`,
      confirmLabel: nextState ? 'Kích hoạt cờ' : 'Tắt tính năng',
      cancelLabel: 'Bỏ qua',
      variant: nextState ? 'primary' : 'warning',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/settings/feature-flags/${flag.flagKey}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isEnabled: nextState }),
          });
          const json = await res.json();
          if (json.success) {
            onNotify?.({
              type: 'success',
              title: 'Cập Nhật Cờ Tính Năng',
              message: json.message || `Đã ${nextState ? 'bật' : 'tắt'} ${flag.flagName}.`,
            });
            fetchFlags();
          } else {
            throw new Error(json.error || 'Cập nhật thất bại');
          }
        } catch (err: any) {
          onNotify?.({
            type: 'error',
            title: 'Lỗi Cập Nhật Cờ Tính Năng',
            message: err.message,
          });
        }
      },
    });
  };

  const handleSaveTemplate = async () => {
    const idOrKey = editingTemplate?.id || editingTemplate?.templateCode || (editingTemplate as any)?.templateKey;
    const bodyContent = editingTemplate?.templateBody || (editingTemplate as any)?.bodyTemplate;

    if (!idOrKey || !editingTemplate?.subject || !bodyContent) {
      onNotify?.({
        type: 'warning',
        title: 'Thiếu Dữ Liệu',
        message: 'Vui lòng điền đầy đủ Tiêu đề và Nội dung mẫu thông báo.',
      });
      return;
    }

    try {
      const res = await fetch(`/api/settings/notification-templates/${idOrKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editingTemplate,
          templateBody: bodyContent,
        }),
      });
      const json = await res.json();
      if (json.success) {
        onNotify?.({
          type: 'success',
          title: 'Cập Nhật Mẫu Thông Báo',
          message: json.message || 'Đã lưu mẫu thông báo thành công.',
        });
        setTemplateModalOpen(false);
        setEditingTemplate(null);
        fetchTemplates();
      } else {
        throw new Error(json.error || 'Lưu thất bại');
      }
    } catch (err: any) {
      onNotify?.({
        type: 'error',
        title: 'Lỗi Lưu Mẫu Thông Báo',
        message: err.message,
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* SECTION SELECTOR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSection('FLAGS')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${
              activeSection === 'FLAGS'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Cờ Tính Năng Động (Dynamic Feature Flags)</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 font-mono">
              {flags.length}
            </span>
          </button>
          <button
            onClick={() => setActiveSection('TEMPLATES')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${
              activeSection === 'TEMPLATES'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Mẫu Thông Báo Sự Kiện (Notification Templates)</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 font-mono">
              {templates.length}
            </span>
          </button>
        </div>
      </div>

      {/* FEATURE FLAGS VIEW */}
      {activeSection === 'FLAGS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {flags.map((flag) => {
              const isEnabled = flag.isEnabled;
              return (
                <div
                  key={flag.flagKey}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700">
                        {flag.flagKey}
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {flag.category}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        {flag.flagName}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {flag.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-100 dark:border-slate-800/80">
                    <span
                      className={`text-xs font-semibold ${
                        isEnabled
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {isEnabled ? 'Đang kích hoạt' : 'Đã vô hiệu hóa'}
                    </span>

                    <button
                      onClick={() => handleToggleFlag(flag)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        isEnabled
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {isEnabled ? (
                        <>
                          <ToggleRight className="w-4 h-4 text-emerald-600" />
                          <span>BẬT</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4 text-slate-400" />
                          <span>TẮT</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* NOTIFICATION TEMPLATES VIEW */}
      {activeSection === 'TEMPLATES' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-500" />
              Danh Sách Mẫu Thông Báo Sự Kiện Nghiệp Vụ Toàn Hệ Thống
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Hệ thống EventBus tự động kích hoạt gửi Email/SMS/In-App thông báo theo nội dung khuôn mẫu đã được cấu hình tại đây.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700/70 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Mã Sự Kiện</th>
                  <th className="py-3 px-4">Tên Thông Báo</th>
                  <th className="py-3 px-4">Kênh Gửi</th>
                  <th className="py-3 px-4">Tiêu Đề (Subject)</th>
                  <th className="py-3 px-4">Trạng Thái</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {templates.map((tpl, idx) => {
                  const uniqueKey = tpl.id ? `tpl-id-${tpl.id}` : (tpl.templateCode || (tpl as any).templateKey || `tpl-row-${idx}`);
                  const displayCode = tpl.templateCode || (tpl as any).templateKey || `TPL-${idx + 1}`;
                  return (
                    <tr
                      key={uniqueKey}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-100">
                        <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          {displayCode}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                        {tpl.templateName}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono text-[11px]">
                          {tpl.channel === 'EMAIL' && <Mail className="w-3 h-3 text-blue-500" />}
                          {tpl.channel === 'SMS' && <Smartphone className="w-3 h-3 text-emerald-500" />}
                          {tpl.channel === 'IN_APP' && <Bell className="w-3 h-3 text-amber-500" />}
                          {tpl.channel}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-800 dark:text-slate-200 font-medium max-w-xs truncate">
                        {tpl.subject}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            tpl.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800'
                              : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {tpl.isActive ? 'Đang kích hoạt' : 'Tạm dừng'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setEditingTemplate({
                              ...tpl,
                              templateBody: tpl.templateBody || (tpl as any).bodyTemplate || '',
                              bodyTemplate: tpl.templateBody || (tpl as any).bodyTemplate || '',
                            });
                            setTemplateModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
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

      {/* EDIT TEMPLATE MODAL */}
      {templateModalOpen && editingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-xl w-full p-5 shadow-xl space-y-4 animate-in zoom-in-95 duration-150">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-blue-500" />
              Chỉnh Sửa Mẫu Thông Báo: {editingTemplate.templateName}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Tiêu Đề Email / Thông Báo</label>
                <input
                  type="text"
                  value={editingTemplate.subject || ''}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Nội Dung Khuôn Mẫu (Template Body)</label>
                <textarea
                  rows={5}
                  value={editingTemplate.templateBody || (editingTemplate as any).bodyTemplate || ''}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, templateBody: e.target.value, bodyTemplate: e.target.value } as any)}
                  className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-semibold mb-1">
                  Các biến hệ thống hỗ trợ chèn tự động:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(editingTemplate.placeholders
                    ? editingTemplate.placeholders.split(',').map((s) => s.trim())
                    : ((editingTemplate as any).availableVariables || ['{docNumber}', '{amount}', '{userName}', '{supplierName}'])
                  ).map((v, vIdx) => (
                    <span
                      key={`${v}-${vIdx}`}
                      className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-mono text-[11px] border border-slate-200 dark:border-slate-700"
                    >
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setTemplateModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSaveTemplate}
                className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
              >
                Lưu Mẫu Thông Báo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DIALOG */}
      <ConfirmDialog dialog={confirmDialog} onClose={() => setConfirmDialog(null)} />
    </div>
  );
};
