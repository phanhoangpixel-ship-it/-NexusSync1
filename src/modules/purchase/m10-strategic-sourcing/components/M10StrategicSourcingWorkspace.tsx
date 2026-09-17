import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SelectedEntityContext } from '../../../../types';
import { useWorkspaceSessionTab } from '../../../../hooks/useWorkspaceSessionTab';
import {
  Layers,
  FileText,
  DollarSign,
  ShieldCheck,
  Award,
  Scale,
  CheckCircle,
} from 'lucide-react';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { RFQItem, BidItem, EvaluationItem, ComparisonItem, AwardItem, MasterSupplierOption, MasterProductOption, SourcingPackageItem, CostCenter } from './m10Types';
import { M10WorkspaceHeader } from './M10WorkspaceHeader';
import { M10LifecyclePipeline } from './M10LifecyclePipeline';
import { M10MetricCards } from './M10MetricCards';
import { M10PackageTab } from './M10PackageTab';
import { M10RfqTab } from './M10RfqTab';
import { M10BidsTab } from './M10BidsTab';
import { M10EvaluationTab } from './M10EvaluationTab';
import { M10ComparisonTab } from './M10ComparisonTab';
import { M10AwardsTab } from './M10AwardsTab';
import { M10AnalyticsTab } from './M10AnalyticsTab';
import { M10RfqDetailModal } from './M10RfqDetailModal';
import { M10ReverseAuctionModal } from './M10ReverseAuctionModal';

