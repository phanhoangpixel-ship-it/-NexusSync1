# M04 — SuperAdmin Portal & RBAC Matrix

**Module ID:** `M04`  
**Module Name:** SuperAdmin Portal & Fine-Grained RBAC Governance  
**Business Group:** `06. GOVERNANCE & SYSTEM`  
**Workspace ID:** `WS01_HUB` | **Primary Route:** `/super-admin`  
**Mounted UI Component:** `src/pages/SuperAdminPortal.tsx`  
**Primary API Endpoint:** `GET /api/rbac/roles`

---

## 1. Executive Summary & Purpose
M04 serves as the highest-level IAM security portal, governing user accounts, granular permissions, role assignments, and session controls.

## 2. Domain Authority Boundaries
- **Exclusive Authority:** Sole manager of `users`, `roles`, `permissions`, and `role_permissions`.

## 3. Data Contracts & APIs
- **Database Tables:** `users`, `roles`, `permissions`, `role_permissions`, `user_branches`.
- **APIs:**
  - `GET /api/rbac/roles` — Returns list of roles and permission counts.
  - `POST /api/rbac/roles` — Creates new custom role.
  - `PUT /api/rbac/users/:id/permissions` — Updates user granular permissions.

## 4. UI/UX Standards
- Interactive permission matrix grid with instantaneous toggle state.
- Locked default roles (SuperAdmin, Admin, CFO) with visual immutable badges.

## 5. Feature Upgrade Readiness Checklist
- [ ] Implement password expiration and forced reset policies.
- [ ] Add IP whitelisting per administrative role.
