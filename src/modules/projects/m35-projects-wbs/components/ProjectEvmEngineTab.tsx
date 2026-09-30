import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Activity,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
  BarChart3,
  Layers,
  RefreshCw
} from 'lucide-react';
import { ProjectMaster } from '../../../../types/m35Types';

interface ProjectEvmEngineTabProps {
  currentProject: ProjectMaster;
  evmMetrics: {
    bac: number;
    pv: number;
    ev: number;
    ac: number;
    cv: number;
    sv: number;
    cpi: number;
    spi: number;
    eac: number;
    etc: number;
    vac: number;
    tcpi: number;
  };
}

interface PortfolioEvmSummary {
  portfolio: {
    totalBac: number;
    totalPv: number;
    totalEv: number;
    totalAc: number;
    cv: number;
    sv: number;
    cpi: number;
    spi: number;
    eac: number;
    vac: number;
    overallStatus: string;
  };
  projects: Array<{
    id: string;
    code: string;
    name: string;
    status: string;
    bac: number;
    pv: number;
    ev: number;
    ac: number;
    cpi: number;
    spi: number;
    eac: number;
    vac: number;
    health: string;
  }>;
}

export const ProjectEvmEngineTab: React.FC<ProjectEvmEngineTabProps> = ({
  currentProject,
  evmMetrics,
}) => {
  const [viewScope, setViewScope] = useState<'PROJECT' | 'PORTFOLIO'>('PROJECT');
  const [portfolioData, setPortfolioData] = useState<PortfolioEvmSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const { bac, pv, ev, ac, cv, sv, cpi, spi, eac, etc, vac } = evmMetrics;

  const isCostGood = cpi >= 1.0;
  const isScheduleGood = spi >= 1.0;

  const fetchPortfolioEvm = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/projects/evm');
      if (res.ok) {
        const data = await res.json();
        setPortfolioData(data);
      }
    } catch (err) {
      console.warn('Error fetching portfolio EVM:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewScope === 'PORTFOLIO') {
      fetchPortfolioEvm();
    }
  }, [viewScope]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5 space-y-5">
      {/* Header */}
      <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              08. Động Cơ Phân Tích Giá Trị Thu Được (ISO 21508 EVM Engine)
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-mono">
              EVM ISO 21508
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Tính toán tự động chỉ số hiệu suất chi phí (CPI), tiến độ (SPI) và dự báo chi phí hoàn thành (EAC).
          </p>
        </div>

        {/* View Scope Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewScope('PROJECT')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewScope === 'PROJECT'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Dự Án Hiện Tại
            </button>
            <button
              type="button"
              onClick={() => setViewScope('PORTFOLIO')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewScope === 'PORTFOLIO'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Toàn Bộ Danh Mục (Portfolio)
            </button>
          </div>

          {viewScope === 'PORTFOLIO' && (
            <button
              type="button"
              onClick={fetchPortfolioEvm}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 transition cursor-pointer"
              title="Làm mới"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {viewScope === 'PROJECT' ? (
        <>
          {/* Status Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2.5 py-1 text-xs font-bold rounded-xl border flex items-center gap-1.5 ${
              isCostGood
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-300'
            }`}>
              <span className="w-2 h-2 rounded-full bg-current" />
              Chi Phí (CPI {cpi.toFixed(2)}): {isCostGood ? 'Tối Ưu / Trong Ngân Sách' : 'Vượt Ngân Sách'}
            </span>

            <span className={`px-2.5 py-1 text-xs font-bold rounded-xl border flex items-center gap-1.5 ${
              isScheduleGood
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-300'
                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-300'
            }`}>
              <span className="w-2 h-2 rounded-full bg-current" />
              Tiến Độ (SPI {spi.toFixed(2)}): {isScheduleGood ? 'Đúng Kế Hoạch' : 'Chậm Tiến Độ'}
            </span>
          </div>

          {/* 4 Core Dimensions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
              <span className="text-slate-500 dark:text-slate-400 block font-semibold">Ngân Sách Gốc (BAC):</span>
              <span className="text-base lg:text-lg font-mono font-bold text-slate-900 dark:text-white block">
                {bac.toLocaleString('vi-VN')} đ
              </span>
              <span className="text-[11px] text-slate-400 block">Budget at Completion</span>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
              <span className="text-slate-500 dark:text-slate-400 block font-semibold">Giá Trị Kế Hoạch (PV):</span>
              <span className="text-base lg:text-lg font-mono font-bold text-blue-600 dark:text-blue-400 block">
                {pv.toLocaleString('vi-VN')} đ
              </span>
              <span className="text-[11px] text-slate-400 block">Planned Value (Budgeted)</span>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
              <span className="text-slate-500 dark:text-slate-400 block font-semibold">Giá Trị Đạt Được (EV):</span>
              <span className="text-base lg:text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400 block">
                {ev.toLocaleString('vi-VN')} đ
              </span>
              <span className="text-[11px] text-slate-400 block">Earned Value (Realized)</span>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
              <span className="text-slate-500 dark:text-slate-400 block font-semibold">Chi Phí Thực Tế (AC):</span>
              <span className="text-base lg:text-lg font-mono font-bold text-rose-600 dark:text-rose-400 block">
                {ac.toLocaleString('vi-VN')} đ
              </span>
              <span className="text-[11px] text-slate-400 block">Actual Cost of Work</span>
            </div>
          </div>

          {/* Indices & Forecasts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700 dark:text-slate-300">Chỉ Số Hiệu Suất Chi Phí (CPI)</span>
                <span className={`text-base font-mono font-bold ${isCostGood ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {cpi.toFixed(2)}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {cpi >= 1 ? 'Mỗi 1 VNĐ chi ra tạo ra hơn 1 VNĐ giá trị công việc hoàn thành.' : 'Chi phí thực tế vượt trội so với khối lượng công việc đã hoàn thành.'}
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700 dark:text-slate-300">Chỉ Số Hiệu Suất Tiến Độ (SPI)</span>
                <span className={`text-base font-mono font-bold ${isScheduleGood ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {spi.toFixed(2)}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {spi >= 1 ? 'Tiến độ thực tế đang vượt hoặc bám sát tiến độ cam kết.' : 'Tiến độ thực tế đang bị trễ so với kế hoạch ban đầu.'}
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700 dark:text-slate-300">Dự Báo Chi Phí Cuối Kỳ (EAC)</span>
                <span className="text-base font-mono font-bold text-purple-600 dark:text-purple-400">
                  {eac.toLocaleString('vi-VN')} đ
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Chênh lệch ngân sách lúc kết thúc (VAC): <strong className={vac >= 0 ? 'text-emerald-600' : 'text-rose-600 font-mono'}>{vac.toLocaleString('vi-VN')} đ</strong>
              </p>
            </div>
          </div>
        </>
      ) : (
        /* PORTFOLIO EVM VIEW */
        <div className="space-y-4">
          {portfolioData?.portfolio && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                <span className="text-slate-500 dark:text-slate-400 block font-semibold uppercase">Tổng Ngân Sách Danh Mục:</span>
                <span className="text-base lg:text-lg font-mono font-bold text-slate-900 dark:text-white block">
                  {portfolioData.portfolio.totalBac.toLocaleString('vi-VN')} đ
                </span>
                <span className="text-[11px] text-slate-400 block">Total Portfolio BAC</span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                <span className="text-slate-500 dark:text-slate-400 block font-semibold uppercase">Tổng Chi Phí Thực Tế (AC):</span>
                <span className="text-base lg:text-lg font-mono font-bold text-blue-600 dark:text-blue-400 block">
                  {portfolioData.portfolio.totalAc.toLocaleString('vi-VN')} đ
                </span>
                <span className="text-[11px] text-slate-400 block">Total Portfolio Actual Cost</span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                <span className="text-slate-500 dark:text-slate-400 block font-semibold uppercase">CPI Danh Mục Toàn Doanh Nghiệp:</span>
                <span className={`text-base lg:text-lg font-mono font-bold block ${
                  portfolioData.portfolio.cpi >= 1.0 ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {portfolioData.portfolio.cpi.toFixed(2)}
                </span>
                <span className="text-[11px] text-slate-400 block">Cost Performance Index</span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                <span className="text-slate-500 dark:text-slate-400 block font-semibold uppercase">SPI Danh Mục Toàn Doanh Nghiệp:</span>
                <span className={`text-base lg:text-lg font-mono font-bold block ${
                  portfolioData.portfolio.spi >= 1.0 ? 'text-emerald-600' : 'text-amber-600'
                }`}>
                  {portfolioData.portfolio.spi.toFixed(2)}
                </span>
                <span className="text-[11px] text-slate-400 block">Schedule Performance Index</span>
              </div>
            </div>
          )}

          {/* Portfolio Projects EVM Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Mã Dự Án</th>
                  <th className="py-2.5 px-3">Tên Dự Án</th>
                  <th className="py-2.5 px-3 text-right">Ngân Sách (BAC)</th>
                  <th className="py-2.5 px-3 text-right">Thực Tế (AC)</th>
                  <th className="py-2.5 px-3 text-right">Đạt Được (EV)</th>
                  <th className="py-2.5 px-3 text-center">CPI</th>
                  <th className="py-2.5 px-3 text-center">SPI</th>
                  <th className="py-2.5 px-3 text-right">Dự Báo (EAC)</th>
                  <th className="py-2.5 px-3 text-center">Sức Khỏe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-normal">
                {portfolioData?.projects?.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">{p.code}</td>
                    <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200 font-medium">{p.name}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{p.bac.toLocaleString('vi-VN')} đ</td>
                    <td className="py-2.5 px-3 text-right font-mono text-rose-600 dark:text-rose-400">{p.ac.toLocaleString('vi-VN')} đ</td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400">{p.ev.toLocaleString('vi-VN')} đ</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold">
                      <span className={p.cpi >= 1.0 ? 'text-emerald-600' : 'text-rose-600'}>{p.cpi.toFixed(2)}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold">
                      <span className={p.spi >= 1.0 ? 'text-emerald-600' : 'text-amber-600'}>{p.spi.toFixed(2)}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-purple-600 dark:text-purple-400">
                      {p.eac.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.health === 'EXCELLENT'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : p.health === 'GOOD'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}>
                        {p.health}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
