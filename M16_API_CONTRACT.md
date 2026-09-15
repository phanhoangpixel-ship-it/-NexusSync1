# NEXUSSYNC ERP - M16 API CONTRACT

## 1. Endpoints
- `GET /api/sales`: Retrieve sales orders and POS transactions.
- `POST /api/sales`: Create sales order / POS transaction (supports idempotency key).
- `GET /api/shift/active`: Retrieve active shift details for the terminal.
- `POST /api/shift/open`: Open a new cashier shift with opening float.
- `POST /api/shift/:id/close`: Close a shift with denomination counts and notes.
- `GET /api/shift/:id/summary`: Retrieve shift movements and authoritative reconstructed expected cash.
- `POST /api/shift/cash-movement`: Record manual cash in/out movements.
- `POST /api/shift/:id/approve-variance`: Approve or reject shift cash variance (SoD enforced).

## 2. Idempotency & Security
- All mutation requests require `Idempotency-Key` and Bearer Token authentication.
- RBAC role validation enforced on server side for shift management, cash operations, and order creation.
