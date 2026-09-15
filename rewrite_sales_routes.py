import re

with open('src/routes/sales.routes.ts', 'r') as f:
    code = f.read()

# Make sure we have the import
if 'import { SalesEngine }' not in code:
    code = code.replace('import { PricingService } from "../../engines/pricingService";',
                        'import { PricingService } from "../../engines/pricingService";\nimport { SalesEngine } from "../services/SalesEngine";')


def replace_route(code, route_marker, next_route_marker, new_implementation):
    start = code.find(route_marker)
    if start == -1:
        print(f"Failed to find {route_marker}")
        return code
    
    end = code.find(next_route_marker, start)
    if end == -1:
        print(f"Failed to find {next_route_marker}")
        return code
    
    # Optional: go back to the closing brace of the previous route
    end_of_route = code.rfind('});', start, end) + 3
    if end_of_route == 2: # not found
        end_of_route = end
    
    return code[:start] + new_implementation + "\n\n" + code[end:]

pos_marker = '// POST /api/sales/pos - Counter POS checkout'
online_marker = '// POST /api/sales/online'
b2b_marker = 'router.post(["/api/sales", "/api/sales/orders"], async (req, res) => {'
b2b_header_marker = '// POST /api/sales - Create generic Sales Order'

new_b2b = """// POST /api/sales - Create generic Sales Order (B2B/Wholesale)
router.post(["/api/sales", "/api/sales/orders"], async (req, res) => {
  try {
    const {
      customerId,
      customerName,
      branchId = 1,
      warehouseId = 1,
      items = [],
      shippingAddress,
      paymentMethod = "CREDIT",
      requiresVatInvoice = false,
      vatDetails = null,
      notes = "",
      idempotencyKey
    } = req.body;
    
    const userId = 1;

    const result = await SalesEngine.createOrder({
      channel: "B2B",
      source: "B2B_PORTAL",
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
        productId: Number(it.id || it.productId),
        sku: it.sku,
        name: it.name,
        quantity: Number(it.quantity || 1),
        price: Number(it.price || it.unitPrice || 0),
        discountPercent: Number(it.discountPercent || it.discount || 0)
      })),
      requiresVatInvoice,
      vatDetails,
      notes,
      idempotencyKey,
      userId
    });
    
    res.status(201).json(result);
  } catch (err: any) {
    console.error("B2B Order Error:", err);
    res.status(500).json({ error: err.message });
  }
});"""

new_pos = """// POST /api/sales/pos - Counter POS checkout (Delegated to ONE SALES ENGINE)
router.post("/api/sales/pos", async (req, res) => {
  try {
    const {
      items,
      customerId,
      customerName = "Khách lẻ vãng lai (Walk-in)",
      branchId = 1,
      warehouseId = 1,
      paymentMethod = "CASH",
      requiresVatInvoice = false,
      vatDetails = null,
      idempotencyKey
    } = req.body;
    
    const userId = 1;
    
    const result = await SalesEngine.createOrder({
      channel: "POS",
      source: "POS_TERMINAL",
      customerId: typeof customerId === "number" ? customerId : null,
      customerName,
      branchId: Number(branchId) || 1,
      warehouseId: Number(warehouseId) || 1,
      paymentIntent: {
        method: paymentMethod
      },
      fulfillmentIntent: {
        type: "IMMEDIATE"
      },
      items: items.map((it: any) => ({
        productId: Number(it.id || it.productId),
        sku: it.sku,
        name: it.name,
        quantity: Number(it.quantity || 1),
        price: Number(it.price || it.unitPrice || 0),
        discountPercent: Number(it.discountPercent || it.discount || 0),
        locationId: it.locationId || null,
        lotId: it.lotId || null,
        serials: it.serials || []
      })),
      requiresVatInvoice,
      vatDetails,
      idempotencyKey,
      userId
    });
    
    // Maintain POS return format
    res.json({
        ...result,
        pdfPath: `/invoices/Invoice_${result.orderRef}.pdf`,
        pdfUrl: `/invoices/Invoice_${result.orderRef}.pdf`,
    });
  } catch (err: any) {
    console.error("POS Checkout Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});"""


new_online = """// POST /api/sales/online - Create Online/Marketplace Order (Delegated to ONE SALES ENGINE)
router.post("/api/sales/online", async (req, res) => {
  try {
    const {
      source = "WEBSITE",
      externalOrderId = null,
      idempotencyKey = null,
      channel = "ONLINE",
      items = [],
      customerId,
      customerName = "Khách hàng Trực tuyến",
      customerType = "REGISTERED",
      guestPhone = null,
      guestEmail = null,
      shippingAddress = null,
      deliveryAddress = "Số 88 Cầu Giấy, Hà Nội",
      billingAddress = null,
      deliveryPartner = "Giao Hàng Tiết Kiệm (GHTK)",
      warehouseId = 1,
      paymentMethod = "TRANSFER",
      notes = "",
      requiresVatInvoice = false,
      vatDetails = null
    } = req.body;
    
    const userId = 1;
    
    const result = await SalesEngine.createOrder({
      channel: channel,
      source: source,
      externalOrderId,
      customerId: typeof customerId === "number" ? customerId : null,
      customerName,
      customerType,
      warehouseId: Number(warehouseId) || 1,
      paymentIntent: {
        method: paymentMethod
      },
      fulfillmentIntent: {
        type: "RESERVATION",
        deliveryPartner,
        shippingAddress: shippingAddress || deliveryAddress
      },
      items: items.map((it: any) => ({
        productId: Number(it.id || it.productId),
        sku: it.sku,
        name: it.name,
        quantity: Number(it.quantity || 1),
        price: Number(it.price || it.unitPrice || 0),
        discountPercent: Number(it.discountPercent || it.discount || 0)
      })),
      requiresVatInvoice,
      vatDetails,
      notes,
      idempotencyKey,
      userId
    });
    
    res.json(result);
  } catch (err: any) {
    console.error("Online Order Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});"""

code = replace_route(code, b2b_header_marker, '// GET Omnichannel unified orders', new_b2b)
code = replace_route(code, pos_marker, '// POST /api/sales/online', new_pos)
code = replace_route(code, online_marker, '// POST /api/sales/fulfillment', new_online)

with open('src/routes/sales.routes.ts', 'w') as f:
    f.write(code)

print("Replacement complete.")
