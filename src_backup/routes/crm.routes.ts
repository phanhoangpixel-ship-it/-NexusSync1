import { Router } from "express";
import { client, db } from "../../db/index";
import * as schema from "../../db/schema";
import { SalesEngine } from "../services/SalesEngine";
import { eq, desc, sql, and } from "drizzle-orm";

export const crmRouter = Router();

// ==========================================
// 1. LEADS MANAGEMENT ENDPOINTS
// ==========================================

// GET all leads with metrics
crmRouter.get("/api/crm/leads", async (req, res) => {
  try {
    let allLeads = await db.select().from(schema.leads).orderBy(desc(schema.leads.createdAt)).all();

    // If database is currently empty, seed realistic default enterprise leads
    if (allLeads.length === 0) {
      const seedData = [
        {
          leadCode: "LEAD-2026-001",
          name: "Nguyễn Văn An",
          company: "Công ty Công nghệ Thông minh Vinatech",
          email: "an.nv@vinatech.vn",
          phone: "0901223344",
          source: "WEBSITE",
          interest: "Hệ thống ERP Sản xuất & Kho thông minh WMS",
          salespersonName: "Trần Minh Đức",
          value: 1500000000,
          status: "QUALIFIED",
        },
        {
          leadCode: "LEAD-2026-002",
          name: "Trần Thị Mai",
          company: "Tập đoàn Điện tử Quang Minh",
          email: "mai.tt@quangminhelec.com",
          phone: "0918887766",
          source: "REFERRAL",
          interest: "Giải pháp Quản lý Chuỗi cung ứng SCM & MRP",
          salespersonName: "Lê Hoàng Yến",
          value: 3200000000,
          status: "PROPOSAL",
        },
        {
          leadCode: "LEAD-2026-003",
          name: "Lê Hoàng Long",
          company: "Công ty Cổ phần Tự động hóa Phương Nam",
          email: "long.lh@phuongnamauto.vn",
          phone: "0983332211",
          source: "EVENT",
          interest: "Hệ thống Quản trị Bảo trì Thiết bị EAM & IoT",
          salespersonName: "Nguyễn Tuấn Kiệt",
          value: 850000000,
          status: "NEGOTIATION",
        },
        {
          leadCode: "LEAD-2026-004",
          name: "Phạm Hải Đăng",
          company: "Tổng công ty Dệt May Sài Gòn",
          email: "dang.ph@saigontextile.vn",
          phone: "0934556677",
          source: "DIRECT_INQUIRY",
          interest: "Phần mềm Quản lý Bán lẻ POS & Omnichannel",
          salespersonName: "Trần Minh Đức",
          value: 2100000000,
          status: "NEW",
        },
        {
          leadCode: "LEAD-2026-005",
          name: "Vũ Đình Trọng",
          company: "Công ty Cơ khí Chính xác Tân Phát",
          email: "trong.vd@tanphatmech.com",
          phone: "0977889900",
          source: "COLD_CALL",
          interest: "Module Kế toán Tài chính VAS & Hóa đơn CQT",
          salespersonName: "Lê Hoàng Yến",
          value: 650000000,
          status: "WON",
        }
      ];

      for (const s of seedData) {
        await db.insert(schema.leads).values(s).run();
      }
      allLeads = await db.select().from(schema.leads).orderBy(desc(schema.leads.createdAt)).all();
    }

    res.json(allLeads);
  } catch (err: any) {
    console.error("Error fetching CRM leads:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST create new lead
crmRouter.post("/api/crm/leads", async (req, res) => {
  try {
    const {
      name,
      company,
      email,
      phone,
      source = "WEBSITE",
      interest = "",
      salespersonName = "Admin",
      value = 0,
      status = "NEW"
    } = req.body;

    if (!name && !company) {
      return res.status(400).json({ error: "Tên người liên hệ hoặc tên công ty là bắt buộc." });
    }

    const leadCountRes = await db.select({ count: sql<number>`count(*)` }).from(schema.leads).get();
    const count = (leadCountRes?.count || 0) + 1;
    const leadCode = `LEAD-2026-${String(count).padStart(3, "0")}`;

    const inserted = await db.insert(schema.leads).values({
      leadCode,
      name: name || company,
      company: company || name,
      email: email || "",
      phone: phone || "",
      source,
      interest,
      salespersonName,
      value: Number(value) || 0,
      status: status || "NEW"
    }).returning().get();

    // Log initial activity
    await db.insert(schema.crmActivities).values({
      leadId: inserted.id,
      activityType: "NOTE",
      subject: "Tiếp nhận Lead mới",
      description: `Khởi tạo đầu mối tiềm năng ${leadCode} - ${company || name} từ nguồn ${source}.`,
      performedBy: salespersonName,
      date: new Date().toISOString().slice(0, 10),
    }).run();

    // Emit Outbox event
    try {
      await db.insert(schema.outboxEvents).values({
        eventType: "CRM_LEAD_CREATED",
        aggregateType: "CRM_LEAD",
        aggregateId: String(inserted.id),
        payload: JSON.stringify({ leadCode, company: inserted.company, value: inserted.value }),
        status: "PENDING",
      }).run();
    } catch (e) {
      // Non-blocking
    }

    res.status(201).json({
      success: true,
      message: `Đã tiếp nhận khách hàng tiềm năng: ${inserted.company}`,
      lead: inserted
    });
  } catch (err: any) {
    console.error("Error creating CRM lead:", err);
    res.status(500).json({ error: err.message });
  }
});

// PUT update lead
crmRouter.put("/api/crm/leads/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, company, email, phone, source, interest, salespersonName, value, status } = req.body;

    const existing = await db.select().from(schema.leads).where(eq(schema.leads.id, id)).get();
    if (!existing) {
      return res.status(404).json({ error: "Không tìm thấy Lead với ID này." });
    }

    await db.update(schema.leads).set({
      name: name !== undefined ? name : existing.name,
      company: company !== undefined ? company : existing.company,
      email: email !== undefined ? email : existing.email,
      phone: phone !== undefined ? phone : existing.phone,
      source: source !== undefined ? source : existing.source,
      interest: interest !== undefined ? interest : existing.interest,
      salespersonName: salespersonName !== undefined ? salespersonName : existing.salespersonName,
      value: value !== undefined ? Number(value) : existing.value,
      status: status !== undefined ? status : existing.status,
    }).where(eq(schema.leads.id, id)).run();

    const updated = await db.select().from(schema.leads).where(eq(schema.leads.id, id)).get();

    // If status changed, log activity
    if (status && status !== existing.status) {
      await db.insert(schema.crmActivities).values({
        leadId: id,
        activityType: "NOTE",
        subject: `Cập nhật giai đoạn: ${status}`,
        description: `Chuyển trạng thái Lead từ ${existing.status} sang ${status}.`,
        performedBy: salespersonName || "Admin",
        date: new Date().toISOString().slice(0, 10),
      }).run();
    }

    res.json({ success: true, lead: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE lead
crmRouter.delete("/api/crm/leads/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(schema.leads).where(eq(schema.leads.id, id)).run();
    res.json({ success: true, message: `Đã xóa Lead #${id}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST convert Lead to Customer in M03/M07 Master Data
crmRouter.post("/api/crm/leads/:id/convert", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { customerGroup = "B2B_ENTERPRISE", paymentTerms = "NET30", taxCode, address } = req.body;

    const lead = await db.select().from(schema.leads).where(eq(schema.leads.id, id)).get();
    if (!lead) {
      return res.status(404).json({ error: "Không tìm thấy Lead để chuyển đổi." });
    }

    const companyName = lead.company || lead.name;
    const custCountRes = await db.select({ count: sql<number>`count(*)` }).from(schema.customers).get();
    const custCode = `CUST-${String((custCountRes?.count || 0) + 1).padStart(4, "0")}`;

    // Insert into customers table
    const newCust = await db.insert(schema.customers).values({
      code: custCode,
      name: companyName,
      contactPerson: lead.name,
      email: lead.email || "",
      phone: lead.phone || "",
      address: address || "Hà Nội, Việt Nam",
      taxCode: taxCode || `010${Math.floor(1000000 + Math.random() * 9000000)}`,
      paymentTerms: paymentTerms,
      creditLimit: 500000000,
      notes: `Chuyển đổi từ CRM Lead ${lead.leadCode} (${lead.interest || 'Nhu cầu ERP'})`,
    }).returning().get();

    // Update lead status to WON
    await db.update(schema.leads).set({
      status: "WON"
    }).where(eq(schema.leads.id, id)).run();

    // Log Activity
    await db.insert(schema.crmActivities).values({
      leadId: id,
      customerId: newCust.id,
      activityType: "VISIT",
      subject: "Chuyển đổi thành Khách hàng B2B chính thức",
      description: `Lead ${lead.leadCode} đã chuyển đổi thành công sang Khách hàng Master Data ${custCode} (${companyName}).`,
      performedBy: lead.salespersonName || "Admin",
      date: new Date().toISOString().slice(0, 10),
    }).run();

    // Emit Outbox Event
    try {
      await db.insert(schema.outboxEvents).values({
        eventType: "CRM_LEAD_CONVERTED_TO_CUSTOMER",
        aggregateType: "CUSTOMER",
        aggregateId: String(newCust.id),
        payload: JSON.stringify({ leadCode: lead.leadCode, customerCode: custCode, customerName: companyName }),
        status: "PENDING",
      }).run();
    } catch (e) {}

    res.json({
      success: true,
      message: `Đã chuyển đổi Lead ${lead.leadCode} thành Khách hàng ${companyName} (${custCode})`,
      customer: newCust,
    });
  } catch (err: any) {
    console.error("Error converting lead:", err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. OPPORTUNITIES & PIPELINE ENDPOINTS
// ==========================================

// GET all opportunities
crmRouter.get("/api/crm/opportunities", async (req, res) => {
  try {
    let opps = await db.select().from(schema.opportunities).orderBy(desc(schema.opportunities.createdAt)).all();

    if (opps.length === 0) {
      // Seed initial opportunities
      const defaultOpps = [
        {
          code: "OPP-2026-001",
          name: "Gói Triển khai ERP Cloud Toàn diện cho Vinatech",
          customerName: "Công ty Công nghệ Thông minh Vinatech",
          value: 1500000000,
          probability: 80,
          expectedCloseDate: "2026-10-30",
          salespersonName: "Trần Minh Đức",
          stage: "QUALIFICATION",
        },
        {
          code: "OPP-2026-002",
          name: "Cung cấp & Triển khai WMS Kho Thông Minh Quang Minh",
          customerName: "Tập đoàn Điện tử Quang Minh",
          value: 3200000000,
          probability: 60,
          expectedCloseDate: "2026-11-15",
          salespersonName: "Lê Hoàng Yến",
          stage: "PROPOSAL",
        },
        {
          code: "OPP-2026-003",
          name: "Gói Bảo trì & Nâng cấp Hệ thống SCADA Phương Nam",
          customerName: "Công ty Cổ phần Tự động hóa Phương Nam",
          value: 850000000,
          probability: 90,
          expectedCloseDate: "2026-09-30",
          salespersonName: "Nguyễn Tuấn Kiệt",
          stage: "NEGOTIATION",
        }
      ];

      for (const op of defaultOpps) {
        await db.insert(schema.opportunities).values(op).run();
      }
      opps = await db.select().from(schema.opportunities).orderBy(desc(schema.opportunities.createdAt)).all();
    }

    res.json(opps);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update opportunity stage
crmRouter.put("/api/crm/opportunities/:id/stage", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { stage, probability } = req.body;

    await db.update(schema.opportunities).set({
      stage,
      probability: probability !== undefined ? Number(probability) : undefined,
    }).where(eq(schema.opportunities.id, id)).run();

    const updated = await db.select().from(schema.opportunities).where(eq(schema.opportunities.id, id)).get();
    res.json({ success: true, opportunity: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. CRM ACTIVITIES ENDPOINTS
// ==========================================

// GET activities
crmRouter.get("/api/crm/activities", async (req, res) => {
  try {
    const { leadId, customerId } = req.query;
    let query = db.select().from(schema.crmActivities).orderBy(desc(schema.crmActivities.createdAt));
    
    if (leadId) {
      query = query.where(eq(schema.crmActivities.leadId, Number(leadId))) as any;
    }
    
    let activities = await query.all();

    if (activities.length === 0) {
      const defaultActs = [
        {
          activityType: "CALL",
          subject: "Tư vấn nhu cầu tích hợp ERP & WMS",
          description: "Trao đổi 30 phút với Giám đốc CNTT về quy mô kho bãi và số lượng người dùng đồng thời.",
          performedBy: "Trần Minh Đức",
          date: "2026-09-08",
        },
        {
          activityType: "MEETING",
          subject: "Họp Demo giải pháp SCM & Báo giá khung",
          description: "Trình diễn trực tiếp phân hệ Kế toán VAS & Quản lý Hợp đồng Khung cho Ban Giám đốc.",
          performedBy: "Lê Hoàng Yến",
          date: "2026-09-09",
        },
        {
          activityType: "EMAIL",
          subject: "Gửi Dự thảo Hợp đồng & Bảng chào giá chi tiết",
          description: "Gửi email đính kèm Báo giá thương mại số QUO-2026-001 hạn bảo lưu giá 30 ngày.",
          performedBy: "Nguyễn Tuấn Kiệt",
          date: "2026-09-10",
        }
      ];
      for (const act of defaultActs) {
        await db.insert(schema.crmActivities).values(act).run();
      }
      activities = await db.select().from(schema.crmActivities).orderBy(desc(schema.crmActivities.createdAt)).all();
    }

    res.json(activities);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST create activity
crmRouter.post("/api/crm/activities", async (req, res) => {
  try {
    const { leadId, customerId, activityType = "NOTE", subject, description, performedBy = "Admin", date } = req.body;

    if (!subject) {
      return res.status(400).json({ error: "Tiêu đề hoạt động là bắt buộc." });
    }

    const inserted = await db.insert(schema.crmActivities).values({
      leadId: leadId ? Number(leadId) : null,
      customerId: customerId ? Number(customerId) : null,
      activityType,
      subject,
      description: description || "",
      performedBy,
      date: date || new Date().toISOString().slice(0, 10),
    }).returning().get();

    res.status(201).json({ success: true, activity: inserted });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. COMMERCIAL QUOTATIONS (BÁO GIÁ THƯƠNG MẠI)
// ==========================================

// GET all quotations
crmRouter.get("/api/crm/quotations", async (req, res) => {
  try {
    let quotations = await db.select().from(schema.crmQuotations).orderBy(desc(schema.crmQuotations.createdAt)).all();

    if (quotations.length === 0) {
      const defaultQuotations = [
        {
          quotationCode: "QUO-2026-001",
          customerName: "Công ty Công nghệ Thông minh Vinatech",
          contactPerson: "Nguyễn Văn An",
          email: "an.nv@vinatech.vn",
          phone: "0901223344",
          title: "Báo giá Bản quyền & Triển khai Phần mềm NexusSync ERP",
          issueDate: "2026-09-01",
          validUntil: "2026-10-01",
          subtotal: 1200000000,
          taxRate: 10,
          taxAmount: 120000000,
          discountAmount: 0,
          grandTotal: 1320000000,
          paymentTerms: "NET30",
          deliveryTerms: "Bàn giao Cloud SaaS & On-premise License",
          status: "SENT",
          salespersonName: "Trần Minh Đức",
          itemsPayload: JSON.stringify([
            { id: 1, name: "NexusSync ERP Enterprise Core License", sku: "SW-ERP-ENT", quantity: 1, unitPrice: 800000000, total: 800000000 },
            { id: 2, name: "Gói Dịch vụ Tích hợp & Đào tạo 200 Giờ", sku: "SRV-IMPL-200", quantity: 1, unitPrice: 400000000, total: 400000000 }
          ]),
          notes: "Áp dụng chính sách hỗ trợ kỹ thuật 24/7 trong năm đầu tiên."
        },
        {
          quotationCode: "QUO-2026-002",
          customerName: "Tập đoàn Điện tử Quang Minh",
          contactPerson: "Trần Thị Mai",
          email: "mai.tt@quangminhelec.com",
          phone: "0918887766",
          title: "Báo giá Hệ thống Tự động hóa Kho & Thiết bị Đầu đọc Barcode",
          issueDate: "2026-09-05",
          validUntil: "2026-10-05",
          subtotal: 2800000000,
          taxRate: 10,
          taxAmount: 280000000,
          discountAmount: 80000000,
          grandTotal: 3000000000,
          paymentTerms: "50% Ứng trước, 50% Nghiệm thu",
          deliveryTerms: "DAP Nhà máy Quang Minh - KCN Bắc Ninh",
          status: "ACCEPTED",
          salespersonName: "Lê Hoàng Yến",
          itemsPayload: JSON.stringify([
            { id: 1, name: "Cảm biến & Cổng quét RFID Pallet Tự động", sku: "HW-RFID-GATE", quantity: 4, unitPrice: 350000000, total: 1400000000 },
            { id: 2, name: "Máy quét mã vạch công nghiệp Zebra TC26", sku: "HW-SCAN-TC26", quantity: 20, unitPrice: 15000000, total: 300000000 },
            { id: 3, name: "Module WMS Wave Picking & FEFO Allocation", sku: "SW-WMS-ADV", quantity: 1, unitPrice: 1100000000, total: 1100000000 }
          ]),
          notes: "Bao gồm bảo hành thiết bị phần cứng 24 tháng chính hãng."
        }
      ];

      for (const q of defaultQuotations) {
        await db.insert(schema.crmQuotations).values(q).run();
      }
      quotations = await db.select().from(schema.crmQuotations).orderBy(desc(schema.crmQuotations.createdAt)).all();
    }

    res.json(quotations);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST create new quotation
crmRouter.post("/api/crm/quotations", async (req, res) => {
  try {
    const {
      leadId,
      customerId,
      customerName,
      contactPerson,
      email,
      phone,
      title,
      validDays = 30,
      items = [],
      taxRate = 10,
      discountAmount = 0,
      paymentTerms = "NET30",
      deliveryTerms = "DAP",
      salespersonName = "Admin",
      notes = ""
    } = req.body;

    if (!customerName || !title || items.length === 0) {
      return res.status(400).json({ error: "Tên khách hàng, tiêu đề báo giá và danh sách sản phẩm là bắt buộc." });
    }

    const countRes = await db.select({ count: sql<number>`count(*)` }).from(schema.crmQuotations).get();
    const count = (countRes?.count || 0) + 1;
    const quotationCode = `QUO-2026-${String(count).padStart(3, "0")}`;

    const subtotal = items.reduce((sum: number, it: any) => sum + (Number(it.quantity || 1) * Number(it.unitPrice || 0)), 0);
    const disc = Number(discountAmount) || 0;
    const taxAmt = ((subtotal - disc) * (Number(taxRate) || 0)) / 100;
    const grandTotal = subtotal - disc + taxAmt;

    const issueDate = new Date().toISOString().slice(0, 10);
    const validUntilDate = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const inserted = await db.insert(schema.crmQuotations).values({
      quotationCode,
      leadId: leadId ? Number(leadId) : null,
      customerId: customerId ? Number(customerId) : null,
      customerName,
      contactPerson: contactPerson || "",
      email: email || "",
      phone: phone || "",
      title,
      issueDate,
      validUntil: validUntilDate,
      subtotal,
      taxRate: Number(taxRate) || 10,
      taxAmount: taxAmt,
      discountAmount: disc,
      grandTotal,
      paymentTerms,
      deliveryTerms,
      status: "DRAFT",
      salespersonName,
      itemsPayload: JSON.stringify(items),
      notes,
    }).returning().get();

    // Log Activity
    await db.insert(schema.crmActivities).values({
      leadId: leadId ? Number(leadId) : null,
      customerId: customerId ? Number(customerId) : null,
      activityType: "EMAIL",
      subject: `Lập Báo giá thương mại ${quotationCode}`,
      description: `Khởi tạo báo giá "${title}" với tổng giá trị ${grandTotal.toLocaleString('vi-VN')} VND.`,
      performedBy: salespersonName,
      date: issueDate,
    }).run();

    res.status(201).json({
      success: true,
      message: `Đã khởi tạo báo giá ${quotationCode} thành công!`,
      quotation: inserted
    });
  } catch (err: any) {
    console.error("Error creating quotation:", err);
    res.status(500).json({ error: err.message });
  }
});

// PUT update quotation status
crmRouter.put("/api/crm/quotations/:id/status", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    await db.update(schema.crmQuotations).set({ status }).where(eq(schema.crmQuotations.id, id)).run();
    const updated = await db.select().from(schema.crmQuotations).where(eq(schema.crmQuotations.id, id)).get();
    res.json({ success: true, quotation: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST convert Quotation to authoritative Sales Order (M13)
crmRouter.post("/api/crm/quotations/:id/convert-to-so", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const quotation = await db.select().from(schema.crmQuotations).where(eq(schema.crmQuotations.id, id)).get();

    if (!quotation) {
      return res.status(404).json({ error: "Không tìm thấy báo giá để chuyển đổi." });
    }

    if (quotation.status === "CONVERTED_TO_SO") {
      return res.status(400).json({ error: "Báo giá này đã được chuyển đổi thành đơn bán hàng trước đó." });
    }

    let parsedItems = [];
    try {
      if (quotation.itemsPayload) {
        parsedItems = JSON.parse(quotation.itemsPayload);
      }
    } catch (e) {}

    // Find or create customer if needed
    let customerId = quotation.customerId;
    if (!customerId) {
      const existingCust = await db.select().from(schema.customers)
        .where(eq(schema.customers.name, quotation.customerName))
        .get();
      if (existingCust) {
        customerId = existingCust.id;
      } else {
        const countCustRes = await db.select({ count: sql<number>`count(*)` }).from(schema.customers).get();
        const code = `CUST-${String((countCustRes?.count || 0) + 1).padStart(4, "0")}`;
        const newC = await db.insert(schema.customers).values({
          code,
          name: quotation.customerName,
          contactPerson: quotation.contactPerson || "",
          email: quotation.email || "",
          phone: quotation.phone || "",
          address: "Hà Nội, Việt Nam",
          paymentTerms: quotation.paymentTerms || "NET30",
        }).returning().get();
        customerId = newC.id;
      }
    }

    // Call authoritative SalesEngine to create order
    const orderResult = await SalesEngine.createOrder({
      channel: "B2B",
      source: "CRM_QUOTATION",
      customerId: customerId,
      customerName: quotation.customerName,
      branchId: 1,
      warehouseId: 1,
      paymentIntent: {
        method: "TRANSFER"
      },
      fulfillmentIntent: {
        type: "RESERVATION",
        shippingAddress: quotation.deliveryTerms || "Giao tại xưởng khách hàng"
      },
      items: parsedItems.map((it: any) => ({
        productId: Number(it.productId || it.id || 1),
        sku: it.sku || "PROD-GEN",
        name: it.name || it.productName || "Sản phẩm B2B",
        quantity: Number(it.quantity || it.qty || 1),
        price: Number(it.unitPrice || it.price || 0),
        discountPercent: Number(it.discountPercent || 0)
      })),
      requiresVatInvoice: true,
      notes: `Được tạo tự động từ Báo giá CRM ${quotation.quotationCode} (${quotation.title})`,
      userId: 1
    });

    // Update Quotation Status
    await db.update(schema.crmQuotations).set({
      status: "CONVERTED_TO_SO",
      convertedSalesOrderId: orderResult.orderId,
      convertedSalesOrderCode: orderResult.orderRef
    }).where(eq(schema.crmQuotations.id, id)).run();

    // Log Activity
    await db.insert(schema.crmActivities).values({
      leadId: quotation.leadId,
      customerId: customerId,
      activityType: "MEETING",
      subject: `Chốt đơn hàng & Chuyển đổi thành Đơn Bán Hàng ${orderResult.orderRef}`,
      description: `Báo giá ${quotation.quotationCode} đã được chuyển đổi thành công sang Đơn hàng bán M13 với mã ${orderResult.orderRef}. Tồn kho đã được khoanh giữ (Allocated).`,
      performedBy: quotation.salespersonName || "Admin",
      date: new Date().toISOString().slice(0, 10),
    }).run();

    // Emit Outbox Event
    try {
      await db.insert(schema.outboxEvents).values({
        eventType: "CRM_QUOTATION_CONVERTED_TO_SO",
        aggregateType: "SALES_ORDER",
        aggregateId: String(orderResult.orderId),
        payload: JSON.stringify({ quotationCode: quotation.quotationCode, orderCode: orderResult.orderRef, customerName: quotation.customerName }),
        status: "PENDING",
      }).run();
    } catch (e) {}

    res.json({
      success: true,
      message: `Báo giá ${quotation.quotationCode} đã chuyển đổi thành công sang Đơn bán hàng M13 (${orderResult.orderRef})!`,
      orderRef: orderResult.orderRef,
      orderId: orderResult.orderId,
      status: orderResult.status
    });
  } catch (err: any) {
    console.error("Error converting quotation to SO:", err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. CRM ANALYTICS & DASHBOARD METRICS
// ==========================================
crmRouter.get("/api/crm/analytics", async (req, res) => {
  try {
    const leadsList = await db.select().from(schema.leads).all();
    const quotationsList = await db.select().from(schema.crmQuotations).all();
    const oppsList = await db.select().from(schema.opportunities).all();

    const totalLeads = leadsList.length;
    const totalPipelineValue = leadsList.reduce((sum, l) => sum + (Number(l.value) || 0), 0);
    const wonCount = leadsList.filter(l => l.status === "WON").length;
    const winRate = totalLeads > 0 ? ((wonCount / totalLeads) * 100).toFixed(1) : "0";

    const stageBreakdown = {
      NEW: leadsList.filter(l => l.status === "NEW").length,
      CONTACTED: leadsList.filter(l => l.status === "CONTACTED").length,
      QUALIFIED: leadsList.filter(l => l.status === "QUALIFIED").length,
      PROPOSAL: leadsList.filter(l => l.status === "PROPOSAL").length,
      NEGOTIATION: leadsList.filter(l => l.status === "NEGOTIATION").length,
      WON: wonCount,
      LOST: leadsList.filter(l => l.status === "LOST").length,
    };

    const totalQuotationsValue = quotationsList.reduce((sum, q) => sum + (Number(q.grandTotal) || 0), 0);

    res.json({
      totalLeads,
      totalPipelineValue,
      winRate: `${winRate}%`,
      wonCount,
      totalQuotations: quotationsList.length,
      totalQuotationsValue,
      stageBreakdown,
      opportunitiesCount: oppsList.length
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default crmRouter;
