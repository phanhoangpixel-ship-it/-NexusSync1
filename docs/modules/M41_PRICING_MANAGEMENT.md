# M41 — Product Pricing & Price Management

**Module ID:** `M41`  
**Module Name:** Product Pricing & Margin Management  
**Business Group:** `01. COMMERCIAL & SALES`  
**Workspace ID:** `WS30_PRICING` | **Primary Route:** `/pricing-management`  
**Mounted UI Component:** `src/pages/PricingManagement.tsx`  
**Primary API Endpoint:** `GET /api/pricing/price-books`

---

## 1. Executive Summary & Purpose
M41 is the **Central Pricing Authority** for NexusSync ERP. It governs wholesale and retail price books, customer group discounts, tiered volume breaks, promotional campaigns, and minimum profit margin enforcement.

## 2. Domain Authority Boundaries
- **NON-NEGOTIABLE SINGLE WRITER:** `PricingEngine` is the SOLE authority for calculating and providing selling prices across all channels (Sales Orders M13, POS M16, E-commerce).
- **Prohibited:** No sales module is permitted to hardcode prices or circumvent price books without approved override authorization.

## 3. Data Contracts & Schema
- **Database Tables:** `price_books`, `price_book_items`, `discount_rules`, `promotional_campaigns`.
- **APIs:**
  - `GET /api/pricing/price-books` — List price books.
  - `POST /api/pricing/resolve` — Single-point calculation for applicable customer price.
  - `POST /api/pricing/price-books` — Create price book.

## 4. UI/UX Standards
- Price simulator sandbox allowing users to preview final net price for any customer and quantity.
- Margin % and unit prices in `font-mono tabular-nums` with margin warning indicators.

## 5. Feature Upgrade Readiness Checklist
- [ ] Add margin guardrails blocking sales orders if gross margin falls below 15%.
- [ ] Implement scheduled price book activation with automated start/end dates.
