import re

with open('src/routes/sales.routes.ts', 'r') as f:
    code = f.read()

endpoint_code = """
// GET /api/sales/rma/list - Get all RMAs
router.get("/api/sales/rma/list", async (req, res) => {
  try {
    const orders = await db.select().from(schema.salesOrders).all();
    let rmaList: any[] = [];
    for (const order of orders) {
      if (order.notes && order.notes.includes("rmaCode")) {
        try {
          const parsed = JSON.parse(order.notes);
          if (parsed.rmas && Array.isArray(parsed.rmas)) {
            parsed.rmas.forEach((rma: any) => {
              rmaList.push({
                orderCode: order.code,
                orderId: order.id,
                customerId: order.customerId,
                ...rma
              });
            });
          }
        } catch (e) {}
      }
    }
    rmaList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(rmaList);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
"""

if "GET /api/sales/rma/list" not in code:
    code = code + endpoint_code
    with open('src/routes/sales.routes.ts', 'w') as f:
        f.write(code)
    print("Added /api/sales/rma/list")
else:
    print("Endpoint already exists.")

