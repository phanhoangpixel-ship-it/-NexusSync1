import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, ShieldCheck, Lock, ArrowRight, FileCheck, Layers, Cpu, Sparkles, AlertCircle } from 'lucide-react';

interface HandoverChecklistDrawerProps {
  isOpen: boolean;
  project: any;
  onClose: () => void;
  onSuccess: () => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
  onOpenRegisterSku?: () => void;
}

export const HandoverChecklistDrawer: React.FC<HandoverChecklistDrawerProps> = ({
  isOpen,
  project,
  onClose,
  onSuccess,
  onNotify,
  onOpenRegisterSku,
}) => {
  const [checklist, setChecklist] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [signoffNotes, setSignoffNotes] = useState('Nghiệm thu toàn diện các chỉ tiêu kỹ thuật và sinh thái.');
  const [signing, setSigning] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchChecklist = async () => {
    if (!project?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/rd/projects/${project.id}/handover-checklist`);
      if (res.ok) {
        const data = await res.json();
        setChecklist(data);
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi tải checklist', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && project) {
      fetchChecklist();
    }
  }, [isOpen, project]);

  if (!isOpen || !project) return null;

  // Quick action: Evaluate sample with PASS
  const handleQuickPassSample = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/rd/samples/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          evaluationScore: 95.0,
          result: 'PASS',
          evaluatorName: 'Trưởng Phòng Lab Nghiên Cứu',
          evaluationType: 'TECHNICAL',
          notes: 'Đánh giá mẫu phòng Lab đạt 95/100 điểm, đủ điều kiện phê duyệt kỹ thuật.',
        }),
      });
      if (res.ok) {
        onNotify('success', 'Đánh giá mẫu PASS', 'Đã ghi nhận kết quả đánh giá mẫu thử nghiệm đạt chuẩn.');
        await fetchChecklist();
      } else {
        const err = await res.json();
        onNotify('danger', 'Lỗi đánh giá mẫu', err.error);
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi mạng', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Quick action: Eco compliance check with PASS
  const handleQuickPassEco = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/rd/eco-compliance/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          standardName: 'RoHS 2011/65/EU & REACH',
          status: 'PASS',
          checkedBy: 'Ban Kiểm Định Sinh Thái EHS',
          notes: 'Đạt đầy đủ tiêu chuẩn phát thải thấp, không chứa kim loại nặng.',
        }),
      });
      if (res.ok) {
        onNotify('success', 'Xác thực sinh thái PASS', 'Đã xác thực tuân thủ RoHS / REACH đạt chuẩn.');
        await fetchChecklist();
      } else {
        const err = await res.json();
        onNotify('danger', 'Lỗi kiểm định sinh thái', err.error);
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi mạng', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSignoff = async () => {
    setSigning(true);
    try {
      const res = await fetch(`/api/rd/projects/${project.id}/handover-signoff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signoffNotes,
          authorizedBy: 'Hội đồng Khoa học NexusSync & Giám đốc R&D',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onNotify('success', 'Nghiệm thu bàn giao thành công', data.message);
        onSuccess();
        onClose();
      } else {
        const err = await res.json();
        onNotify('danger', 'Lỗi bàn giao', err.error);
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi mạng', err.message);
    } finally {
      setSigning(false);
    }
  };

  const handleDelegateBom = async () => {
    try {
      const res = await fetch('/api/rd/boms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rdProjectId: project.id,
          formulaVersion: 'v2.0',
          skuCode: project.targetSku || `SKU-RD-${project.projectCode}`,
          outputUom: 'Pcs',
          items: [
            { componentName: 'Silicon Wafer 300mm', quantity: 1, uom: 'Pcs', scrapFactor: 0.02 },
            { componentName: 'Photoresist EUV', quantity: 0.05, uom: 'Lít', scrapFactor: 0.05 },
            { componentName: 'Hóa chất SiH4', quantity: 0.1, uom: 'Kg', scrapFactor: 0.01 },
          ],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onNotify('success', 'Bàn giao BOM thành công', data.message);
        fetchChecklist();
      } else {
        const err = await res.json();
        onNotify('danger', 'Lỗi bàn giao BOM', err.error);
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi mạng', err.message);
    }
  };

  const handleCreatePilotBatch = async () => {
    try {
      const res = await fetch(`/api/rd/projects/${project.id}/pilot-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity: 100,
          targetWarehouseId: 1,
          operatorName: 'Ban Kỹ Thuật Sản Xuất MES',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onNotify('success', 'Tạo lệnh pilot batch thành công', data.message);
        fetchChecklist();
      } else {
        const err = await res.json();
        onNotify('danger', 'Lỗi tạo mẻ thử nghiệm', err.error);
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi mạng', err.message);
    }
  };

  const isReadyForHandover =
    checklist?.sampleEvaluationPassed &&
    checklist?.ecoCompliancePassed &&
    checklist?.itemMasterSkuRegistered;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-xl w-full p-6 space-y-4 border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
          <div className="flex items-center gap-2.5">
            <FileCheck className="w-6 h-6 text-purple-600" />
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                Biên Bản Nghiệm Thu &amp; Bàn Giao R&amp;D (Stage-Gate Gate 5)
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                Dự án: [{project.projectCode}] {project.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Project Lock Status Banner if locked */}
        {project.isLocked ? (
          <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl flex items-center gap-2.5 text-xs text-purple-900 dark:text-purple-300">
            <Lock className="w-5 h-5 shrink-0 text-purple-600" />
            <div>
              <span className="font-bold">Đề Tài Đã Bàn Giao &amp; Khóa Bất Biến (Rule #16): </span>
              Đề tài đã hoàn tất chuyển giao sang MES M25. Toàn bộ thông số công thức và kết quả thử nghiệm được lưu trữ bất biến phục vụ Audit Trail.
            </div>
          </div>
        ) : (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center gap-2.5 text-xs text-blue-900 dark:text-blue-300">
            <ShieldCheck className="w-5 h-5 shrink-0 text-blue-600" />
            <div>
              <span className="font-bold">Quy trình Stage-Gate Khắt Khe: </span>
              Cần hoàn thành 3 điều kiện tiên quyết (Mẫu thử nghiệm, Tuân thủ sinh thái, và Đăng ký SKU) trước khi Hội đồng Khoa học ký biên bản bàn giao.
            </div>
          </div>
        )}

        {/* Checklist Steps */}
        <div className="space-y-3 text-xs">
          {/* Item 1: Sample Evaluation */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              {checklist?.sampleEvaluationPassed ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-amber-500 shrink-0" />
              )}
              <div>
                <span className="font-bold text-slate-800 dark:text-white block">
                  1. Đánh Giá Mẫu Thử Nghiệm (Lab Sample Test)
                </span>
                <span className="text-[11px] text-slate-500">
                  {checklist?.sampleEvaluationPassed
                    ? 'Đã đạt chỉ tiêu chất lượng (PASS)'
                    : 'Chưa có kết quả thử nghiệm PASS từ phòng Lab'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!checklist?.sampleEvaluationPassed && !project.isLocked && (
                <button
                  type="button"
                  onClick={handleQuickPassSample}
                  disabled={actionLoading}
                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded font-semibold text-[11px] transition-colors"
                >
                  {actionLoading ? 'Đang duyệt...' : 'Duyệt PASS Ngay'}
                </button>
              )}
              <span
                className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                  checklist?.sampleEvaluationPassed
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                }`}
              >
                {checklist?.sampleEvaluationPassed ? 'PASS' : 'PENDING'}
              </span>
            </div>
          </div>

          {/* Item 2: Eco Compliance */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              {checklist?.ecoCompliancePassed ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-amber-500 shrink-0" />
              )}
              <div>
                <span className="font-bold text-slate-800 dark:text-white block">
                  2. Tuân Thủ Tiêu Chuẩn Sinh Thái &amp; Pháp Lý
                </span>
                <span className="text-[11px] text-slate-500">
                  {checklist?.ecoCompliancePassed
                    ? 'Đạt chứng nhận RoHS / REACH / ISO 14001'
                    : 'Chưa có bản ghi xác thực tuân thủ PASS'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!checklist?.ecoCompliancePassed && !project.isLocked && (
                <button
                  type="button"
                  onClick={handleQuickPassEco}
                  disabled={actionLoading}
                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded font-semibold text-[11px] transition-colors"
                >
                  {actionLoading ? 'Đang duyệt...' : 'Duyệt RoHS/REACH'}
                </button>
              )}
              <span
                className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                  checklist?.ecoCompliancePassed
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                }`}
              >
                {checklist?.ecoCompliancePassed ? 'PASS' : 'PENDING'}
              </span>
            </div>
          </div>

          {/* Item 3: Commercial SKU Registration */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              {checklist?.itemMasterSkuRegistered ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-amber-500 shrink-0" />
              )}
              <div>
                <span className="font-bold text-slate-800 dark:text-white block">
                  3. Đăng Ký SKU Item Master (M07)
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {checklist?.itemMasterSkuRegistered
                    ? `SKU: ${checklist.targetSku}`
                    : 'Chưa tạo mã sản phẩm chính thức'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!checklist?.itemMasterSkuRegistered && !project.isLocked && onOpenRegisterSku && (
                <button
                  type="button"
                  onClick={onOpenRegisterSku}
                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded font-semibold text-[11px] transition-colors"
                >
                  Đăng Ký SKU Ngay
                </button>
              )}
              <span
                className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                  checklist?.itemMasterSkuRegistered
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                }`}
              >
                {checklist?.itemMasterSkuRegistered ? 'REGISTERED' : 'PENDING'}
              </span>
            </div>
          </div>

          {/* Inter-module delegation actions */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleDelegateBom}
              className="p-2.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800 rounded-xl text-blue-700 dark:text-blue-300 font-semibold flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-600" />
                <span>Bàn Giao BOM Sang MES M25</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleCreatePilotBatch}
              className="p-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 font-semibold flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>Lệnh Mẻ Thử Nghiệm Pilot (100 Pcs)</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Sign-off Form */}
          {!project.isLocked && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nội Dung Kết Luận Nghiệm Thu Bàn Giao:
                </label>
                <textarea
                  rows={2}
                  value={signoffNotes}
                  onChange={(e) => setSignoffNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-200"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  disabled={!isReadyForHandover || signing}
                  onClick={handleSignoff}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold flex items-center gap-1.5 disabled:opacity-50 shadow-2xs cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>{signing ? 'Đang ký...' : 'Ký Biên Bản & Khóa Đề Tài'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
