import React from 'react';
import {
  Sparkles,
  Play,
  CheckCircle2,
  RefreshCw,
  Terminal,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface TestTask {
  id: number;
  name: string;
  status: 'IDLE' | 'RUNNING' | 'PASSED' | 'FAILED';
  logs: string;
}

interface M13TestRunnerTabProps {
  testTasks: TestTask[];
  runningTestId: number | null;
  onRunTaskTest: (taskId: number) => void;
  onRunAllTasks: () => void;
}

export const M13TestRunnerTab: React.FC<M13TestRunnerTabProps> = ({
  testTasks,
  runningTestId,
  onRunTaskTest,
  onRunAllTasks,
}) => {
  const passedCount = testTasks.filter((t) => t.status === 'PASSED').length;

  return (
    <div className="space-y-4">
      {/* Test Suite Header */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold">
              AUTOMATED TASK RUNNER • O2C LIFE-CYCLE
            </span>
            <span className="text-xs text-slate-500 font-semibold">
              Xác thực trọn vẹn chu trình Order-to-Cash
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
            Bàn Kiểm Thử Tự Động Từng Task Nghiệp Vụ M13
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Thực thi kiểm tra tính toàn vẹn giữa Sales Orders, Đặt cọc/Thanh toán, Ký số HSM Hóa đơn VAT, Giữ chỗ kho M17 và Sổ cái Kế toán GL M30.
          </p>
        </div>

        <button
          type="button"
          onClick={onRunAllTasks}
          disabled={runningTestId !== null}
          className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
        >
          <Zap className="w-4 h-4" />
          <span>Chạy Tất Cả 5 Kịch Bản (Run All)</span>
        </button>
      </div>

      {/* Test Tasks List */}
      <div className="space-y-3">
        {testTasks.map((task) => {
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
              } shadow-2xs space-y-3`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-xs ${
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
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {task.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Trạng thái:{' '}
                      <span
                        className={`font-mono font-bold ${
                          isPassed
                            ? 'text-emerald-600'
                            : isRunning
                            ? 'text-blue-600'
                            : 'text-slate-500'
                        }`}
                      >
                        {task.status}
                      </span>
                    </div>
                  </div>
                </div>

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
