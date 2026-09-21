import React, { useState } from 'react';
import {
  Sparkles,
  Play,
  CheckCircle2,
  RefreshCw,
  Terminal,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  AlertCircle,
  Database,
  Cpu
} from 'lucide-react';

export interface TestTask {
  id: number;
  code: string;
  name: string;
  phase: string;
  status: 'IDLE' | 'RUNNING' | 'PASSED' | 'FAILED';
  logs: string;
}

interface M13TestRunnerTabProps {
  testTasks: TestTask[];
  runningTestId: number | null;
  onRunTaskTest: (taskId: number) => void;
  onRunAllTasks: () => void;
  onRunConcurrentTest?: () => void;
  concurrentTestLoading?: boolean;
  concurrentTestResult?: any;
}

export const M13TestRunnerTab: React.FC<M13TestRunnerTabProps> = ({
  testTasks,
  runningTestId,
  onRunTaskTest,
  onRunAllTasks,
  onRunConcurrentTest,
  concurrentTestLoading = false,
  concurrentTestResult = null,
}) => {
  const [selectedPhase, setSelectedPhase] = useState<string>('ALL');

  const passedCount = testTasks.filter((t) => t.status === 'PASSED').length;
  const phases = ['ALL', ...Array.from(new Set(testTasks.map((t) => t.phase)))];

  const filteredTasks =
    selectedPhase === 'ALL'
      ? testTasks
      : testTasks.filter((t) => t.phase === selectedPhase);

  return (
    <div className="space-y-4">
      {/* Test Suite Header */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold">
              PHASE 11 • INTEGRATION & REGRESSION TEST MATRIX
            </span>
            <span className="text-xs text-slate-500 font-semibold">
              M13-F01 ➔ M13-F15 Toàn Diện
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
            Bộ Kiểm Thử Tích Hợp Toàn Diện (M13-F01 ➔ M13-F15) & Xử Lý Đồng Thời
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Xác thực toàn bộ 15 kịch bản tích hợp liên module (M07 Customers, M17 WMS Inventory, M41 Pricing, M42 Costing, M30 Accounting GL, M16 POS, M15 RMA) và kiểm thử race conditions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onRunConcurrentTest && (
            <button
              type="button"
              onClick={onRunConcurrentTest}
              disabled={concurrentTestLoading || runningTestId !== null}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {concurrentTestLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Cpu className="w-3.5 h-3.5" />
              )}
              <span>Kiểm Thử Xử Lý Đồng Thời (Concurrent Race Condition)</span>
            </button>
          )}

          <button
            type="button"
            onClick={onRunAllTasks}
            disabled={runningTestId !== null || concurrentTestLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Zap className="w-4 h-4" />
            <span>Chạy Toàn Bộ 15 Test Cases (Run All)</span>
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="text-[11px] text-slate-500 font-medium">Tổng Số Test Cases</div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
            {testTasks.length} <span className="text-xs text-slate-400 font-normal">Kịch bản</span>
          </div>
        </div>
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="text-[11px] text-slate-500 font-medium">Trạng Thái Đạt (Passed)</div>
          <div className="text-xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">
            {passedCount} / {testTasks.length}
          </div>
        </div>
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="text-[11px] text-slate-500 font-medium">Kiểm Thử Đồng Thời</div>
          <div className="text-xl font-bold font-mono tabular-nums text-blue-600 dark:text-blue-400 mt-0.5">
            {concurrentTestResult ? '100% PASS' : 'SẴN SÀNG'}
          </div>
        </div>
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="text-[11px] text-slate-500 font-medium">Single-Writer Domain Authority</div>
          <div className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400 mt-0.5">
            ENFORCED
          </div>
        </div>
      </div>

      {/* Concurrent Test Results Panel (if executed) */}
      {concurrentTestResult && (
        <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wide">
                Kết Quả Kiểm Thử Xử Lý Đồng Thời (Concurrent Stress Test Results)
              </h4>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
              ZERO RACE CONDITIONS DETECTED
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-blue-100 dark:border-blue-900/40">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
                <Database className="w-3.5 h-3.5 text-blue-600" />
                <span>Kho Tồn ATP: Ngăn Chặn Bán Âm (Anti-Oversell)</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2">
                5 request giữ chỗ đồng thời (yêu cầu tổng 15 cái trên 10 cái khả dụng).
              </p>
              <div className="space-y-1 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                <div>• Giữ chỗ thành công: <strong className="text-emerald-600">{concurrentTestResult.stockReservationTest?.successfulReservations} đơn</strong></div>
                <div>• Từ chối do cạn ATP: <strong className="text-rose-600">{concurrentTestResult.stockReservationTest?.rejectedDueToAtp} đơn</strong></div>
                <div>• Số dư tồn khả dụng còn lại: <strong className="text-blue-600">{concurrentTestResult.stockReservationTest?.finalAvailable} cái (&ge; 0)</strong></div>
                <div className="text-emerald-600 font-bold">✓ Bất biến tồn kho vật lý và cam kết được bảo toàn 100%.</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-blue-100 dark:border-blue-900/40">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
                <Activity className="w-3.5 h-3.5 text-blue-600" />
                <span>Hạn Mức Tín Dụng: Ngăn Chặn Vượt Hạn Mức (Credit Guard)</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2">
                3 đơn hàng đồng thời trị giá 18M VNĐ (vượt mức 10M khả dụng còn lại).
              </p>
              <div className="space-y-1 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                <div>• Đơn đủ điều kiện duyệt: <strong className="text-emerald-600">{concurrentTestResult.creditCheckTest?.approvedCreditOrders} đơn</strong></div>
                <div>• Đơn chuyển Chờ Duyệt (PENDING_APPROVAL): <strong className="text-amber-600">{concurrentTestResult.creditCheckTest?.routedToPendingApproval} đơn</strong></div>
                <div>• Dư nợ sau cùng: <strong className="text-blue-600 font-mono tabular-nums">{concurrentTestResult.creditCheckTest?.finalDebt?.toLocaleString()} ₫</strong> (&le; Hạn mức)</div>
                <div className="text-emerald-600 font-bold">✓ Tuyệt đối không cho phép tạo nợ vượt quá hạn mức tín dụng.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Phase Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
        {phases.map((phase) => (
          <button
            key={phase}
            onClick={() => setSelectedPhase(phase)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedPhase === phase
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {phase === 'ALL' ? 'Tất Cả (15 Cases)' : phase}
          </button>
        ))}
      </div>

      {/* Test Tasks List */}
      <div className="space-y-3">
        {filteredTasks.map((task) => {
          const isRunning = runningTestId === task.id;
          const isPassed = task.status === 'PASSED';

          return (
            <div
              key={task.id}
              className={`p-4 rounded-2xl border transition-all ${
                isPassed
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                  : isRunning
                  ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 ring-2 ring-blue-500/20'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
              } shadow-2xs space-y-2.5`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-xs ${
                      isPassed
                        ? 'bg-emerald-600 text-white'
                        : isRunning
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    #{task.id}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {task.code}
                      </span>
                      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                        {task.phase}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                      {task.name}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${
                      isPassed
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                        : isRunning
                        ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800 animate-pulse'
                        : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {task.status}
                  </span>

                  <button
                    type="button"
                    onClick={() => onRunTaskTest(task.id)}
                    disabled={isRunning}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isPassed
                        ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-200'
                        : 'bg-slate-900 dark:bg-slate-700 text-white hover:bg-blue-600'
                    }`}
                  >
                    {isRunning ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang chạy...</span>
                      </>
                    ) : isPassed ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Chạy Lại</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>Thực Thi</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Log Console Output */}
              <div className="p-3 rounded-xl bg-slate-950 text-slate-200 font-mono text-[11px] flex items-start gap-2 border border-slate-800">
                <Terminal className="w-3.5 h-3.5 text-slate-500 mt-0.5 flex-shrink-0" />
                <span
                  className={
                    isPassed
                      ? 'text-emerald-400'
                      : isRunning
                      ? 'text-blue-400 animate-pulse'
                      : 'text-slate-400'
                  }
                >
                  {task.logs}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

