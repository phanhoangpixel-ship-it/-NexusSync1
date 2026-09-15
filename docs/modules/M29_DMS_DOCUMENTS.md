# M29 — Document Management System (DMS)

**Module ID:** `M29`  
**Module Name:** Document Management System (DMS)  
**Business Group:** `06. GOVERNANCE & SYSTEM`  
**Workspace ID:** `WS28_DMS` | **Primary Route:** `/dms`  
**Mounted UI Component:** `src/pages/DMS.tsx`  
**Primary API Endpoint:** `GET /api/dms/documents`

---

## 1. Executive Summary & Purpose
M29 is the enterprise digital document repository. It manages contracts, statutory licenses, customer delivery receipts, QC test certificates, and scanned paper vouchers with version control and access restrictions.

## 2. Domain Authority Boundaries
- **Exclusive Authority:** Document metadata, file storage references, folder trees, and document version history.

## 3. Data Contracts & APIs
- **Database Tables:** `dms_documents`, `dms_folders`, `dms_versions`.
- **APIs:**
  - `GET /api/dms/documents` — Query documents with category/tag filters.
  - `POST /api/dms/documents/upload` — Upload and index document.
  - `GET /api/dms/documents/:id/download` — Retrieve file with authorization check.

## 4. UI/UX Standards
- File preview drawer supporting PDF, images, and text.
- File size, version tag, and upload timestamp in `font-mono`.

## 5. Feature Upgrade Readiness Checklist
- [ ] Add automated OCR text extraction for search indexing of scanned invoices.
- [ ] Implement digital signature integration (eID / USB Token) for internal contract approvals.