interface M10StrategicSourcingWorkspaceProps {
  currentUser?: any;
  onSelectEntity: (entity: SelectedEntityContext) => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const M10StrategicSourcingWorkspace: React.FC<M10StrategicSourcingWorkspaceProps> = ({
  onSelectEntity,
  onNotify,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useWorkspaceSessionTab<'packages' | 'rfqs' | 'bids' | 'evaluation' | 'comparison' | 'awards' | 'analytics'>('M10', 'rfqs');

  const [packages, setPackages] = useState<SourcingPackageItem[]>([]);
  const [rfqs, setRfqs] = useState<RFQItem[]>([]);
  const [bids, setBids] = useState<BidItem[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluationItem[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonItem[]>([]);
  const [awards, setAwards] = useState<AwardItem[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [products, setProducts] = useState<MasterProductOption[]>([]);
  const [suppliers, setSuppliers] = useState<MasterSupplierOption[]>([]);

  // Selected Filter RFQ for comparison / bids
  const [selectedRfqId, setSelectedRfqId] = useState<string>('');

  // Create Package Form State
  const [pkgTitle, setPkgTitle] = useState('');
  const [pkgCategory, setPkgCategory] = useState('Direct Materials');
  const [pkgBudget, setPkgBudget] = useState('');
  const [pkgCostCenter, setPkgCostCenter] = useState('CC-PROCUREMENT');
  const [pkgDeadline, setPkgDeadline] = useState('');
  const [pkgDescription, setPkgDescription] = useState('');

  // Create RFQ Form State
  const [newRfqTitle, setNewRfqTitle] = useState('');
  const [newRfqPackageId, setNewRfqPackageId] = useState('');
  const [newRfqDeadline, setNewRfqDeadline] = useState('');
  const [newRfqProductId, setNewRfqProductId] = useState('');
  const [newRfqQuantity, setNewRfqQuantity] = useState('');
  const [selectedSuppliersToInvite, setSelectedSuppliersToInvite] = useState<number[]>([]);

  // Create Bid Form State
  const [bidRfqId, setBidRfqId] = useState('');
  const [bidSupplierId, setBidSupplierId] = useState('');
  const [bidUnitPrice, setBidUnitPrice] = useState('');
  const [bidQuantity, setBidQuantity] = useState('');
  const [bidLeadTime, setBidLeadTime] = useState('3');

  // Create Evaluation Form State
  const [evalRfqId, setEvalRfqId] = useState('');
  const [evalBidId, setEvalBidId] = useState('');
  const [scorePrice, setScorePrice] = useState('85');
  const [scoreQuality, setScoreQuality] = useState('90');
  const [scoreDelivery, setScoreDelivery] = useState('80');
  const [scoreWarranty, setScoreWarranty] = useState('85');

  // Create Award Form State
  const [awardRfqId, setAwardRfqId] = useState('');
  const [awardBidId, setAwardBidId] = useState('');
  const [awardSupplierId, setAwardSupplierId] = useState('');

  // Reverse Auction State (Phase 4)
  const [reverseAuctionRfq, setReverseAuctionRfq] = useState<RFQItem | null>(null);
  const [isReverseAuctionOpen, setIsReverseAuctionOpen] = useState<boolean>(false);
  const [bidRoundNumber, setBidRoundNumber] = useState<string>('');

  // Selected RFQ Detail Modal State
  const [selectedRfqForModal, setSelectedRfqForModal] = useState<RFQItem | null>(null);

  // Confirm Dialog State (Rule #19)
  const [confirmDialog, setConfirmDialog] = useState<any>(null);

  const handleOpenReverseAuction = (rfq: RFQItem) => {
    setReverseAuctionRfq(rfq);
    setIsReverseAuctionOpen(true);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('erp_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [pkgRes, rfqRes, bidsRes, evalRes, awardRes, ccRes, prodRes, supRes] = await Promise.all([
        fetch('/api/sourcing/packages', { headers }),
        fetch('/api/sourcing/rfqs', { headers }),
        fetch('/api/sourcing/bids', { headers }),
        fetch('/api/sourcing/evaluations', { headers }),
        fetch('/api/sourcing/awards', { headers }),
        fetch('/api/org/cost-centers', { headers }),
        fetch('/api/products', { headers }),
        fetch('/api/suppliers', { headers }),
      ]);

      if (pkgRes.ok) {
        setPackages(await pkgRes.json());
      }
      if (rfqRes.ok) {
        const rfqData = await rfqRes.json();
        setRfqs(rfqData);
        // Default selected RFQ for comparison if none selected
        if (!selectedRfqId && rfqData.length > 0) {
          setSelectedRfqId(String(rfqData[0].dbId || rfqData[0].id));
        }
      }
      if (bidsRes.ok) setBids(await bidsRes.json());
      if (evalRes.ok) setEvaluations(await evalRes.json());
      if (awardRes.ok) setAwards(await awardRes.json());
      if (ccRes.ok) {
        const ccData = await ccRes.json();
        setCostCenters(ccData.data || ccData);
      }
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData.map((p: any) => ({ id: p.id, code: p.code || p.sku, name: p.name, category: p.category })));
      }
      if (supRes.ok) {
        const supData = await supRes.json();
        setSuppliers(supData.map((s: any) => {
          const statusUpper = (s.status || '').toUpperCase().trim();
          const isEligible = !['INACTIVE', 'BLACKLISTED', 'BLOCKED', 'ARCHIVED', 'PENDING', 'PENDING_APPROVAL', 'PENDING_QUALIFICATION', 'UNQUALIFIED'].includes(statusUpper) && (s.compositeScore === undefined || s.compositeScore === null || s.compositeScore >= 50);
          let ineligibilityReason = '';
          if (statusUpper === 'INACTIVE') ineligibilityReason = 'Đang ngưng hoạt động (INACTIVE)';
          else if (['BLACKLISTED', 'BLOCKED'].includes(statusUpper)) ineligibilityReason = 'Danh sách đen cấm thầu (BLACKLISTED)';
          else if (statusUpper === 'ARCHIVED') ineligibilityReason = 'Đã lưu trữ (ARCHIVED)';
          else if (['PENDING', 'PENDING_APPROVAL', 'PENDING_QUALIFICATION', 'UNQUALIFIED'].includes(statusUpper)) ineligibilityReason = 'Chưa qua phê duyệt thẩm định năng lực M09/M11';
          else if (s.compositeScore !== undefined && s.compositeScore !== null && s.compositeScore < 50) ineligibilityReason = `Điểm năng lực thấp (${s.compositeScore}/100 < 50)`;

          return {
            id: s.id,
            code: s.code,
            name: s.name,
            status: s.status,
            performanceTier: s.performanceTier,
            compositeScore: s.compositeScore,
            isEligible,
            ineligibilityReason
          };
        }));
      }

    } catch (err: any) {
      onNotify('danger', 'Lỗi đồng bộ dữ liệu', err.message);
    } finally {
      setLoading(false);
    }
  }, [onNotify, selectedRfqId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch comparison when selectedRfqId changes
  const fetchComparison = useCallback(() => {
    if (selectedRfqId) {
      const token = localStorage.getItem('erp_token');
      fetch(`/api/sourcing/comparison?rfqId=${selectedRfqId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setComparisonData(data.comparison || []))
        .catch(() => setComparisonData([]));
    }
  }, [selectedRfqId]);

  useEffect(() => {
    fetchComparison();
  }, [fetchComparison]);

  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgTitle) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('erp_token');
      const payload = {
        title: pkgTitle,
        category: pkgCategory,
        estimatedBudget: Number(pkgBudget) || 0,
        costCenter: pkgCostCenter,
        submissionDeadline: pkgDeadline || undefined,
        description: pkgDescription || undefined,
        idempotencyKey: `pkg-create-${Date.now()}`
      };

      const res = await fetch('/api/sourcing/packages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Lỗi khởi tạo gói thầu');
      }

      onNotify('success', 'Khởi Tạo Gói Thầu Thành Công', `Mã gói thầu: ${data.code}`);
      setPkgTitle('');
      setPkgBudget('');
      setPkgDescription('');
      await fetchData();
    } catch (err: any) {
      onNotify('danger', 'Lỗi tạo gói thầu', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateRfq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRfqTitle) return;
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('erp_token');
      const payload = {
        title: newRfqTitle,
        packageId: newRfqPackageId ? Number(newRfqPackageId) : undefined,
        deadline: newRfqDeadline || undefined,
        productId: newRfqProductId ? Number(newRfqProductId) : undefined,
        targetQuantity: newRfqQuantity ? Number(newRfqQuantity) : undefined,
        invitedSupplierIds: selectedSuppliersToInvite.length > 0 ? selectedSuppliersToInvite : undefined,
        idempotencyKey: `rfq-create-${Date.now()}`
      };

      const res = await fetch('/api/sourcing/rfqs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || errData.error || 'Lỗi hệ thống');
      }

      const data = await res.json();
      onNotify('success', 'Tạo Yêu Cầu Báo Giá Thành Công', `Mã RFQ: ${data.code || data.id || 'Thành công'}`);
      setNewRfqTitle('');
      setNewRfqPackageId('');
      setNewRfqDeadline('');
      setNewRfqProductId('');
      setNewRfqQuantity('');
      setSelectedSuppliersToInvite([]);
      await fetchData();
    } catch (err: any) {
      onNotify('danger', 'Lỗi tạo RFQ', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bidRfqId || !bidSupplierId || !bidUnitPrice || !bidQuantity) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('erp_token');
      const payload = {
        rfqId: Number(bidRfqId),
        supplierId: Number(bidSupplierId),
        roundNumber: bidRoundNumber ? Number(bidRoundNumber) : undefined,
        items: [{
          rfqItemId: 1,
          unitPrice: Number(bidUnitPrice),
          offeredQuantity: Number(bidQuantity),
          leadTimeDays: Number(bidLeadTime) || 3
        }],
        idempotencyKey: `bid-create-${Date.now()}`
      };

      const res = await fetch('/api/sourcing/bids', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || resData.message || 'Lỗi nộp hồ sơ bid');
      }

      const reductionMsg = resData.priceReductionPercent && resData.priceReductionPercent > 0
        ? ` Đã ghi nhận mức giảm ${resData.priceReductionPercent}% so với vòng trước!`
        : '';

      onNotify(
        'success',
        'Nộp Hồ Sơ Chào Giá Thành Công',
        `Hồ sơ bid Vòng ${resData.roundNumber || 1} đã được niêm phong vào hệ thống đối soát.${reductionMsg}`
      );
      setBidUnitPrice('');
      setBidQuantity('');
      await fetchData();
    } catch (err: any) {
      onNotify('danger', 'Lỗi nộp chào giá', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evalRfqId || !evalBidId) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('erp_token');
      const payload = {
        rfqId: Number(evalRfqId),
        bidId: Number(evalBidId),
        criteriaScores: [
          { criterionName: 'PRICE', weight: 0.40, score: Number(scorePrice) },
          { criterionName: 'QUALITY', weight: 0.30, score: Number(scoreQuality) },
          { criterionName: 'DELIVERY', weight: 0.20, score: Number(scoreDelivery) },
          { criterionName: 'WARRANTY', weight: 0.10, score: Number(scoreWarranty) }
        ],
        notes: 'Chấm điểm kỹ thuật và thương mại tự động chuẩn hóa.',
        idempotencyKey: `eval-${Date.now()}`
      };

      const res = await fetch('/api/sourcing/evaluations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Lỗi chấm thầu');
      }

      const data = await res.json();
      onNotify('success', 'Chấm Điểm Hồ Sơ Thành Công', `Điểm tổng hợp: ${data.totalScore?.toFixed(2)}`);
      await fetchData();
    } catch (err: any) {
      onNotify('danger', 'Lỗi chấm điểm', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAward = async (e: React.FormEvent, overrideJustification?: string) => {
    e.preventDefault();
    if (!awardRfqId || !awardBidId || !awardSupplierId) return;

    const executeAwardCreation = async () => {
      setIsSubmitting(true);
      try {
        const token = localStorage.getItem('erp_token');

        // Find matching bid for real item numbers
        const selectedBid = bids.find(b => String(b.id) === String(awardBidId));
        const rfqItem = rfqs.find(r => String(r.dbId || r.id.replace('RFQ-', '')) === String(awardRfqId));
        const targetQty = Number(selectedBid?.offeredQuantity || rfqItem?.targetQuantity || 100);
        const unitPr = Number(selectedBid?.unitPrice || (selectedBid?.totalValue ? selectedBid.totalValue / targetQty : 100000));

        const payload = {
          rfqId: Number(awardRfqId),
          bidId: Number(awardBidId),
          supplierId: Number(awardSupplierId),
          evaluationId: null,
          items: [{
            rfqLineId: 1,
            bidLineId: 1,
            awardedQuantity: targetQty,
            awardedUnitPrice: unitPr
          }],
          budgetOverrideJustification: overrideJustification || undefined,
          idempotencyKey: `award-${Date.now()}`
        };

        const res = await fetch('/api/sourcing/awards', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) {
          if (data.error === 'BUDGET_GUARD_EXCEEDED') {
            onNotify('danger', 'Chặn Ngân Sách M30', data.message || 'Vượt hạn mức ngân sách khả dụng của Cost Center');
            return;
          }
          throw new Error(data.error || 'Lỗi phê duyệt trúng thầu');
        }

        if (data.workflowMatrix?.requiresMultiTier) {
          onNotify('info', 'Chuyển Duyệt Đa Cấp M28', data.message || `Đã chuyển sang luồng duyệt đa cấp (CPO/CFO) cho Quyết định ${data.awardNo}`);
        } else {
          onNotify('success', 'Phê Duyệt Trao Thầu Thành Công', data.message || `Mã Quyết định: ${data.awardNo} - Đã phê duyệt và khởi tạo biên bản M10 → M08 PO Boundary`);
        }
        await fetchData();
      } catch (err: any) {
        onNotify('danger', 'Lỗi phê duyệt', err.message);
      } finally {
        setIsSubmitting(false);
      }
    };

    setConfirmDialog({
      isOpen: true,
      title: 'Xác Nhận Quyết Định Trao Thầu',
      message: `Bạn có chắc chắn muốn phê duyệt trao thầu cho Gói RFQ-${awardRfqId} và Nhà cung cấp #${awardSupplierId}? Hành động này sẽ khóa hồ sơ thầu và lập cam kết ngân sách M30.`,
      confirmText: 'Xác nhận Trao thầu',
      cancelText: 'Quay lại',
      variant: 'primary',
      onConfirm: async () => {
        setConfirmDialog(null);
        await executeAwardCreation();
      },
      onCancel: () => setConfirmDialog(null)
    });
  };

  const handleGeneratePoFromAward = async (awardId: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Khởi Tạo Đơn Hàng Mua M08',
      message: `Bạn có chắc chắn muốn khởi tạo Đơn Hàng Mua M08 từ Quyết định Trao thầu #${awardId}? Hệ thống sẽ đồng bộ thông tin NCC, đơn giá trúng thầu và khối lượng sang phân hệ Mua Hàng M08.`,
      confirmText: 'Khởi tạo PO',
      cancelText: 'Hủy bỏ',
      variant: 'primary',
      onConfirm: async () => {
        setConfirmDialog(null);
        setIsSubmitting(true);
        try {
          const token = localStorage.getItem('erp_token');
          const res = await fetch(`/api/sourcing/awards/${awardId}/generate-po`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || 'Lỗi khởi tạo đơn hàng M08 PO');
          }
          const data = await res.json();
          if (data.alreadyExists) {
            onNotify('info', 'Đơn Hàng Đã Tồn Tại', `Đơn hàng M08 PO mã ${data.poCode} đã được tạo trước đó.`);
          } else {
            onNotify('success', 'Khởi Tạo Đơn Hàng M08 PO Thành Công', `Đã tạo Đơn hàng PO mã: ${data.poCode} từ Quyết định trao thầu. Phả hệ đã được chuyển sang M08 PO.`);
          }
          await fetchData();
        } catch (err: any) {
          onNotify('danger', 'Lỗi khởi tạo PO', err.message);
        } finally {
          setIsSubmitting(false);
        }
      },
      onCancel: () => setConfirmDialog(null)
    });
  };

