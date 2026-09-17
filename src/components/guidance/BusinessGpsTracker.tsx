import React, { useState } from 'react';
import {
  Compass,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Info,
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles,
  Workflow,
} from 'lucide-react';
import { BUSINESS_JOURNEYS } from '../../services/guidanceEngine';
import { BusinessGpsStep, BusinessJourneyTracker } from '../../types/guidance';
import { WorkflowVisualizer } from './WorkflowVisualizer';

interface BusinessGpsTrackerProps {
  currentModuleId?: string;
  defaultJourneyId?: string;
  onNavigateToStepModule?: (moduleId: string) => void;
  className?: string;
}

export const BusinessGpsTracker: React.FC<BusinessGpsTrackerProps> = ({
  currentModuleId = 'M01',
  defaultJourneyId = 'JOURNEY_O2C',
  onNavigateToStepModule,
  className = '',
}) => {
  // Select initial journey matching current module, or fallback to default
  const [selectedJourneyId, setSelectedJourneyId] = useState<string>(() => {
    if (currentModuleId === 'M08' || currentModuleId === 'M09' || currentModuleId === 'M10') return 'JOURNEY_P2P';
    if (currentModuleId === 'M13' || currentModuleId === 'M14' || currentModuleId === 'M41') return 'JOURNEY_O2C';
    if (currentModuleId === 'M19' || currentModuleId === 'M20') return 'JOURNEY_INVENTORY';
    if (currentModuleId === 'M15') return 'JOURNEY_RETURNS';
    if (currentModuleId === 'M25' || currentModuleId === 'M26') return 'JOURNEY_MANUFACTURING';
    return defaultJourneyId;
  });

  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [selectedStepDetail, setSelectedStepDetail] = useState<BusinessGpsStep | null>(null);

  const activeJourney: BusinessJourneyTracker =
    BUSINESS_JOURNEYS.find((j) => j.id === selectedJourneyId) || BUSINESS_JOURNEYS[0];

  const processIdMap: Record<string, 'P2P' | 'O2C' | 'INVENTORY' | 'RETURNS' | 'MANUFACTURING'> = {
    JOURNEY_P2P: 'P2P',
    JOURNEY_O2C: 'O2C',
    JOURNEY_INVENTORY: 'INVENTORY',
    JOURNEY_RETURNS: 'RETURNS',
    JOURNEY_MANUFACTURING: 'MANUFACTURING',
  };
  const activeProcessId = processIdMap[selectedJourneyId] || 'P2P';

  return (
    <div
      id="business-gps-tracker"
      className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all ${className}`}
    >
      {/* Tracker Header */}
      <div className="px-5 py-3.5 bg-slate-900 dark:bg-slate-950 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-400/40 text-blue-400 flex items-center justify-center shrink-0">
            <Compass className="w-4 h-4 text-blue-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase tracking-wider">
                Business GPS
              </span>
              <span className="text-xs text-slate-300 font-semibold">
                Bản Đồ Hành Trình Nghiệp Vụ
              </span>
            </div>
            <h3 className="text-sm font-bold text-white tracking-tight mt-0.5">
              {activeJourney.name}
            </h3>
          </div>
        </div>

        {/* Journey Selector Dropdown & Toggle Expand */}
        <div className="flex items-center gap-2">
          <select
            value={selectedJourneyId}
            onChange={(e) => {
              setSelectedJourneyId(e.target.value);
              setSelectedStepDetail(null);
            }}
            className="bg-slate-800 dark:bg-slate-900 hover:bg-slate-700 dark:hover:bg-slate-800 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-700 dark:border-slate-700 outline-none cursor-pointer transition-colors"
          >
            {BUSINESS_JOURNEYS.map((j) => (
              <option key={j.id} value={j.id}>
                {j.code}: {j.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title={isExpanded ? 'Thu gọn Business GPS' : 'Mở rộng Business GPS'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* GPS Content (Collapsible) */}
      {isExpanded && (
        <div className="p-5 flex flex-col gap-4 bg-slate-50/50 dark:bg-slate-950/60">
          {/* Summary Status Strip: Where you are / What's done / Remaining */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Bạn đang ở đâu
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Bước {activeJourney.currentStepIndex}/{activeJourney.totalSteps}: {activeJourney.currentActionSummary}
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Tiến độ hành trình
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {Math.round(((activeJourney.currentStepIndex - 1) / activeJourney.totalSteps) * 100)}% Hoàn thành
                </span>
                <span className="text-slate-400 dark:text-slate-500 text-xs">
                  (Còn {activeJourney.remainingStepsCount} bước tiếp theo)
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Điều kiện tiếp tục
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-1 truncate" title={activeJourney.nextStepRequirement}>
                {activeJourney.nextStepRequirement}
              </p>
            </div>
          </div>

          {/* Stepper Pipeline */}
          <div className="overflow-x-auto pb-2">
            <div className="flex items-center min-w-[700px] gap-2 pt-2">
              {activeJourney.steps.map((step, idx) => {
                const isCurrent = step.status === 'CURRENT';
                const isDone = step.status === 'COMPLETED';
                const isSelected = selectedStepDetail?.code === step.code;

                return (
                  <React.Fragment key={step.code}>
                    <div
                      onClick={() => setSelectedStepDetail(step)}
                      className={`flex-1 p-3 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                        isSelected
                          ? 'ring-2 ring-blue-500 bg-blue-50/60 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 text-slate-900 dark:text-white'
                          : isCurrent
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : isDone
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                            isCurrent
                              ? 'bg-blue-700 text-white'
                              : isDone
                              ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          Bước {step.stepIndex}
                        </span>
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        ) : isCurrent ? (
                          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        )}
                      </div>

                      <h4
                        className={`text-xs font-bold leading-tight line-clamp-1 ${
                          isCurrent
                            ? 'text-white'
                            : isDone
                            ? 'text-emerald-900 dark:text-emerald-200'
                            : 'text-slate-800 dark:text-slate-200'
                        }`}
                        title={step.name}
                      >
                        {step.name}
                      </h4>

                      <div className="mt-2 pt-1 border-t border-current/10 flex items-center justify-between text-[10px]">
                        <span className="font-mono font-semibold">{step.moduleId}</span>
                        <span>{step.moduleName}</span>
                      </div>
                    </div>

                    {idx < activeJourney.steps.length - 1 && (
                      <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-600 shrink-0" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Selected Step Drilldown */}
          {selectedStepDetail && (
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 shadow-2xs flex flex-col gap-2.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    Bước {selectedStepDetail.stepIndex}: {selectedStepDetail.code}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{selectedStepDetail.name}</h4>
                </div>

                {onNavigateToStepModule && (
                  <button
                    type="button"
                    onClick={() => onNavigateToStepModule(selectedStepDetail.moduleId)}
                    className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-lg transition-colors cursor-pointer border border-blue-200 dark:border-blue-800"
                  >
                    <span>Mở Phân Hệ {selectedStepDetail.moduleId}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 dark:text-slate-300 mt-1">
                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-200 block mb-0.5">Điều kiện tiên quyết:</span>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-600 dark:text-slate-300">
                    {selectedStepDetail.preconditions.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-200 block mb-0.5">Kết quả đầu ra (Output):</span>
                  <p className="text-slate-600 dark:text-slate-300">{selectedStepDetail.output}</p>
                </div>

                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-200 block mb-0.5">Phân quyền thực hiện:</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedStepDetail.allowedRoles.map((r) => (
                      <span key={r} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px] text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Integrated Workflow Visualizer (SVG Timeline) for this Journey */}
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Workflow className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                  Sơ Đồ Tiến Trình Trạng Thái & Thẩm Quyền (SVG Timeline)
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Trực quan hóa trạng thái & quy tắc chuyển đổi của {activeJourney.name}
              </span>
            </div>

            <WorkflowVisualizer
              currentModuleId={selectedStepDetail?.moduleId || currentModuleId}
              initialProcessId={activeProcessId}
              onNavigateToModule={onNavigateToStepModule}
            />
          </div>
        </div>
      )}
    </div>
  );
};
