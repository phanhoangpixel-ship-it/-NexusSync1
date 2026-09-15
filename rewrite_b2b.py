import re

with open('src/routes/sales.routes.ts', 'r') as f:
    code = f.read()

def replace_route(code, route_marker, next_route_marker, new_implementation):
    start = code.find(route_marker)
    if start == -1:
        print(f"Failed to find {route_marker}")
        return code
    
    end = code.find(next_route_marker, start)
    if end == -1:
        print(f"Failed to find {next_route_marker}")
        return code
    
    end_of_route = code.rfind('});', start, end) + 3
    if end_of_route == 2:
        end_of_route = end
    
    return code[:start] + new_implementation + "\n\n" + code[end:]

b2b_header_marker = '// POST create sales order with real DB persistence'
next_marker = '// GET Omnichannel unified orders'

new_b2b = """// POST create sales order with real DB persistence and stock reservation (Delegated to ONE SALES ENGINE)
router.post(["/api/sales", "/api/sales/orders"], async (req, res) => {
  try {
    const {
      customerId,
      customerName = 'Khách hàng',
      branchId = 1,
      warehouseId = 1,
      items = [],
      shippingAddress,
      paymentMethod = "TRANSFER",
      requiresVatInvoice = false,
      vatDetails = null,
      notes = "",
      channel = 'B2B',
      idempotencyKey
    } = req.body;
    
    const userId = 1;

    const result = await SalesEngine.createOrder({
      channel: channel,
      source: "GENERIC_API",
      customerId: typeof customerId === "number" ? customerId : null,
      customerName,
      branchId: Number(branchId) || 1,
      warehouseId: Number(warehouseId) || 1,
      paymentIntent: {
        method: paymentMethod
      },
      fulfillmentIntent: {
        type: "RESERVATION",
        shippingAddress
      },
      items: items.map((it: any) => ({
        productId: Number(it.id || it.productId || 1),
        sku: it.sku,
        name: it.name,
        quantity: Number(it.qty || it.quantity || 1),
        price: Number(it.price || it.unitPrice || 0),
        discountPercent: Number(it.discountPercent || it.discount || 0)
      })),
      requiresVatInvoice,
      vatDetails,
      notes,
      idempotencyKey,
      userId
    });
    
    res.status(201).json({
      success: true,
      message: `Tạo thành công đơn bán hàng ${result.orderRef}`,
      order: {
         id: result.orderId,
         code: result.orderRef,
         status: result.status,
         finalAmount: result.grandTotal
      },
      ...result
    });
  } catch (err: any) {
    console.error("Generic Order Error:", err);
    res.status(500).json({ error: err.message });
  }
});"""

code = replace_route(code, b2b_header_marker, next_marker, new_b2b)

with open('src/routes/sales.routes.ts', 'w') as f:
    f.write(code)

print("B2B replacement complete.")
