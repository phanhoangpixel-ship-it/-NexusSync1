# M03 — System Settings & Parameters

**Module ID:** `M03`  
**Module Name:** System Settings & Parameters  
**Business Group:** `06. GOVERNANCE & SYSTEM`  
**Workspace ID:** `WS01_HUB` | **Primary Route:** `/system-settings`  
**Mounted UI Component:** `src/pages/SystemSettings.tsx`  
**Primary API Endpoint:** `GET /api/settings`

---

## 1. Executive Summary & Purpose
M03 manages global enterprise parameters, multi-currency exchange rates, branch/legal entity configurations, document numbering sequences, and system feature toggles.

## 2. Domain Authority Boundaries
- **Exclusive Authority:** Authoritative for global configuration key-value pairs, currency rate conversions, and sequence generators.

## 3. Data Contracts & APIs
- **Database Tables:** `system_settings`, `currency_rates`, `document_sequences`, `company_profiles`.
- **APIs:**
  - `GET /api/settings` — Returns system configuration dictionary.
  - `PUT /api/settings` — Updates system parameters with audit logging.
  - `GET /api/currency/rates` — Exchange rate matrix.

## 4. UI/UX Standards
- Tabbed settings layout (General, Localization & Currency, Document Numbering, Security).
- Changes require confirmation dialog (`ConfirmDialog.tsx`) before saving.

## 5. Feature Upgrade Readiness Checklist
- [ ] Add automated exchange rate sync with central banking APIs.
- [ ] Add multi-tenant company hierarchy switcher.
