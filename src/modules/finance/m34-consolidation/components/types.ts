export interface ConsolidationEntity {
    id: number;
    code: string;
    name: string;
    ownershipPercent: number;
    votingRightsPercent?: number;
    currency: string;
    entityType: string;
    consolidationMethod: "FULL_CONSOLIDATION" | "EQUITY_METHOD" | "PROPORTIONAL";
    effectiveDate?: string;
    revenue: number;
    expense: number;
    netIncome: number;
    assets: number;
    liabilities: number;
    equity: number;
    intercompanyAR: number;
    intercompanyAP: number;
    status: string;
}

export interface IntercompanyElimination {
    id: number;
    eliminationCode: string;
    type: string;
    sourceBranch: string;
    targetBranch: string;
    accountCode: string;
    description: string;
    amount: number;
    status: string;
    date: string;
}

export interface FxRule {
    currency: string;
    closingRate: number;
    averageRate: number;
    historicalRate: number;
    ctaReserveVND: number;
    lastUpdated: string;
}

export interface GroupStructureNode {
    id: string;
    name: string;
    code: string;
    type: "PARENT" | "SUBSIDIARY" | "JOINT_VENTURE" | "ASSOCIATE";
    ownershipPercent: number;
    votingRightsPercent: number;
    consolidationMethod: "FULL_CONSOLIDATION" | "EQUITY_METHOD" | "PROPORTIONAL";
    currency: string;
    effectiveDate: string;
    country: string;
    status: "ACTIVE" | "INACTIVE";
}

export interface CoaMappingRule {
    id: string;
    entityCode: string;
    localAccountCode: string;
    localAccountName: string;
    groupAccountCode: string;
    groupAccountName: string;
    translationCategory: "BALANCE_SHEET" | "PNL" | "EQUITY";
    mappingType: "DIRECT" | "RULE_BASED" | "COMPLEX";
    status: "MAPPED" | "PENDING_REVIEW" | "UNMAPPED";
}

export interface IntercompanyMatchItem {
    id: string;
    entityA: string;
    entityB: string;
    transactionType: "AR_AP" | "REVENUE_EXPENSE" | "LOAN" | "DIVIDEND";
    period: string;
    amountA: number;
    currencyA: string;
    amountB: number;
    currencyB: string;
    differenceVND: number;
    status: "MATCHED" | "PARTIALLY_MATCHED" | "UNMATCHED" | "EXCEPTION";
    docRefA: string;
    docRefB: string;
    accountA: string;
    accountB: string;
    notes: string;
}

export interface ConsolidationAdjustmentJournal {
    id: string;
    journalNo: string;
    period: string;
    type: "RECLASSIFICATION" | "ELIMINATION" | "FX_TRANSLATION" | "OWNERSHIP_NCI" | "AUDIT_ADJUSTMENT";
    reason: string;
    entity: string;
    drAccount: string;
    crAccount: string;
    amountVND: number;
    createdBy: string;
    approvedBy: string;
    status: "DRAFT" | "SUBMITTED" | "APPROVED" | "POSTED";
    auditTrail: string;
    createdAt: string;
}

export interface PeriodCloseStage {
    id: string;
    stageCode: "OPEN" | "DATA_COLLECTION" | "VALIDATION" | "INTERCOMPANY_MATCHING" | "ELIMINATION" | "ADJUSTMENT" | "CONSOLIDATION" | "REVIEW" | "APPROVED" | "CLOSED";
    name: string;
    description: string;
    status: "COMPLETED" | "IN_PROGRESS" | "PENDING" | "LOCKED";
    completedBy?: string;
    completedAt?: string;
}

export interface ConsolidationReport {
    asOfDate: string;
    currency: string;
    entities: ConsolidationEntity[];
    eliminationsList: IntercompanyElimination[];
    fxRules: FxRule[];
    financialStatements: {
        pnl: {
          title: string;
          grossRevenue: { rawSum: number; elimination: number; consolidated: number };
          cogsAndExpense: { rawSum: number; elimination: number; consolidated: number };
          netProfitBeforeNci: { rawSum: number; elimination: number; consolidated: number };
          nciShare: number;
          parentCompanyProfit: number;
        };
        balanceSheet: {
          title: string;
          totalAssets: { rawSum: number; elimination: number; consolidated: number };
          totalLiabilities: { rawSum: number; elimination: number; consolidated: number };
          totalEquity: { rawSum: number; elimination: number; consolidated: number };
          nciEquity: number;
          ctaReserve: number;
        };
        };
}

export interface TransferPricingData {
    decree132ComplianceStatus: string;
    financialYear: string;
    groupGlobalThresholdEUR: number;
    groupGlobalRevenueEUR: number;
    globeEffectiveTaxRates: {
        jurisdiction: string;
        statutoryTaxRate: number;
        concessionaryTaxRate?: number;
        adjustedGlobeIncome: number;
        coveredTaxes: number;
        effectiveTaxRate: number;
        topUpTaxRate: number;
        topUpTaxAmountVND: number;
        status: string;
        }[];
    interestCapRule30Ebitda: {
        ebitdaVND: number;
        netInterestExpenseVND: number;
        cap30EbitdaVND: number;
        deductibleInterestVND: number;
        nondeductibleCarriedForwardVND: number;
        isCompliant: boolean;
        };
    relatedPartyTransactions: {
        id: string;
        transactionType: string;
        sourceEntity: string;
        targetEntity: string;
        valueVND: number;
        tpMethod: string;
        benchmarkArmLengthRange: string;
        actualMargin: string;
        isArmLength: boolean;
        }[];
    documentationFiles: {
        fileType: string;
        title: string;
        status: string;
        lastUpdated: string;
        fileSize: string;
        summary: string;
        }[];
}

export interface DualReportingBridgeData {
    asOfDate: string;
    primaryCurrency: string;
    vasSummary: {
        revenue: number;
        expense: number;
        netProfit: number;
        assets: number;
        liabilities: number;
        equity: number;
        };
    ifrsSummary: {
        revenue: number;
        netProfit: number;
        assets: number;
        liabilities: number;
        equity: number;
        };
    bridgeAdjustments: {
        id: string;
        category: string;
        standardRef: string;
        title: string;
        assetImpactVND: number;
        liabilityImpactVND: number;
        pnlImpactVND: number;
        description: string;
        }[];
    totals: {
        totalAssetAdjustment: number;
        totalLiabilityAdjustment: number;
        totalPnlAdjustment: number;
        equityDifference: number;
        };
}

export interface M34Props {
    onSelectEntity?: (entity: any) => void;
    onNotify?: any;
}
