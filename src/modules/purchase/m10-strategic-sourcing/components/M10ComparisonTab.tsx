import React, { useState, useMemo } from 'react';
import { ComparisonItem, RFQItem } from './m10Types';
import { 
  Scale, Search, Download, Award, Building, DollarSign, CheckCircle2, ArrowRight, 
  Sparkles, Clock, CreditCard, Percent, ShieldCheck, TrendingDown, RefreshCw,
  AlertTriangle, ShieldAlert, FileText, Check, X, ExternalLink, Info
} from 'lucide-react';
import { PaginationControl } from '../../../../components/common/PaginationControl';

interface M10ComparisonTabProps {
  comparisonData: ComparisonItem[];
  selectedRfqId: string;
  setSelectedRfqId: (id: string) => void;
  rfqs: RFQItem[];
  onSelectForAward?: (bid: ComparisonItem) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
  onRefresh?: () => void;
  onSealComparisonDms?: (rfqId: string) => Promise<void>;
}

export const M10ComparisonTab: React.FC<M10ComparisonTabProps> = ({
  comparisonData,
  selectedRfqId,
  setSelectedRfqId,
  rfqs,
  onSelectForAward,
  onNotify,
  onRefresh,
  onSealComparisonDms,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [bpaFilter, setBpaFilter] = useState<'ALL' | 'ALERTS_ONLY' | 'HAS_BPA'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isSealingDms, setIsSealingDms] = useState(false);
  const [activeBpaItem, setActiveBpaItem] = useState<ComparisonItem | null>(null);
  const [awardConfirmItem, setAwardConfirmItem] = useState<ComparisonItem | null>(null);

  const filteredData = useMemo(() => {
    return comparisonData.filter(c => {
      const matchesSearch = (c.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (c.supplierCode?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        String(c.bidId).includes(searchTerm);

      if (!matchesSearch) return false;

      if (bpaFilter === 'ALERTS_ONLY') {
        return Boolean(c.bpaBenchmark?.isExceedingLimit);
      }
      if (bpaFilter === 'HAS_BPA') {
        return Boolean(c.bpaBenchmark?.hasAgreement);
      }
      return true;
    });
  }, [comparisonData, searchTerm, bpaFilter]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

  // Calculated Metrics for the selected RFQ comparison
  const topRanked = useMemo(() => {
    return comparisonData.find(c => c.ranking === 1) || null;
  }, [comparisonData]);

  const lowestPrice = useMemo(() => {
    if (comparisonData.length === 0) return 0;
    return Math.min(...comparisonData.map(c => Number(c.totalValue || 0)));
  }, [comparisonData]);

  const highestScore = useMemo(() => {
    if (comparisonData.length === 0) return 0;
    return Math.max(...comparisonData.map(c => Number(c.totalScore || 0)));
  }, [comparisonData]);

  const bpaAlertsCount = useMemo(() => {
    return comparisonData.filter(c => c.bpaBenchmark?.isExceedingLimit).length;
  }, [comparisonData]);

  const bpaAgreementsCount = useMemo(() => {
    return comparisonData.filter(c => c.bpaBenchmark?.hasAgreement).length;
  }, [comparisonData]);

  // Handle select for award with BPA Price Guard check
  const handleAwardClick = (bid: ComparisonItem) => {
    if (bid.bpaBenchmark?.isExceedingLimit) {
      // Trigger confirmation modal with explicit warning
      setAwardConfirmItem(bid);
    } else if (onSelectForAward) {
      onSelectForAward(bid);
    }
  };

  const confirmAwardWithBpaWarning = () => {
    if (awardConfirmItem && onSelectForAward) {
      onSelectForAward(awardConfirmItem);
      onNotify(
        'warning',
        'Cảnh Báo Vượt Giá Khung BPA Đã Ghi Nhận',
        `Đã chọn hồ sơ BID-${awardConfirmItem.bidId} (${awardConfirmItem.supplierName}) với ngoại lệ giá khung BPA.`
      );
      setAwardConfirmItem(null);
    }
  };

  // Trigger Multi-Criteria Consensus Evaluation
  const handleAutoConsensusEvaluate = async () => {
    if (!selectedRfqId) {
      onNotify('warning', 'Chưa chọn RFQ', 'Vui lòng chọn một gói thầu RFQ để thực hiện chấm điểm đồng thuận.');
      return;
    }

    setIsEvaluating(true);
    try {
      const token = localStorage.getItem('erp_token');
      const res = await fetch(`/api/sourcing/rfqs/${selectedRfqId}/consensus-evaluation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          customWeights: { commercial: 0.40, technical: 0.30, sla: 0.20, compliance: 0.10 },
          idempotencyKey: `consensus-${selectedRfqId}-${Date.now()}`
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Lỗi khi chấm điểm đồng thuận');
      }

      const topName = data.topRankedSupplier?.supplierName || 'Ứng viên #1';
      const topScore = data.topRankedSupplier?.totalScore || 0;

      onNotify(
        'success',
        'Chấm Điểm Đồng Thuận Hoàn Tất',
        `Đã kết nối M11 SRM thành công! Ứng viên đề cử #1: ${topName} (${topScore}/100 điểm).`
      );

      if (onRefresh) {
        onRefresh();
      }
    } catch (err: any) {
      onNotify('danger', 'Lỗi chấm điểm', err.message);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleExportComparisonCSV = () => {
    if (comparisonData.length === 0) {
      onNotify('warning', 'Không có dữ liệu', 'Vui lòng chọn một gói thầu có dữ liệu chào giá để xuất.');
      return;
    }
    const csvHeader = "Xếp Hạng,Nhà Cung Cấp,Mã NCC,Mã Bid,Vòng,Đơn Giá (VND),Chiết Khấu (%),Lead Time (Ngày),Điều Khoản TT,Tổng Giá Trị (VND),HĐ BPA (M09),Giá Khung BPA (VND),Chênh Lệch BPA (%),Cảnh Báo Vượt Trần BPA,Điểm Tổng Hợp (Score),OTIF (M11),Chất Lượng (M11),Trạng Thái\n";
    const csvRows = comparisonData.map(c => {
      const bpa = c.bpaBenchmark;
      return `"#${c.ranking}","${c.supplierName ?? ''}","${c.supplierCode ?? ''}","BID-${c.bidId}","Vòng ${c.roundNumber ?? 1}","${c.unitPrice ?? 0}","${c.discountPercent ?? 0}%","${c.leadTimeDays ?? 3}","${c.paymentTerms ?? 'NET 30'}","${c.totalValue ?? 0}","${bpa?.contractCode ?? 'N/A'}","${bpa?.lockedPrice ?? 0}","${bpa?.variancePercent ?? 0}%","${bpa?.isExceedingLimit ? 'CẢNH BÁO VƯỢT TRẦN >10%' : 'HỢP LỆ'}","${c.totalScore ?? 0}","${c.m11Scorecard?.otifRate ?? '95%'}","${c.m11Scorecard?.qualityScore ?? '96%'}","${c.evaluationStatus ?? ''}"`;
    }).join('\n');
    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sourcing_comparison_rfq_${selectedRfqId}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onNotify('success', 'Xuất File CSV Thành công', 'Đã tải bảng so sánh chào giá về máy.');
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs p-4 sm:p-6 space-y-4">
      {/* Header & RFQ Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-700 dark:text-amber-300">
              <Scale className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Ma Trận So Sánh Chào Giá &amp; Đối Soát Khung Thỏa Thuận BPA M09
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Chuẩn hóa đối soát đơn giá, chiết khấu, Lead Time, điểm M11 SRM &amp; tự động đối chiếu giá trần khung thỏa thuận BPA M09 (Cảnh báo vượt &gt;10%).
          </p>
        </div>

        {/* RFQ Selector & Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">Chọn RFQ:</span>
            {rfqs.length > 0 ? (
              <select
                value={selectedRfqId}
                onChange={e => { setSelectedRfqId(e.target.value); setCurrentPage(1); }}
                className="text-xs font-mono tabular-nums bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-amber-500/30 max-w-[220px]"
              >
                <option value="">-- Chọn Gói thầu --</option>
                {rfqs.map(r => (
                  <option key={r.id} value={String(r.dbId || r.id)}>
                    {r.id}: {r.title}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="number"
                value={selectedRfqId}
                onChange={e => { setSelectedRfqId(e.target.value); setCurrentPage(1); }}
                className="w-20 text-xs font-mono tabular-nums bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-amber-500/30"
                placeholder="ID"
              />
            )}
          </div>

          {/* Auto Consensus Evaluate Button */}
          <button
            type="button"
            onClick={handleAutoConsensusEvaluate}
            disabled={isEvaluating || !selectedRfqId || comparisonData.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            title="Tự động tính điểm ma trận đa tiêu chí kết hợp hiệu suất M11 SRM"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isEvaluating ? 'animate-spin' : ''}`} />
            <span>{isEvaluating ? 'Đang chấm điểm...' : 'Chấm Điểm Tự Động (M11 SRM)'}</span>
          </button>

          {/* DMS Vault Archival Button (Phase 11 - M29) */}
          {onSealComparisonDms && (
            <button
              type="button"
              onClick={async () => {
                if (!selectedRfqId) return;
                setIsSealingDms(true);
                try {
                  await onSealComparisonDms(selectedRfqId);
                } finally {
                  setIsSealingDms(false);
                }
              }}
              disabled={isSealingDms || !selectedRfqId || comparisonData.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 rounded-lg text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
              title="Niêm phong số Bảng So Sánh Chào Giá vào M29 Secure Vault"
            >
              <ShieldCheck className={`w-3.5 h-3.5 ${isSealingDms ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">{isSealingDms ? 'Đang niêm phong...' : 'Niêm Phong M29'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportComparisonCSV}
            disabled={comparisonData.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Xuất Matrix CSV</span>
          </button>
        </div>
      </div>

      {/* BPA ALERT BANNER (If any bid exceeds limit) */}
      {bpaAlertsCount > 0 && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl p-3.5 flex items-start justify-between gap-3 text-rose-900 dark:text-rose-200 animate-fadeIn">
          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-rose-100 dark:bg-rose-900/80 flex items-center justify-center shrink-0 text-rose-700 dark:text-rose-300 mt-0.5">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                Cảnh Báo Kiểm Soát Giá Khung BPA (M09 Price Agreement Benchmark Guard)
                <span className="px-2 py-0.2 rounded-full text-[10px] font-mono font-bold bg-rose-200 text-rose-900 dark:bg-rose-900 dark:text-rose-100">
                  {bpaAlertsCount} Hồ sơ vượt trần &gt;10%
                </span>
              </h4>
              <p className="text-xs text-rose-700 dark:text-rose-300/90 leading-relaxed">
                Phát hiện đơn giá chào thầu cao hơn biên độ cho phép (&gt;10%) so với Hợp đồng nguyên tắc khung (BPA) đang có hiệu lực tại M09. Yêu cầu thẩm tra hoặc đàm phán giảm giá trước khi phê duyệt Quyết định Trao thầu.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setBpaFilter(bpaFilter === 'ALERTS_ONLY' ? 'ALL' : 'ALERTS_ONLY')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer border ${
              bpaFilter === 'ALERTS_ONLY'
                ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                : 'bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700 hover:bg-rose-100 dark:hover:bg-rose-900/60'
            }`}
          >
            {bpaFilter === 'ALERTS_ONLY' ? 'Hiện tất cả hồ sơ' : 'Lọc hồ sơ vi phạm (>10%)'}
          </button>
        </div>
      )}

      {/* Quick RFQ selection pills */}
      {rfqs.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shrink-0">
            Gói thầu gần đây:
          </span>
          {rfqs.slice(0, 6).map(r => {
            const isSelected = selectedRfqId === String(r.dbId || r.id);
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedRfqId(String(r.dbId || r.id))}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {r.id}: {r.title.slice(0, 20)}...
              </button>
            );
          })}
        </div>
      )}

      {/* Matrix Metric Strip (When RFQ selected) */}
      {comparisonData.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Ứng viên #1 Xếp hạng</span>
            <p className="font-bold text-xs text-amber-700 dark:text-amber-400 truncate flex items-center gap-1">
              <Award className="w-3.5 h-3.5 shrink-0" />
              {topRanked?.supplierName || '—'}
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Giá chào thấp nhất</span>
            <p className="font-mono tabular-nums font-bold text-xs text-emerald-700 dark:text-emerald-400">
              {lowestPrice > 0 ? `${lowestPrice.toLocaleString()} VND` : '—'}
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Điểm cao nhất (M11 SRM)</span>
            <p className="font-mono tabular-nums font-bold text-xs text-blue-700 dark:text-blue-400">
              {highestScore > 0 ? `${highestScore.toFixed(2)} / 100` : '—'}
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Số lượng Bids nộp</span>
            <p className="font-mono tabular-nums font-bold text-xs text-slate-900 dark:text-white">
              {comparisonData.length} Hồ sơ cạnh tranh
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Kiểm Soát Khung BPA (M09)</span>
            {bpaAlertsCount > 0 ? (
              <p className="font-mono tabular-nums font-bold text-xs text-rose-700 dark:text-rose-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                {bpaAlertsCount} Vượt trần (&gt;10%)
              </p>
            ) : bpaAgreementsCount > 0 ? (
              <p className="font-mono tabular-nums font-bold text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                100% Tuân thủ khung
              </p>
            ) : (
              <p className="font-mono tabular-nums font-bold text-xs text-slate-500">
                Chưa có HĐ BPA
              </p>
            )}
          </div>
        </div>
      )}

      {/* Table & Search */}
      <div className="space-y-2">
        {comparisonData.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Tìm nhà cung cấp, mã bid..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500/30 w-56"
                />
              </div>

              {/* Filter Pills for BPA */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setBpaFilter('ALL')}
                  className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                    bpaFilter === 'ALL' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Tất cả ({comparisonData.length})
                </button>
                <button
                  type="button"
                  onClick={() => setBpaFilter('ALERTS_ONLY')}
                  className={`px-2 py-0.5 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                    bpaFilter === 'ALERTS_ONLY' ? 'bg-rose-600 text-white shadow-2xs' : 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>Vượt trần ({bpaAlertsCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBpaFilter('HAS_BPA')}
                  className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                    bpaFilter === 'HAS_BPA' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Có BPA ({bpaAgreementsCount})
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400">
                {filteredData.length} HỒ SƠ CHÀO GIÁ
              </span>
              {onRefresh && (
                <button
                  type="button"
                  onClick={onRefresh}
                  className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded"
                  title="Làm mới ma trận"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-[10px] uppercase tracking-wider text-slate-600 dark:text-slate-300 font-bold">
                <th className="p-3 text-center">Xếp hạng</th>
                <th className="p-3">Nhà cung cấp</th>
                <th className="p-3 font-mono tabular-nums">Mã Bid &amp; Vòng</th>
                <th className="p-3 text-right">Đơn giá chào</th>
                <th className="p-3 text-center">Khung Giá BPA (M09)</th>
                <th className="p-3 text-center">Chiết khấu</th>
                <th className="p-3 text-center">Lead Time</th>
                <th className="p-3">Điều khoản TT</th>
                <th className="p-3 text-right">Tổng giá trị gói</th>
                <th className="p-3 text-center">Điểm M11 SRM</th>
                <th className="p-3 text-right">Điểm Đồng Thuận</th>
                <th className="p-3 text-center">Trạng thái</th>
                {onSelectForAward && <th className="p-3 text-right">Hành động</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs text-slate-700 dark:text-slate-300 font-medium">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={13} className="p-10 text-center text-slate-400 font-mono tabular-nums">
                    {selectedRfqId
                      ? 'Không tìm thấy hồ sơ chào giá nào phù hợp với bộ lọc hiện tại.'
                      : 'Vui lòng nhập hoặc chọn ID Gói thầu RFQ hợp lệ ở trên để xem ma trận so sánh chào giá.'}
                  </td>
                </tr>
              ) : (
                paginatedData.map(c => {
                  const isFirst = c.ranking === 1;
                  const isLowest = c.isLowestPrice || (lowestPrice > 0 && c.totalValue === lowestPrice);
                  const m11 = c.m11Scorecard;
                  const bd = c.scoresBreakdown;
                  const bpa = c.bpaBenchmark;

                  return (
                    <tr
                      key={c.bidId}
                      className={`transition-colors duration-150 border-l-4 ${
                        bpa?.isExceedingLimit
                          ? 'bg-rose-50/20 dark:bg-rose-950/10 border-l-rose-500 hover:bg-rose-50/40 dark:hover:bg-rose-950/30'
                          : isFirst
                          ? 'bg-amber-50/40 dark:bg-amber-950/20 border-l-amber-500 hover:bg-amber-50/80 dark:hover:bg-amber-950/40'
                          : 'hover:bg-slate-100/80 dark:hover:bg-slate-700/60 border-l-slate-300 dark:border-l-slate-700'
                      }`}
                    >
                      {/* Xếp hạng */}
                      <td className="p-3 text-center whitespace-nowrap">
                        <span className={`w-8 h-8 rounded-full inline-flex items-center justify-center font-bold text-xs ${
                          isFirst
                            ? 'bg-amber-100 text-amber-950 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-700 shadow-2xs'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {isFirst ? '🥇 #1' : `#${c.ranking}`}
                        </span>
                      </td>

                      {/* Nhà cung cấp & Mã */}
                      <td className="p-3 font-bold text-slate-900 dark:text-white min-w-[180px]">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{c.supplierName}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-normal">
                            <span className="font-mono">{c.supplierCode || 'SUP'}</span>
                            {m11?.performanceTier && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                {m11.performanceTier.replace('TIER_', 'T')}
                              </span>
                            )}
                            {isFirst && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950 dark:text-amber-200">
                                Đề cử Trao Thầu
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Mã Bid & Vòng */}
                      <td className="p-3 font-mono tabular-nums whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-purple-700 dark:text-purple-400">
                            BID-{c.bidId}
                          </span>
                          <span className="text-[10px] text-slate-500 font-sans">
                            Vòng {c.roundNumber || 1}
                          </span>
                        </div>
                      </td>

                      {/* Đơn giá chào */}
                      <td className="p-3 font-mono tabular-nums text-right font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {c.unitPrice !== undefined ? `${Number(c.unitPrice).toLocaleString()} ₫` : '—'}
                      </td>

                      {/* Khung Giá BPA (M09 Price Agreement Benchmark Guard) */}
                      <td className="p-3 text-center whitespace-nowrap">
                        {bpa && bpa.hasAgreement ? (
                          <div className="flex flex-col items-center gap-0.5">
                            {bpa.isExceedingLimit ? (
                              <button
                                type="button"
                                onClick={() => setActiveBpaItem(c)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono tabular-nums font-bold bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-700 hover:scale-105 transition-all shadow-2xs cursor-pointer"
                                title="Click để xem chi tiết đối soát khung giá BPA"
                              >
                                <AlertTriangle className="w-3 h-3 text-rose-600 animate-pulse shrink-0" />
                                <span>+{bpa.variancePercent}% (&gt;10%)</span>
                              </button>
                            ) : bpa.flag === 'FAVORABLE' ? (
                              <button
                                type="button"
                                onClick={() => setActiveBpaItem(c)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono tabular-nums font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-700 hover:scale-105 transition-all cursor-pointer"
                                title="Click để xem chi tiết đối soát khung giá BPA"
                              >
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>{bpa.variancePercent}% (Ưu đãi)</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setActiveBpaItem(c)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono tabular-nums font-bold bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950/80 dark:text-blue-200 dark:border-blue-700 hover:scale-105 transition-all cursor-pointer"
                                title="Click để xem chi tiết đối soát khung giá BPA"
                              >
                                <Check className="w-3 h-3 text-blue-600 shrink-0" />
                                <span>+{bpa.variancePercent}% (Hợp lệ)</span>
                              </button>
                            )}
                            <span className="text-[10px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                              Trần: {bpa.lockedPrice?.toLocaleString()} ₫
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                            Chưa có HĐ BPA
                          </span>
                        )}
                      </td>

                      {/* Chiết khấu */}
                      <td className="p-3 text-center whitespace-nowrap">
                        {c.discountPercent !== undefined && c.discountPercent > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-mono tabular-nums font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                            -{c.discountPercent}%
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs font-mono">0.0%</span>
                        )}
                      </td>

                      {/* Thời gian giao hàng (Lead Time) */}
                      <td className="p-3 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-mono tabular-nums text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded-md">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {c.leadTimeDays ?? 3} ngày
                        </span>
                      </td>

                      {/* Điều khoản thanh toán */}
                      <td className="p-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-xs text-slate-700 dark:text-slate-300">
                          <CreditCard className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="font-mono">{c.paymentTerms || 'NET 30 Ngày'}</span>
                        </span>
                      </td>

                      {/* Tổng giá trị gói */}
                      <td className="p-3 font-mono tabular-nums text-right whitespace-nowrap">
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {Number(c.totalValue ?? 0).toLocaleString()} VND
                          </span>
                          {isLowest ? (
                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1 rounded border border-emerald-200 dark:border-emerald-800">
                              ★ Giá thấp nhất
                            </span>
                          ) : c.varianceFromLowestPercent !== undefined && c.varianceFromLowestPercent > 0 ? (
                            <span className="text-[10px] text-slate-500 font-sans">
                              +{c.varianceFromLowestPercent}% so với min
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Điểm SRM M11 */}
                      <td className="p-3 text-center whitespace-nowrap">
                        {m11 ? (
                          <div className="flex items-center justify-center gap-1 text-[10px] font-mono tabular-nums">
                            <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold" title="OTIF (On-Time In-Full)">
                              OTIF: {m11.otifRate}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold" title="Quality Score">
                              CL: {m11.qualityScore}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs font-mono">—</span>
                        )}
                      </td>

                      {/* Điểm Đồng Thuận (Score) */}
                      <td className="p-3 font-mono tabular-nums text-right whitespace-nowrap">
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="font-bold text-blue-700 dark:text-blue-300 text-sm">
                            {Number(c.totalScore ?? 0).toFixed(2)} / 100
                          </span>
                          {bd && (
                            <span className="text-[9px] text-slate-500 font-sans" title="Giá 40%, Kỹ thuật 30%, SLA 20%, Tuân thủ 10%">
                              G:{bd.commercial} • KT:{bd.technical} • S:{bd.sla}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Trạng thái */}
                      <td className="p-3 text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono tabular-nums font-bold bg-emerald-100 text-emerald-950 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-700">
                          {c.evaluationStatus || 'SCORED'}
                        </span>
                      </td>

                      {/* Hành động */}
                      {onSelectForAward && (
                        <td className="p-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleAwardClick(c)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border inline-flex items-center gap-1 cursor-pointer ${
                              bpa?.isExceedingLimit
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 dark:text-rose-200 dark:border-rose-700'
                                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 dark:text-indigo-300 dark:border-indigo-700'
                            }`}
                          >
                            <span>{bpa?.isExceedingLimit ? 'Trao thầu (Cần duyệt ngoại lệ)' : 'Chọn Trao thầu'}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* L4 Pagination Control */}
        {filteredData.length > 0 && (
          <div className="p-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
            <PaginationControl
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={filteredData.length}
              startIndex={startIndex}
              endIndex={Math.min(startIndex + pageSize, filteredData.length)}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* MODAL 1: BPA BENCHMARK DETAIL INSPECTOR */}
      {activeBpaItem && activeBpaItem.bpaBenchmark && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  activeBpaItem.bpaBenchmark.isExceedingLimit
                    ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300'
                    : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                }`}>
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Đối Soát Khung Thỏa Thuận Giá BPA (M09 Guard)
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    BID-{activeBpaItem.bidId} • {activeBpaItem.supplierName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveBpaItem(null)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contract Info Card */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hợp đồng nguyên tắc (BPA)</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {activeBpaItem.bpaBenchmark.contractCode || 'CON-2026-001'}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-900 dark:text-white">
                {activeBpaItem.bpaBenchmark.contractTitle || 'Hợp đồng khung cung ứng vật liệu bán dẫn'}
              </p>
              {activeBpaItem.bpaBenchmark.matchedItemName && (
                <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5 pt-1 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400">Mặt hàng đối chiếu:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                    [{activeBpaItem.bpaBenchmark.matchedItemCode}] {activeBpaItem.bpaBenchmark.matchedItemName}
                  </span>
                </div>
              )}
            </div>

            {/* Price Comparison Matrix Box */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Đơn giá chào thầu</span>
                <p className="text-sm font-mono tabular-nums font-bold text-slate-900 dark:text-white mt-1">
                  {activeBpaItem.bpaBenchmark.offeredPrice?.toLocaleString()} ₫
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Giá trần thỏa thuận (BPA)</span>
                <p className="text-sm font-mono tabular-nums font-bold text-blue-700 dark:text-blue-400 mt-1">
                  {activeBpaItem.bpaBenchmark.lockedPrice?.toLocaleString()} ₫
                </p>
              </div>

              <div className={`p-3 rounded-xl border ${
                activeBpaItem.bpaBenchmark.isExceedingLimit
                  ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                  : 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              }`}>
                <span className="text-[10px] font-bold uppercase">Độ lệch / Ngưỡng 10%</span>
                <p className="text-sm font-mono tabular-nums font-bold mt-1">
                  {activeBpaItem.bpaBenchmark.variancePercent !== undefined && activeBpaItem.bpaBenchmark.variancePercent > 0 ? `+${activeBpaItem.bpaBenchmark.variancePercent}%` : `${activeBpaItem.bpaBenchmark.variancePercent}%`}
                </p>
              </div>
            </div>

            {/* Status & Business Recommendation */}
            <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
              activeBpaItem.bpaBenchmark.isExceedingLimit
                ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                : 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
            }`}>
              <div className="flex items-center gap-1.5 font-bold mb-1">
                {activeBpaItem.bpaBenchmark.isExceedingLimit ? (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
                <span>
                  {activeBpaItem.bpaBenchmark.isExceedingLimit
                    ? 'CẢNH BÁO: ĐƠN GIÁ CHÀO THẦU VƯỢT BIÊN ĐỘ GIÁ KHUNG (>10%)'
                    : 'ĐƠN GIÁ HỢP LỆ VỚI KHUNG THỎA THUẬN BPA M09'}
                </span>
              </div>
              <p>{activeBpaItem.bpaBenchmark.warningMessage}</p>
              {activeBpaItem.bpaBenchmark.isExceedingLimit && (
                <div className="mt-2 pt-2 border-t border-rose-200 dark:border-rose-800/60 text-[11px] font-medium text-rose-800 dark:text-rose-300">
                  <strong>Khuyến nghị nghiệp vụ:</strong> Đề xuất thương thảo lại với Nhà cung cấp để áp dụng mức giá trần trong hợp đồng nguyên tắc hoặc cung cấp lý do giải trình ngoại lệ (Exception Justification) trình Giám đốc Mua sắm (CPO) phê duyệt.
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setActiveBpaItem(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Đóng
              </button>
              {onSelectForAward && (
                <button
                  type="button"
                  onClick={() => {
                    const item = activeBpaItem;
                    setActiveBpaItem(null);
                    handleAwardClick(item);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Chọn Trao Thầu Hồ Sơ Này
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRMATION GUARD FOR AWARDING WITH BPA BREACH */}
      {awardConfirmItem && awardConfirmItem.bpaBenchmark && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-rose-200 dark:border-rose-800 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/80 flex items-center justify-center text-rose-600 dark:text-rose-300 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Xác Nhận Trao Thầu Có Ngoại Lệ Vượt Giá Khung BPA
                </h3>
                <p className="text-xs text-slate-500">
                  Nhà cung cấp <strong>{awardConfirmItem.supplierName}</strong> (BID-{awardConfirmItem.bidId})
                </p>
              </div>
            </div>

            <div className="bg-rose-50 dark:bg-rose-950/40 p-4 rounded-xl border border-rose-200 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200 space-y-2">
              <p className="font-semibold">
                ⚠️ Đơn giá chào thầu: {awardConfirmItem.bpaBenchmark.offeredPrice?.toLocaleString()} ₫
              </p>
              <p>
                Đơn giá khung BPA ({awardConfirmItem.bpaBenchmark.contractCode}): {awardConfirmItem.bpaBenchmark.lockedPrice?.toLocaleString()} ₫
              </p>
              <p className="font-bold text-rose-700 dark:text-rose-300">
                Mức vượt biên độ cho phép: +{awardConfirmItem.bpaBenchmark.variancePercent}% (&gt; 10.0%)
              </p>
              <p className="text-[11px] text-rose-800/80 dark:text-rose-300/80 pt-1 border-t border-rose-200 dark:border-rose-800">
                Nếu tiếp tục, hệ thống sẽ ghi nhận cờ ngoại lệ (BPA Price Deviation Flag) vào Audit Trail và yêu cầu phê duyệt đặc biệt khi phát hành PO tại M08.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setAwardConfirmItem(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Hủy / Đàm Phán Lại
              </button>
              <button
                type="button"
                onClick={confirmAwardWithBpaWarning}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Xác Nhận Trao Thầu (Có ngoại lệ BPA)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
