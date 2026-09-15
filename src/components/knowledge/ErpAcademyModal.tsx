import React, { useState } from 'react';
import {
  END_TO_END_FLOWS,
  TRAINING_SCENARIOS,
  EndToEndBusinessFlow,
  TrainingScenario,
  BusinessFlowStep,
} from '../../data/erpBusinessKnowledge';
import { MODULE_REGISTRY, ModuleDefinition } from '../../config/moduleRegistry';
import {
  GraduationCap,
  PlayCircle,
  CheckCircle2,
  GitCommit,
  ArrowRight,
  Database,
  Cpu,
  Layers,
  X,
  FileCheck,
  CheckSquare,
  Sparkles,
  RotateCcw,
  BookOpen,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { ConfirmDialogState } from '../../types';

interface ErpAcademyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectModule?: (module: ModuleDefinition) => void;
  onNavigateModule?: (moduleId: string) => void;
}

export const ErpAcademyModal: React.FC<ErpAcademyModalProps> = ({
  isOpen,
  onClose,
  onSelectModule,
  onNavigateModule,
}) => {
  const [activeTab, setActiveTab] = useState<'SCENARIOS' | 'FLOWS'>('SCENARIOS');
  const [selectedScenario, setSelectedScenario] = useState<TrainingScenario>(TRAINING_SCENARIOS[0]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [stepCompletedMap, setStepCompletedMap] = useState<Record<string, boolean>>({});
  const [selectedFlow, setSelectedFlow] = useState<EndToEndBusinessFlow>(END_TO_END_FLOWS[0]);
  const [selectedFlowStep, setSelectedFlowStep] = useState<BusinessFlowStep>(END_TO_END_FLOWS[0].steps[0]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  if (!isOpen) return null;

  const currentStep = selectedScenario.steps[currentStepIndex] || selectedScenario.steps[0];
  const stepKey = `${selectedScenario.id}_step_${currentStep.stepIndex}`;
  const isCurrentStepDone = !!stepCompletedMap[stepKey];

  const handleCompleteCurrentStep = () => {
    setStepCompletedMap((prev) => ({ ...prev, [stepKey]: true }));
    if (currentStepIndex < selectedScenario.steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handleResetScenario = () => {
    // Strictly follow Rule #19: use custom ConfirmDialog, never window.confirm
    setConfirmDialog({
      isOpen: true,
      title: 'Đặt lại bài tập thực hành?',
      message: 'Bạn có chắc chắn muốn đặt lại toàn bộ tiến độ của tình huống thực hành này để làm lại từ đầu không?',
      confirmText: 'Đặt lại',
      cancelText: 'Hủy bỏ',
      variant: 'warning',
      onConfirm: () => {
        setStepCompletedMap((prev) => {
          const updated = { ...prev };
          selectedScenario.steps.forEach((s) => {
            delete updated[`${selectedScenario.id}_step_${s.stepIndex}`];
          });
          return updated;
        });
        setCurrentStepIndex(0);
        setConfirmDialog(null);
      },
      onCancel: () => setConfirmDialog(null),
    });
  };

  const handleJumpToModule = (moduleId: string) => {
    const mod = MODULE_REGISTRY.find((m) => m.moduleId === moduleId);
    if (mod && typeof onSelectModule === 'function') {
      onSelectModule(mod);
    } else if (typeof onNavigateModule === 'function') {
      onNavigateModule(moduleId);
    }
    onClose();
  };

  return (
    <>
      <div
        id="erp-academy-modal-backdrop"
        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          id="erp-academy-dialog"
          className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-300 flex items-center justify-center shadow-inner">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white tracking-tight">
                    Học Viện Nghiệp Vụ ERP (ERP Business Academy & Guided Practice)
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    Live Simulator
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Học và thực hành các kịch bản thực tế end-to-end xuyên suốt 12 chu trình cốt lõi và 41 phân hệ
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-white/10 p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveTab('SCENARIOS')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    activeTab === 'SCENARIOS' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Tình Huống Thực Hành ({TRAINING_SCENARIOS.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('FLOWS')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    activeTab === 'FLOWS' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Sơ Đồ 12 Chu Trình E2E
                </button>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors ml-2"
                title="Đóng học viện"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* TAB 1: SCENARIOS (Guided Practice) */}
          {activeTab === 'SCENARIOS' && (
            <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-12 gap-5 min-h-0">
              {/* Scenario List (4 cols) */}
              <div className="md:col-span-4 flex flex-col gap-2 border-r border-slate-100 pr-0 md:pr-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Danh sách bài thực hành
                </h3>
                {TRAINING_SCENARIOS.map((sc) => {
                  const isSelected = selectedScenario.id === sc.id;
                  const totalSteps = sc.steps.length;
                  const doneCount = sc.steps.filter(
                    (s) => !!stepCompletedMap[`${sc.id}_step_${s.stepIndex}`]
                  ).length;
                  const isAllDone = doneCount === totalSteps;

                  return (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => {
                        setSelectedScenario(sc);
                        setCurrentStepIndex(0);
                      }}
                      className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-1 ring-blue-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {sc.domain}
                        </span>
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            sc.difficulty === 'CƠ BẢN'
                              ? 'bg-emerald-100 text-emerald-800'
                              : sc.difficulty === 'TRUNG CẤP'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {sc.difficulty}
                        </span>
                      </div>
                      <h4
                        className={`text-xs font-bold mt-1.5 line-clamp-2 ${
                          isSelected ? 'text-blue-900' : 'text-slate-800'
                        }`}
                      >
                        {sc.title}
                      </h4>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                        <span>Thời lượng: ~{sc.durationMinutes} phút</span>
                        <span className="font-mono font-bold text-blue-700">
                          {doneCount}/{totalSteps} bước
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Scenario Detail & Stepper (8 cols) */}
              <div className="md:col-span-8 flex flex-col gap-4 pl-0 md:pl-2 min-h-0">
                {/* Scenario Header Info */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{selectedScenario.title}</h3>
                      <p className="text-xs text-slate-600 mt-1">{selectedScenario.businessContext}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetScenario}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors shrink-0"
                      title="Đặt lại bài thực hành này"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-2.5 text-[11px] text-slate-500 flex items-center gap-2 border-t border-slate-200/60 pt-2">
                    <strong className="text-slate-700">Trạng thái khởi tạo:</strong>
                    <span className="font-mono">{selectedScenario.initialState}</span>
                  </div>
                </div>

                {/* Step Progress Bar */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  {selectedScenario.steps.map((step, idx) => {
                    const isDone = !!stepCompletedMap[`${selectedScenario.id}_step_${step.stepIndex}`];
                    const isCurrent = idx === currentStepIndex;

                    return (
                      <button
                        key={step.stepIndex}
                        type="button"
                        onClick={() => setCurrentStepIndex(idx)}
                        className={`flex-1 flex items-center gap-2 p-2 rounded-xl border transition-all text-left ${
                          isCurrent
                            ? 'border-blue-600 bg-blue-50/80'
                            : isDone
                            ? 'border-emerald-300 bg-emerald-50/50'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isDone
                              ? 'bg-emerald-600 text-white'
                              : isCurrent
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : step.stepIndex}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold text-slate-800 truncate">
                            Bước {step.stepIndex}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">{step.title}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Active Step Content */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-wider">
                        Phân hệ đích: {currentStep.moduleId}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-0.5">{currentStep.title}</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleJumpToModule(currentStep.moduleId)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-lg text-xs font-bold transition-all border border-slate-200"
                    >
                      <span>Mở phân hệ {currentStep.moduleId}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Instruction */}
                  <div className="p-3 rounded-lg bg-blue-50/50 border border-blue-100 text-xs text-blue-900 leading-relaxed">
                    <strong>Hướng dẫn thực hiện:</strong>
                    <p className="mt-1">{currentStep.instruction}</p>
                  </div>

                  {/* Data Payload Simulator */}
                  <div className="p-3 rounded-lg bg-slate-900 text-slate-100 text-xs font-mono">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider">
                        Dữ liệu đầu vào mô phỏng (Payload)
                      </span>
                      <span className="text-[10px] text-emerald-400">Action: {currentStep.targetAction}</span>
                    </div>
                    <pre className="text-[11px] overflow-x-auto text-emerald-300">
                      {JSON.stringify(currentStep.dataPayload, null, 2)}
                    </pre>
                  </div>

                  {/* Verification Points */}
                  <div>
                    <h5 className="text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Tiêu chuẩn kiểm thử kết quả (Verification Points):</span>
                    </h5>
                    <ul className="space-y-1 text-xs text-slate-600">
                      {currentStep.verificationPoints.map((pt, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <CheckSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Step Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-xs text-slate-500">
                      {isCurrentStepDone ? 'Đã hoàn thành bước này!' : 'Nhấn xác nhận để hoàn tất bước'}
                    </span>
                    <button
                      type="button"
                      onClick={handleCompleteCurrentStep}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                        isCurrentStepDone
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isCurrentStepDone ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Bước tiếp theo</span>
                        </>
                      ) : (
                        <>
                          <PlayCircle className="w-4 h-4" />
                          <span>Xác nhận hoàn tất bước {currentStep.stepIndex}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: END-TO-END FLOWS (12 Business Processes) */}
          {activeTab === 'FLOWS' && (
            <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-12 gap-5 min-h-0">
              {/* Flow Selector (4 cols) */}
              <div className="md:col-span-4 flex flex-col gap-2 border-r border-slate-100 pr-0 md:pr-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  12 Chu trình Doanh nghiệp E2E
                </h3>
                {END_TO_END_FLOWS.map((flow) => {
                  const isSelected = selectedFlow.id === flow.id;
                  return (
                    <button
                      key={flow.id}
                      type="button"
                      onClick={() => {
                        setSelectedFlow(flow);
                        setSelectedFlowStep(flow.steps[0]);
                      }}
                      className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-1 ring-blue-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                          {flow.code}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">{flow.steps.length} bước</span>
                      </div>
                      <h4
                        className={`text-xs font-bold mt-1.5 line-clamp-1 ${
                          isSelected ? 'text-blue-900' : 'text-slate-800'
                        }`}
                      >
                        {flow.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{flow.description}</p>
                    </button>
                  );
                })}
              </div>

              {/* Flow Visualizer & Step Pipeline (8 cols) */}
              <div className="md:col-span-8 flex flex-col gap-4 pl-0 md:pl-2">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-600 text-white">
                      {selectedFlow.code}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{selectedFlow.name}</h3>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{selectedFlow.description}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-[11px] border-t border-slate-200/60 pt-2">
                    <div>
                      <strong className="text-slate-700">Kích hoạt:</strong> {selectedFlow.trigger}
                    </div>
                    <div>
                      <strong className="text-slate-700">Kết quả cuối cùng:</strong> {selectedFlow.finalOutcome}
                    </div>
                  </div>
                </div>

                {/* Horizontal Step Pipeline Navigator */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {selectedFlow.steps.map((step) => {
                    const isStepActive = selectedFlowStep.stepNumber === step.stepNumber;
                    return (
                      <button
                        key={step.stepNumber}
                        type="button"
                        onClick={() => setSelectedFlowStep(step)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-left shrink-0 transition-all ${
                          isStepActive
                            ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-xs font-mono font-bold">#{step.stepNumber}</span>
                        <span className="text-xs font-bold truncate max-w-[120px]">{step.name}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Step Architectural Breakdown (Input -> Process -> Engine -> DB -> Output) */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-blue-600 uppercase">
                        Bước {selectedFlowStep.stepNumber} — Phân hệ {selectedFlowStep.module} ({selectedFlowStep.moduleName})
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-0.5">{selectedFlowStep.name}</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleJumpToModule(selectedFlowStep.module.split(' ')[0])}
                      className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 border border-blue-200 transition-colors"
                    >
                      Mở phân hệ
                    </button>
                  </div>

                  {/* Architecture Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <strong className="text-slate-700 flex items-center gap-1 mb-1">
                        <Layers className="w-3.5 h-3.5 text-blue-600" />
                        INPUT:
                      </strong>
                      <p className="text-slate-600">{selectedFlowStep.input}</p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <strong className="text-slate-700 flex items-center gap-1 mb-1">
                        <Cpu className="w-3.5 h-3.5 text-purple-600" />
                        CORE ENGINE:
                      </strong>
                      <p className="text-slate-600 font-mono font-medium">{selectedFlowStep.coreEngine}</p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 sm:col-span-2">
                      <strong className="text-slate-700 flex items-center gap-1 mb-1">
                        <Database className="w-3.5 h-3.5 text-emerald-600" />
                        DATABASE EFFECT (Bất biến / Sổ cái):
                      </strong>
                      <p className="text-slate-600 font-mono text-[11px]">{selectedFlowStep.databaseEffect}</p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <strong className="text-slate-700 flex items-center gap-1 mb-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        OUTPUT:
                      </strong>
                      <p className="text-slate-600">{selectedFlowStep.output}</p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <strong className="text-slate-700 flex items-center gap-1 mb-1">
                        <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                        TIẾP THEO (NEXT PROCESS):
                      </strong>
                      <p className="text-slate-600">{selectedFlowStep.nextProcess}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500 shrink-0">
            <span className="font-mono">NexusSync ERP • Knowledge & Training Engine v1.0</span>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-slate-300 hover:bg-white text-slate-700 font-semibold transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog (Rule #19) */}
      {confirmDialog && confirmDialog.isOpen && (
        <ConfirmDialog
          dialog={confirmDialog}
          onClose={() => setConfirmDialog(null)}
        />
      )}
    </>
  );
};
