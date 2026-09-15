# M12 (CRM) → M41 (PRICING MANAGEMENT) — DIFFERENCE JUSTIFICATION REPORT
## Universal UI Sync Protocol (Step 4)

**Document Reference:** `/docs/design-specs/M12_M41_DIFFERENCE_JUSTIFICATION_REPORT.md`  
**Governing Standard:** Rule #20 (Full UI/UX Module Replication Protocol) & Universal UI Sync Protocol  
**Source Module:** M12 CRM Leads (`m12`)  
**Target Module:** M41 Pricing Management (`M41`)  
**Audit Date:** 2026-09-10  

---

## EXECUTIVE SUMMARY

Pursuant to the **Universal UI Sync Protocol**, UI synchronization across enterprise ERP modules must strictly distinguish between **Tier 1 (Universal Design Tokens)**, **Tier 2 (Adaptive Structure)**, and **Tier 3 (Domain-Specific Features)**. 

To prevent breaking business logic while ensuring visual consistency, M41 adopts M12's Tier 1 design language (L0 headers, hub header cards, metric cards, WCAG AA status tokens, monospaced tabular numbers) and Tier 2 adaptive layouts (scrollable tab navigation, master table hover styling, filter toolbars). However, domain-specific features (Tier 3) differ substantially due to enterprise functional requirements.

---

## DIFFERENCE JUSTIFICATION REPORT TABLE

| UI Element / Structural Component | Sync Tier | Source Module (M12 CRM) | Target Module (M41 Pricing) | Justification for Difference (Business Domain Logic) |
| :--- | :--- | :--- | :--- | :--- |
| **Workspace Header & Hub Card** | **Tier 1** | CRM Lead & Deal Hub header with quick action buttons ("Làm mới", "Thêm Lead Mới"). | Product Pricing & Price Management hub header with quick action buttons ("Nhận Phiếu Nhập Kho", "Tra Cứu Giá Waterfall"). | **Domain Adaptation:** Quick actions correspond directly to the specific module's core workflows (Lead intake vs. Inbound Costing sync & Waterfall simulation). |
| **Top KPI Metric Cards** | **Tier 2** | 4 CRM metrics: Total Leads (Đầu mối), Pipeline Volume (Quy mô phễu), Win Rate (Tỷ lệ chốt), Quotations (Báo giá). | 4 Pricing metrics: Active Price Lists (Bảng giá hoạt động), Configured SKUs (SKU cấu hình), Pending Approvals (Chờ duyệt Maker-Checker), Average Margin (Biên LN trung bình). | **Domain Adaptation:** KPI cards reflect critical operational metrics of the target domain. Pricing requires tracking active price lists, SKU pricing status, pending margin approvals, and gross margin health rather than CRM win rates. |
| **Primary Navigation Tabs** | **Tier 2** | 5 CRM Tabs: Leads Tab, Pipeline Tab, Quotations Tab, Activities Tab, Analytics Tab. | 10 Pricing Tabs: Product Prices, Price Lists, Category Rules, Customer Pricing, Quantity Tiers, Promotions, Bulk Pricing, Price Approvals, Price History, Waterfall Simulator. | **Domain Scope Difference:** M41 manages 10 distinct pricing and commercial management sub-domains (markup rules, volume volume tiers, maker-checker approvals, authoritative waterfall) which have no equivalent in CRM. Forcing a 5-tab structure would destroy M41 pricing functionality. |
| **Pipeline Funnel Widget** | **Tier 3** | CRM 5-stage conversion funnel (Leads → Deals → Quotations → Activities → Forecasts). | *None* (Omitted in M41). | **Domain Exclusion:** Pricing management is an enterprise catalog and commercial policy engine, not a sales pipeline tracker. The CRM funnel is exclusive to M12 and is not applicable to M41. |
| **Authoritative Pricing Waterfall Simulator** | **Tier 3** | *None* (Exclusive to M41). | 6-step price resolution simulator (Customer Contract → Group Price → Volume Tier → Promotion → Category Rule → Base Retail Price). | **Domain Exclusive:** Essential core engine of M41 Pricing Management providing real-time price resolution debugging. Preserved 100% with M12 Tier 1 presentation styling. |
| **Maker-Checker Approval Queue** | **Tier 3** | *None* (Exclusive to M41). | Pending margin reduction requests with strict SoD (Segregation of Duties) approval controls. | **Domain Exclusive:** Enterprise financial compliance requirement for price overrides below 15% margin threshold. Preserved with custom `ConfirmDialog.tsx`. |

---

## CONCLUSION & GOVERNANCE SEAL

1. **Tier 1 Compliance:** 100% identical styling for typography, color tokens, badge contrast, monospaced tabular numbers, and dialog confirmation mechanics (`ConfirmDialog.tsx` under Rule #19).
2. **Tier 2 Compliance:** Adaptive tab count and metric card contents correctly adjusted to reflect M41 Pricing domain realities.
3. **Tier 3 Preservation:** All 10 M41 pricing tabs, the 6-step waterfall simulator, and Maker-Checker workflows remain fully intact and functional.