  const handleSealAwardDms = async (awardId: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Niêm Phong Hồ Sơ Số Vào M29 Secure Vault',
      message: `Bạn có chắc chắn muốn niêm phong số hồ sơ trao thầu #${awardId}? Hồ sơ sẽ được băm SHA-256 bất biến và lưu trữ dài hạn tại kho chứng từ số M29.`,
      confirmText: 'Niêm phong ngay',
      cancelText: 'Hủy',
      variant: 'primary',
      onConfirm: async () => {
        setConfirmDialog(null);
        setIsSubmitting(true);
        try {
          const token = localStorage.getItem('erp_token');
          const res = await fetch(`/api/sourcing/awards/${awardId}/seal-dms`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || 'Lỗi niêm phong số vào M29 Vault');
          }
          const data = await res.json();
          onNotify('success', 'Niêm Phong M29 Vault Thành Công', `Hồ sơ ${data.docCode} đã được lưu trữ vĩnh viễn với mã băm SHA-256: ${data.sha256Hash.substring(0, 16)}...`);
          await fetchData();
        } catch (err: any) {
          onNotify('danger', 'Lỗi niêm phong M29', err.message);
        } finally {
          setIsSubmitting(false);
        }
      },
      onCancel: () => setConfirmDialog(null)
    });
  };

  const handleSealComparisonDms = async (rfqId: string) => {
    const rawId = rfqId.replace('RFQ-', '');
    setConfirmDialog({
      isOpen: true,
      title: 'Niêm Phong Ma Trận Báo Giá Vào M29 Vault',
      message: `Bạn có muốn tạo bản ghi chứng thực số cho toàn bộ ma trận so sánh chào giá của gói thầu RFQ-${rawId} vào kho tài liệu M29?`,
      confirmText: 'Niêm phong ma trận',
      cancelText: 'Hủy',
      variant: 'primary',
      onConfirm: async () => {
        setConfirmDialog(null);
        setIsSubmitting(true);
        try {
          const token = localStorage.getItem('erp_token');
          const res = await fetch(`/api/sourcing/comparison/${rawId}/seal-dms`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || 'Lỗi niêm phong ma trận chào giá vào M29 Vault');
          }
          const data = await res.json();
          onNotify('success', 'Niêm Phong M29 Vault Thành Công', `Bảng so sánh báo giá ${data.docCode} đã được niêm phong với SHA-256: ${data.sha256Hash.substring(0, 16)}...`);
        } catch (err: any) {
          onNotify('danger', 'Lỗi niêm phong M29', err.message);
        } finally {
          setIsSubmitting(false);
        }
      },
      onCancel: () => setConfirmDialog(null)
    });
  };

  const handleUpdateRfqStatus = async (rfqCode: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('erp_token');
      const res = await fetch(`/api/sourcing/rfqs/${rfqCode}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Lỗi cập nhật trạng thái RFQ');
      }
      onNotify('success', 'Cập Nhật Trạng Thái Thành Công', `RFQ ${rfqCode} đã chuyển sang trạng thái: ${newStatus}`);
      await fetchData();
      setSelectedRfqForModal(prev => prev && prev.id === rfqCode ? { ...prev, status: newStatus } : prev);
    } catch (err: any) {
      onNotify('danger', 'Lỗi cập nhật', err.message);
    }
  };

  // Rule #19: ConfirmDialog for destructive cancel RFQ
  const cancelRfq = async (rfqId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xác nhận Huỷ Gói thầu',
      message: `Bạn có chắc chắn muốn huỷ gói thầu ${rfqId}? Hành động này sẽ khóa yêu cầu chào giá và thông báo tới các đối tác.`,
      confirmText: 'Xác nhận Huỷ',
      cancelText: 'Quay lại',
      variant: 'danger',
      type: 'danger',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const token = localStorage.getItem('erp_token');
          const res = await fetch(`/api/sourcing/rfqs/${rfqId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || 'Lỗi huỷ RFQ');
          }
          onNotify('success', 'Huỷ Gói Thầu Thành Công', `Đã huỷ gói thầu ${rfqId}`);
          await fetchData();
        } catch (err: any) {
          onNotify('danger', 'Lỗi huỷ gói thầu', err.message);
        }
      },
      onCancel: () => setConfirmDialog(null)
    });
  };

  const handleSelectRfq = (rfq: RFQItem) => {
    setSelectedRfqForModal(rfq);
    setSelectedRfqId(String(rfq.dbId || rfq.id));
    onSelectEntity({
      type: 'STRATEGIC_SOURCING',
      id: rfq.id,
      code: rfq.id,
      title: rfq.title,
      status: rfq.status,
      lineage: [
        { id: rfq.id, type: 'Gói thầu RFQ', code: rfq.id, relation: 'CURRENT_RFQ', status: rfq.status },
        { id: 'M10-SOURCING', type: 'Phân hệ M10', code: 'M10_STRATEGIC_SOURCING', relation: 'PARENT_MODULE', status: 'ACTIVE' }
      ],
      auditTrail: [
        { id: 1, action: 'INSPECT_RFQ_BIDDING', timestamp: new Date().toISOString(), user: 'admin', sha256Checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' }
      ],
      glEntries: []
    });
    onNotify('info', 'Đã chọn gói thầu', `Đã đồng bộ gói thầu ${rfq.id} vào Thanh Ngữ cảnh Đối Tượng.`);
  };

  const handleSelectForAward = (comparisonItem: ComparisonItem) => {
    setAwardRfqId(selectedRfqId);
    setAwardBidId(String(comparisonItem.bidId));
    if (comparisonItem.supplierId) {
      setAwardSupplierId(String(comparisonItem.supplierId));
    }
    setActiveTab('awards');
    if (comparisonItem.bpaBenchmark?.isExceedingLimit) {
      onNotify('warning', 'Hồ Sơ Vượt Khung Giá BPA (>10%)', `Bid #${comparisonItem.bidId} (${comparisonItem.supplierName}) vượt trần thỏa thuận khung M09 +${comparisonItem.bpaBenchmark.variancePercent}%. Vui lòng bổ sung giải trình khi duyệt.`);
    } else {
      onNotify('info', 'Chuyển sang Trao Thầu', `Đã chọn Bid #${comparisonItem.bidId} (${comparisonItem.supplierName}) cho gói thầu RFQ #${selectedRfqId}.`);
    }
  };

  const handleExportCSV = () => {
    const csvHeader = "RFQ_ID,Title,Category,Deadline,Status\n";
    const csvRows = rfqs.map(r => `"${r.id ?? ''}","${r.title ?? ''}","${r.category ?? ''}","${r.deadline ?? ''}","${r.status ?? ''}"`).join('\n');
    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sourcing_rfqs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onNotify('success', 'Xuất File CSV Thành công', 'Dữ liệu danh mục RFQ đã được tải về máy.');
  };

  // Aggregated Metrics
  const openRfqsCount = useMemo(() => rfqs.filter(r => r.status === 'OPEN_BIDDING').length, [rfqs]);
  const totalBidsValue = useMemo(() => bids.reduce((acc, b) => acc + (Number(b.totalValue) || 0), 0), [bids]);
  const avgScore = useMemo(() => {
    if (evaluations.length === 0) return 0;
    return evaluations.reduce((acc, e) => acc + (Number(e.totalScore) || 0), 0) / evaluations.length;
  }, [evaluations]);
  const totalAwardValue = useMemo(() => awards.reduce((acc, a) => acc + (Number(a.totalAmount) || 0), 0), [awards]);

  const tabsConfig = [
    { id: 'packages', label: '10.0 Gói thầu Mua sắm (PKG)', count: packages.length, icon: <Layers className="w-4 h-4" /> },
    { id: 'rfqs', label: '10.1 Quản trị RFQ', count: rfqs.length, icon: <FileText className="w-4 h-4" /> },
    { id: 'bids', label: '10.2 Hồ sơ Chào giá (Bids)', count: bids.length, icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'evaluation', label: '10.3 Chấm điểm & Đánh giá', count: evaluations.length, icon: <Award className="w-4 h-4" /> },
    { id: 'comparison', label: '10.4 So sánh Báo giá (Matrix)', count: comparisonData.length, icon: <Scale className="w-4 h-4" /> },
    { id: 'awards', label: '10.5 Quyết định Trao thầu', count: awards.length, icon: <CheckCircle className="w-4 h-4" /> },
    { id: 'analytics', label: '10.6 Phân tích Tiết kiệm', count: '12.5%', icon: <DollarSign className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-3.5 max-w-full pb-8">
      {/* ========================================================================= */}
      {/* L0: WORKSPACE BANNER & CORE IDENTITY (M19 STANDARD)                       */}
      {/* ========================================================================= */}
      <M10WorkspaceHeader
        loading={loading}
        onRefresh={() => { fetchData(); onNotify('info', 'Làm mới', 'Đã đồng bộ dữ liệu Sourcing.'); }}
        onExportCSV={handleExportCSV}
        onNotify={onNotify}
      />

      {/* ========================================================================= */}
      {/* L0: LIFECYCLE PIPELINE (M19 STANDARD)                                     */}
      {/* ========================================================================= */}
      <M10LifecyclePipeline
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        packagesCount={packages.length}
        rfqsCount={rfqs.length}
        bidsCount={bids.length}
        evaluationsCount={evaluations.length}
        awardsCount={awards.length}
      />

      {/* ========================================================================= */}
      {/* L1: NAVIGATION SUB-TABS (M41 MASTER SPEC)                                 */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-1.5 flex items-center justify-between gap-2.5 min-w-0">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1 min-w-0 py-0.5">
          {tabsConfig.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 select-none ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold shrink-0 ${
                  isActive
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Info Strip */}
        <div className="hidden 2xl:flex items-center gap-3 px-3 py-1 text-xs text-slate-500 dark:text-slate-400 shrink-0 border-l border-slate-200 dark:border-slate-800 pl-3">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            Strategic Sourcing Hub
          </span>
          <span className="h-3 w-px bg-slate-200 dark:bg-slate-700"></span>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-semibold border border-slate-200/80 dark:border-slate-700/80">
            e-Procurement Matrix
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* L2: TOP-LEVEL KPI METRIC STRIP (M19 STANDARD)                             */}
      {/* ========================================================================= */}
      <M10MetricCards
        rfqsCount={rfqs.length}
        openRfqsCount={openRfqsCount}
        bidsCount={bids.length}
        totalBidsValue={totalBidsValue}
        evaluationsCount={evaluations.length}
        avgScore={avgScore}
        awardsCount={awards.length}
        totalAwardValue={totalAwardValue}
      />

      {/* ========================================================================= */}
      {/* TAB CONTENTS                                                              */}
      {/* ========================================================================= */}
      {activeTab === 'packages' && (
        <M10PackageTab
          packages={packages}
          loading={loading}
          isSubmitting={isSubmitting}
          onRefresh={fetchData}
          onCreatePackage={handleCreatePackage}
          pkgTitle={pkgTitle}
          setPkgTitle={setPkgTitle}
          pkgCategory={pkgCategory}
          setPkgCategory={setPkgCategory}
          pkgBudget={pkgBudget}
          setPkgBudget={setPkgBudget}
          pkgCostCenter={pkgCostCenter}
          setPkgCostCenter={setPkgCostCenter}
          pkgDeadline={pkgDeadline}
          setPkgDeadline={setPkgDeadline}
          pkgDescription={pkgDescription}
          setPkgDescription={setPkgDescription}
          onSelectPackageForRfq={(pkg) => {
            setNewRfqPackageId(String(pkg.id));
            setNewRfqTitle(`RFQ cho ${pkg.title}`);
            setActiveTab('rfqs');
            onNotify('info', 'Liên kết gói thầu', `Đã chọn gói thầu ${pkg.packageCode} để phát hành RFQ.`);
          }}
        />
      )}

      {activeTab === 'rfqs' && (
        <M10RfqTab
          rfqs={rfqs}
          products={products}
          packages={packages}
          suppliers={suppliers}
          loading={loading}
          isSubmitting={isSubmitting}
          onRefresh={fetchData}
          onSelectRfq={handleSelectRfq}
          onCancelRfq={cancelRfq}
          onOpenReverseAuction={handleOpenReverseAuction}
          onCreateRfq={handleCreateRfq}
          newRfqTitle={newRfqTitle}
          setNewRfqTitle={setNewRfqTitle}
          newRfqPackageId={newRfqPackageId}
          setNewRfqPackageId={setNewRfqPackageId}
          newRfqDeadline={newRfqDeadline}
          setNewRfqDeadline={setNewRfqDeadline}
          newRfqProductId={newRfqProductId}
          setNewRfqProductId={setNewRfqProductId}
          newRfqQuantity={newRfqQuantity}
          setNewRfqQuantity={setNewRfqQuantity}
          selectedSuppliersToInvite={selectedSuppliersToInvite}
          setSelectedSuppliersToInvite={setSelectedSuppliersToInvite}
        />
      )}

      {activeTab === 'bids' && (
        <M10BidsTab
          bids={bids}
          rfqs={rfqs}
          suppliers={suppliers}
          loading={loading}
          isSubmitting={isSubmitting}
          onRefresh={fetchData}
          onCreateBid={handleCreateBid}
          onOpenReverseAuction={handleOpenReverseAuction}
          bidRfqId={bidRfqId}
          setBidRfqId={setBidRfqId}
          bidSupplierId={bidSupplierId}
          setBidSupplierId={setBidSupplierId}
          bidUnitPrice={bidUnitPrice}
          setBidUnitPrice={setBidUnitPrice}
          bidQuantity={bidQuantity}
          setBidQuantity={setBidQuantity}
          bidLeadTime={bidLeadTime}
          setBidLeadTime={setBidLeadTime}
          bidRoundNumber={bidRoundNumber}
          setBidRoundNumber={setBidRoundNumber}
        />
      )}

      {activeTab === 'evaluation' && (
        <M10EvaluationTab
          evaluations={evaluations}
          rfqs={rfqs}
          bids={bids}
          loading={loading}
          isSubmitting={isSubmitting}
          onRefresh={fetchData}
          onCreateEvaluation={handleCreateEvaluation}
          evalRfqId={evalRfqId}
          setEvalRfqId={setEvalRfqId}
          evalBidId={evalBidId}
          setEvalBidId={setEvalBidId}
          scorePrice={scorePrice}
          setScorePrice={setScorePrice}
          scoreQuality={scoreQuality}
          setScoreQuality={setScoreQuality}
          scoreDelivery={scoreDelivery}
          setScoreDelivery={setScoreDelivery}
          scoreWarranty={scoreWarranty}
          setScoreWarranty={setScoreWarranty}
          onNotify={onNotify}
        />
      )}

      {activeTab === 'comparison' && (
        <M10ComparisonTab
          comparisonData={comparisonData}
          selectedRfqId={selectedRfqId}
          setSelectedRfqId={setSelectedRfqId}
          rfqs={rfqs}
          onSelectForAward={handleSelectForAward}
          onNotify={onNotify}
          onSealComparisonDms={handleSealComparisonDms}
          onRefresh={() => {
            fetchComparison();
            fetchData();
          }}
        />
      )}

      {activeTab === 'awards' && (
        <M10AwardsTab
          awards={awards}
          rfqs={rfqs}
          bids={bids}
          packages={packages}
          costCenters={costCenters}
          suppliers={suppliers}
          loading={loading}
          isSubmitting={isSubmitting}
          onRefresh={fetchData}
          onCreateAward={handleCreateAward}
          onGeneratePo={handleGeneratePoFromAward}
          onSealDms={handleSealAwardDms}
          awardRfqId={awardRfqId}
          setAwardRfqId={setAwardRfqId}
          awardBidId={awardBidId}
          setAwardBidId={setAwardBidId}
          awardSupplierId={awardSupplierId}
          setAwardSupplierId={setAwardSupplierId}
          onNotify={onNotify}
        />
      )}

      {activeTab === 'analytics' && (
        <M10AnalyticsTab
          rfqsCount={rfqs.length}
          bidsCount={bids.length}
          awardsCount={awards.length}
          totalAwardValue={totalAwardValue}
        />
      )}

      {/* ========================================================================= */}
      {/* RFQ DETAIL 360° MODAL                                                     */}
      {/* ========================================================================= */}
      <M10RfqDetailModal
        rfq={selectedRfqForModal}
        suppliers={suppliers}
        onClose={() => setSelectedRfqForModal(null)}
        onUpdateStatus={handleUpdateRfqStatus}
        onOpenReverseAuction={handleOpenReverseAuction}
        onNavigateToTab={(tab, targetRfqId) => {
          if (targetRfqId) {
            setSelectedRfqId(targetRfqId);
            setBidRfqId(targetRfqId);
            setEvalRfqId(targetRfqId);
            setAwardRfqId(targetRfqId);
          }
          setActiveTab(tab);
        }}
        onNotify={onNotify}
      />

      {/* ========================================================================= */}
      {/* PHASE 4: MULTI-ROUND REVERSE AUCTION MODAL                                */}
      {/* ========================================================================= */}
      {isReverseAuctionOpen && (
        <M10ReverseAuctionModal
          rfq={reverseAuctionRfq}
          onClose={() => {
            setIsReverseAuctionOpen(false);
            setReverseAuctionRfq(null);
          }}
          onNotify={onNotify}
          onRoundOpened={fetchData}
        />
      )}

      {/* ========================================================================= */}
      {/* RULE #19: ENTERPRISE CONFIRM DIALOG                                       */}
      {/* ========================================================================= */}
      {confirmDialog && (
        <ConfirmDialog
          isOpen={!!confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmText={confirmDialog.confirmText}
          cancelText={confirmDialog.cancelText}
          variant={confirmDialog.variant || confirmDialog.type || 'primary'}
          onConfirm={confirmDialog.onConfirm}
          onClose={() => setConfirmDialog(null)}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
};

export default M10StrategicSourcingWorkspace;
