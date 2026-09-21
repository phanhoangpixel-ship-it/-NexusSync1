import fetch from "node-fetch";

const BASE_URL = "http://localhost:3000";

interface TestResult {
  step: string;
  name: string;
  passed: boolean;
  details: string;
  payload?: any;
  response?: any;
}

const results: TestResult[] = [];

function assert(condition: boolean, step: string, name: string, details: string, payload?: any, response?: any) {
  results.push({
    step,
    name,
    passed: condition,
    details,
    payload,
    response,
  });
  const statusEmoji = condition ? "PASS" : "FAIL";
  console.log(`[${statusEmoji}] ${step}: ${name} -> ${details}`);
  if (!condition) {
    console.error(`  FAILURE DETAILS:`, JSON.stringify(response, null, 2));
  }
}

async function runQaSuite() {
  console.log("================================================================================");
  console.log("STARTING NEXUSSYNC ERP - M06 INNOVATION R&D FULL QA AUTOMATION TEST SUITE");
  console.log("Authority: Single-Writer Architecture Gate & Cross-Module SSOT Verification");
  console.log("================================================================================\n");

  // 0. AUTHENTICATION & REAL DATA DISCOVERY (NO MOCKS)
  console.log("--- BƯỚC 0: DISCOVERY DỮ LIỆU THỰC TRÊN HỆ THỐNG THẬT ---");

  // 0.1 Login Admin
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", role: "SUPER_ADMIN" }),
  });
  const adminAuth: any = await adminLoginRes.json();
  const adminToken = adminAuth.token;
  console.log("1. Đăng nhập Admin thành công. Token:", adminToken ? "Đã cấp JWT" : "Lỗi");

  // 0.2 Login Regular Staff (Without rd:confidential)
  const staffLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "staff_viewer", role: "STAFF" }),
  });
  const staffAuth: any = await staffLoginRes.json();
  const staffToken = staffAuth.token;
  console.log("2. Đăng nhập Staff thành công. Token:", staffToken ? "Đã cấp JWT" : "Lỗi");

  // 0.3 Read Real Products (M07)
  const productsRes = await fetch(`${BASE_URL}/api/products`);
  const products: any = await productsRes.json();
  const realProduct = products.find((p: any) => p.id && p.status === "ACTIVE") || products[0];
  console.log(`3. Đọc dữ liệu thật từ M07 Item Master (GET /api/products):`, {
    totalProducts: products.length,
    selectedSKU: realProduct?.sku,
    selectedName: realProduct?.name,
    selectedId: realProduct?.id,
  });

  // 0.4 Read Real Stock Balances (M17)
  const balancesRes = await fetch(`${BASE_URL}/api/inventory/balances`);
  const balances: any = await balancesRes.json();
  const realBalance = balances.find((b: any) => b.productId === realProduct.id && b.stockAvailable > 2) || balances[0];
  console.log(`4. Đọc dữ liệu tồn kho thật từ M17 Inventory (GET /api/inventory/balances):`, {
    totalBalances: balances.length,
    selectedWarehouse: realBalance?.warehouseId,
    stockAvailable: realBalance?.stockAvailable,
    stockPhysical: realBalance?.stockPhysical,
  });

  // 0.5 Read Real Suppliers (M09)
  const suppliersRes = await fetch(`${BASE_URL}/api/suppliers`);
  const suppliers: any = await suppliersRes.json();
  console.log(`5. Đọc nhà cung cấp thật từ M09 (GET /api/suppliers): ${suppliers.length} nhà cung cấp.`);

  // 0.6 Read Real Cost Layers (M42)
  const costLayersRes = await fetch(`${BASE_URL}/api/cogs/cost-layers`);
  const costLayersData: any = await costLayersRes.json();
  const costLayers = costLayersData.data || [];
  console.log(`6. Đọc tầng chi phí thật từ M42 Costing (GET /api/cogs/cost-layers): ${costLayers.length} tầng chi phí.\n`);

  const realMatId = realBalance?.productId || realProduct.id;
  const realWarehouseId = realBalance?.warehouseId || 1;
  const realLocationId = realBalance?.locationId || 10;

  // ===========================================================================
  // [TEST 1] Khởi tạo dự án & thử nghiệm công thức đầu tiên
  // ===========================================================================
  console.log("--- [TEST 1] Khởi tạo dự án & thử nghiệm công thức đầu tiên ---");
  // 1.1 Tạo dự án R&D thật
  const createProjRes = await fetch(`${BASE_URL}/api/rd/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      title: "Bo Mạch IoT Nexus Edge-v3 Tiết Kiệm Năng Lượng",
      category: "Điện tử & Viễn thông",
      lead: "TS. Lê Viết Đạt (R&D Lead)",
      budget: 500000000,
      startDate: "2026-09-21",
      deadline: "2027-03-31",
      trlLevel: 4,
      riskLevel: "MEDIUM",
      isConfidential: true,
      description: "Đề tài phát triển bo mạch vi xử lý công suất thấp tích hợp AI gia tốc cho thiết bị biên.",
    }),
  });
  const createdProj: any = await createProjRes.json();
  const projectId = createdProj.id;
  assert(
    createProjRes.status === 201 && Boolean(projectId),
    "TEST 1.1",
    "Tạo dự án R&D mới",
    `Mã dự án: ${createdProj.projectCode}, ID: ${projectId}`,
    null,
    createdProj
  );

  // 1.2 Negative Test: Thử nghiệm với productId KHÔNG tồn tại trong hệ thống M07
  const badExpRes = await fetch(`${BASE_URL}/api/rd/experiments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      projectId,
      formulaName: "Công thức thử nghiệm rác",
      components: [{ productId: 999999, name: "Nguyên liệu ma", qty: 10, unit: "Cái" }],
    }),
  });
  const badExpData: any = await badExpRes.json();
  assert(
    badExpRes.status === 400 && badExpData.error && badExpData.error.includes("không tồn tại"),
    "TEST 1.2",
    "Chặn dữ liệu rác (Invalid productId)",
    `Hệ thống chặn thành công: ${badExpData.error}`,
    null,
    badExpData
  );

  // 1.3 Positive Test: Thử nghiệm lần 1 với SKU thật lấy từ M07 Item Master
  const exp1Res = await fetch(`${BASE_URL}/api/rd/experiments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      projectId,
      formulaName: "Công thức Thử nghiệm Cơ sở (Baseline)",
      operatorName: "KS. Trần Quốc Bảo",
      components: [
        {
          productId: realMatId,
          name: realProduct.name,
          sku: realProduct.sku,
          qty: 2.0,
          unit: realProduct.baseUnit || "Cái",
          unitCost: realProduct.costPrice || 2000000,
        },
      ],
      yieldRate: 90.0,
      testBatchSize: 10.0,
      changeLog: "Khởi tạo công thức baseline v1.0",
    }),
  });
  const exp1Data: any = await exp1Res.json();
  assert(
    exp1Res.status === 201 && exp1Data.version?.versionNumber === 1,
    "TEST 1.3",
    "Ghi nhận thử nghiệm lần 1",
    `formulaVersion: ${exp1Data.version?.versionNumber} (${exp1Data.version?.versionLabel}), tham chiếu SKU thật: ${realProduct.sku}`,
    null,
    exp1Data
  );

  // ===========================================================================
  // [TEST 2] Quản lý phiên bản công thức (Version Control - Zero-Overwrite)
  // ===========================================================================
  console.log("\n--- [TEST 2] Quản lý phiên bản công thức (Zero-Overwrite) ---");
  const exp2Res = await fetch(`${BASE_URL}/api/rd/experiments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      projectId,
      formulaName: "Công thức Cải tiến Tối ưu Hiệu Năng",
      operatorName: "KS. Trần Quốc Bảo",
      components: [
        {
          productId: realMatId,
          name: realProduct.name,
          sku: realProduct.sku,
          qty: 1.5, // Điều chỉnh tỷ lệ vật tư
          unit: realProduct.baseUnit || "Cái",
          unitCost: realProduct.costPrice || 2000000,
        },
      ],
      yieldRate: 95.5,
      testBatchSize: 20.0,
      changeLog: "Tối ưu hóa thành phần giảm 25% tỷ lệ hao hụt",
    }),
  });
  const exp2Data: any = await exp2Res.json();

  // Truy vấn lịch sử phiên bản
  const versionsRes = await fetch(`${BASE_URL}/api/rd/formulas/${projectId}/versions`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const versions: any = await versionsRes.json();
  const ver1 = versions.find((v: any) => v.versionNumber === 1);
  const ver2 = versions.find((v: any) => v.versionNumber === 2);

  assert(
    versions.length >= 2 &&
      ver1 &&
      ver2 &&
      ver1.components[0].qty === 2.0 &&
      ver2.components[0].qty === 1.5,
    "TEST 2",
    "Kiểm tra Zero-Overwrite & Version Control",
    `Version 1 còn nguyên (qty=${ver1?.components[0]?.qty}), Version 2 độc lập (qty=${ver2?.components[0]?.qty}). Tổng phiên bản: ${versions.length}`,
    null,
    versions
  );

  // ===========================================================================
  // [TEST 3] Xuất kho nguyên liệu thử nghiệm (M06 ↔ M17 Single-Writer)
  // ===========================================================================
  console.log("\n--- [TEST 3] Xuất kho nguyên liệu thử nghiệm (M06 ↔ M17) ---");
  // 3.1 Kiểm tra tồn kho trước khi xuất
  const preBalRes = await fetch(`${BASE_URL}/api/inventory/balances`);
  const preBalances: any = await preBalRes.json();
  const targetBalBefore = preBalances.find((b: any) => b.productId === realMatId && b.warehouseId === realWarehouseId);
  const stockBefore = targetBalBefore ? targetBalBefore.stockAvailable : 0;

  // 3.2 Gọi lệnh xuất kho phục vụ R&D Testing
  const reqQty = 2;
  const requisitionRes = await fetch(`${BASE_URL}/api/rd/projects/${projectId}/material-requisition`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      productId: realMatId,
      warehouseId: realWarehouseId,
      locationId: realLocationId,
      quantity: reqQty,
      operatorName: "Thử nghiệm Lab R&D",
      notes: "Xuất 2 chiếc Laptop/vật tư thử nghiệm đo kiểm độ bền nhiệt",
    }),
  });
  const reqData: any = await requisitionRes.json();

  // 3.3 Kiểm tra tồn kho sau khi xuất qua M17 Read API
  const postBalRes = await fetch(`${BASE_URL}/api/inventory/balances`);
  const postBalances: any = await postBalRes.json();
  const targetBalAfter = postBalances.find((b: any) => b.productId === realMatId && b.warehouseId === realWarehouseId);
  const stockAfter = targetBalAfter ? targetBalAfter.stockAvailable : 0;

  assert(
    (requisitionRes.status === 200 || requisitionRes.status === 201) &&
      reqData.success === true &&
      Boolean(reqData.transaction?.transactionId) &&
      stockBefore - stockAfter === reqQty,
    "TEST 3",
    "Xuất kho R&D qua M17 InventoryService.postTransaction",
    `Mã chứng từ xuất: #${reqData.transaction?.transactionId} (${reqData.transaction?.referenceNo}), Tồn trước: ${stockBefore}, Tồn sau: ${stockAfter} (Giảm chính xác ${reqQty})`,
    null,
    reqData
  );

  // ===========================================================================
  // [TEST 4] Tính toán giá thành ước tính (Cost Estimation — M06 ↔ M42)
  // ===========================================================================
  console.log("\n--- [TEST 4] Tính toán giá thành ước tính (M06 ↔ M42) ---");
  const costEstRes = await fetch(`${BASE_URL}/api/rd/projects/${projectId}/cost-estimate`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const costEstData: any = await costEstRes.json();
  assert(
    costEstRes.status === 200 &&
      costEstData.costs?.totalManufacturingCost > 0 &&
      costEstData.componentBreakdown?.length > 0 &&
      costEstData.componentBreakdown[0].unitCost > 0,
    "TEST 4",
    "Tính giá thành công thức tự động liên kết M42 Costing",
    `Đơn giá vật tư: ${costEstData.componentBreakdown[0]?.unitCost?.toLocaleString()} VND (Source: ${costEstData.componentBreakdown[0]?.sourceAuthority}), Tổng giá thành SX: ${costEstData.costs?.totalManufacturingCost?.toLocaleString()} VND`,
    null,
    costEstData
  );

  // ===========================================================================
  // [TEST 5] Đánh giá & Phê duyệt Mẫu (Sample Evaluation State Machine Guard)
  // ===========================================================================
  console.log("\n--- [TEST 5] Đánh giá & Phê duyệt Mẫu (Sample Evaluation Guard) ---");
  // 5.1 Chuyển đề tài sang giai đoạn SAMPLE_EVALUATION
  const stageEvalRes = await fetch(`${BASE_URL}/api/rd/projects/${projectId}/stage`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      targetStage: "SAMPLE_EVALUATION",
      reason: "Hoàn tất thử nghiệm lab, chuyển sang đánh giá mẫu pilot",
    }),
  });
  const stageEvalData: any = await stageEvalRes.json();
  assert(
    stageEvalRes.status === 200 && stageEvalData.project?.stage === "SAMPLE_EVALUATION",
    "TEST 5.1",
    "Chuyển giai đoạn sang SAMPLE_EVALUATION",
    `Trạng thái hiện tại: ${stageEvalData.project?.stage}`,
    null,
    stageEvalData
  );

  // 5.2 Ghi nhận kết quả mẫu FAIL (Đợt 1)
  const failSampleRes = await fetch(`${BASE_URL}/api/rd/samples/${projectId}/evaluate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      projectId,
      evaluationScore: 48.0,
      result: "FAIL",
      evaluatorName: "Kỹ sư QC Lab - Nguyễn Văn Tuấn",
      testParameters: {
        signalIntegrity: "Không đạt yêu cầu truyền dẫn cao tần",
        thermalDissipation: "Nhiệt độ vượt ngưỡng 85 độ C",
      },
      defectNotes: "Phát hiện quá nhiệt cục bộ trên IC nguồn phụ",
    }),
  });
  const failSampleData: any = await failSampleRes.json();
  assert(
    failSampleRes.status === 201 && failSampleData.evaluation?.result === "FAIL",
    "TEST 5.2",
    "Ghi nhận đợt kiểm nghiệm mẫu FAIL",
    `Mã mẫu: ${failSampleData.evaluation?.sampleCode}, Kết quả: ${failSampleData.evaluation?.result} (Điểm: ${failSampleData.evaluation?.evaluationScore})`,
    null,
    failSampleData
  );

  // 5.3 Negative Guard Test: Thử chuyển sang APPROVED khi mẫu đang FAIL
  const blockedApproveRes = await fetch(`${BASE_URL}/api/rd/projects/${projectId}/stage`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      targetStage: "APPROVED",
      reason: "Cố tình phê duyệt khi mẫu chưa đạt",
    }),
  });
  const blockedApproveData: any = await blockedApproveRes.json();
  assert(
    blockedApproveRes.status === 400 &&
      blockedApproveData.error &&
      blockedApproveData.error.includes("PASS"),
    "TEST 5.3",
    "State Machine Guard chặn phê duyệt khi mẫu FAIL",
    `Chặn thành công: ${blockedApproveData.error}`,
    null,
    blockedApproveData
  );

  // 5.4 Ghi nhận kết quả mẫu PASS (Đợt 2 sau khi fix)
  const passSampleRes = await fetch(`${BASE_URL}/api/rd/samples/${projectId}/evaluate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      projectId,
      evaluationScore: 96.5,
      result: "PASS",
      evaluatorName: "Kỹ sư QC Lab - Nguyễn Văn Tuấn",
      testParameters: {
        signalIntegrity: "Đạt chuẩn truyền dẫn 10 Gbps",
        thermalDissipation: "Nhiệt độ ổn định ở 48 độ C",
      },
      defectNotes: "Đã khắc phục hoàn toàn lỗi tản nhiệt sau khi phủ keo gốm",
    }),
  });
  const passSampleData: any = await passSampleRes.json();
  assert(
    passSampleRes.status === 201 && passSampleData.evaluation?.result === "PASS",
    "TEST 5.4",
    "Ghi nhận đợt kiểm nghiệm mẫu đạt chuẩn PASS",
    `Mã mẫu: ${passSampleData.evaluation?.sampleCode}, Kết quả: ${passSampleData.evaluation?.result} (Điểm: ${passSampleData.evaluation?.evaluationScore})`,
    null,
    passSampleData
  );

  // ===========================================================================
  // [TEST 6] Kiểm tra tuân thủ môi trường (Eco-Compliance - RoHS/REACH)
  // ===========================================================================
  console.log("\n--- [TEST 6] Kiểm tra tuân thủ môi trường (Eco-Compliance) ---");
  const ecoCheckRes = await fetch(`${BASE_URL}/api/rd/eco-compliance/check`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      projectId,
      standardName: "EU RoHS & REACH Directive (EC 1907/2006)",
      status: "PASS",
      testedParameters: {
        leadPb: "0.01% (Dưới ngưỡng 0.1%)",
        cadmiumCd: "0.001% (Dưới ngưỡng 0.01%)",
        mercuryHg: "Không phát hiện (ND)",
        cr6Plus: "Không phát hiện (ND)",
      },
      certificationDocRef: "CERT-ROHS-SGS-2026-9921",
      checkedBy: "ThS. Đặng Thu Thủy (EHS Specialist)",
      notes: "Tất cả linh kiện và vật liệu hàn đáp ứng 100% tiêu chuẩn Green Electronic",
    }),
  });
  const ecoCheckData: any = await ecoCheckRes.json();
  assert(
    ecoCheckRes.status === 201 && ecoCheckData.check?.status === "PASS",
    "TEST 6",
    "Xác nhận Tuân thủ Môi trường (RoHS / REACH)",
    `Mã chứng nhận: ${ecoCheckData.check?.checkCode}, Tiêu chuẩn: ${ecoCheckData.check?.standardName}, Trạng thái: ${ecoCheckData.check?.status}`,
    null,
    ecoCheckData
  );

  // ===========================================================================
  // [TEST 7] Đăng ký SKU chính thức khi công thức được duyệt (M06 ↔ M07)
  // ===========================================================================
  console.log("\n--- [TEST 7] Đăng ký SKU chính thức (M06 ↔ M07 SSOT) ---");
  // 7.1 Phê duyệt đề tài sang APPROVED (Hội đồng nghiệm thu kỹ thuật)
  const approveRes = await fetch(`${BASE_URL}/api/rd/projects/${projectId}/stage`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      targetStage: "APPROVED",
      reason: "Mẫu đạt 96.5 điểm và đạt chứng chỉ RoHS. Đủ điều kiện nghiệm thu thương mại.",
    }),
  });
  const approveData: any = await approveRes.json();
  assert(
    approveRes.status === 200 && approveData.project?.stage === "APPROVED",
    "TEST 7.1",
    "Phê duyệt đề tài sang APPROVED",
    `Stage: ${approveData.project?.stage}, Tiến độ: ${approveData.project?.progress}%`,
    null,
    approveData
  );

  // 7.2 Đăng ký SKU chính thức vào Item Master M07
  const officialSku = `SKU-IOT-EDGE-V3-${Date.now().toString().slice(-4)}`;
  const regSkuRes = await fetch(`${BASE_URL}/api/rd/projects/${projectId}/register-sku`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      customSku: officialSku,
      productName: "Bo Mạch Xử Lý AI Biên Nexus Edge IoT v3 (Thương Mại)",
      costPrice: 1850000,
      retailPrice: 3200000,
      baseUnit: "Bo",
      categoryId: 1,
    }),
  });
  const regSkuData: any = await regSkuRes.json();

  // 7.3 Kiểm tra xác thực SKU mới xuất hiện trong M07 qua GET /api/products
  const checkM07Res = await fetch(`${BASE_URL}/api/products`);
  const allM07Products: any = await checkM07Res.json();
  const newlyCreatedProduct = allM07Products.find((p: any) => p.sku === officialSku);

  assert(
    (regSkuRes.status === 200 || regSkuRes.status === 201) &&
      Boolean(newlyCreatedProduct) &&
      newlyCreatedProduct.sku === officialSku,
    "TEST 7.2",
    "Đăng ký SKU thương mại ủy quyền sang M07 Item Master",
    `SKU mới: [${newlyCreatedProduct?.sku}] - ${newlyCreatedProduct?.name} đã có mặt trong GET /api/products`,
    null,
    newlyCreatedProduct
  );

  // ===========================================================================
  // [TEST 8] Nghiệm thu & Bàn giao sản xuất (Handover Sign-off — M06 ↔ M25)
  // ===========================================================================
  console.log("\n--- [TEST 8] Nghiệm thu & Bàn giao sản xuất (M06 ↔ M25) ---");
  // 8.1 Ký biên bản bàn giao Handover Sign-off
  const signoffRes = await fetch(`${BASE_URL}/api/rd/projects/${projectId}/handover-signoff`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      approver: "Hội đồng Nghiệm thu Liên ban R&D - MES",
      signoffNotes: "Đã thẩm định hoàn tất mẫu thực nghiệm, tiêu chuẩn RoHS và phân tích giá thành.",
    }),
  });
  const signoffData: any = await signoffRes.json();
  assert(
    signoffRes.status === 200 &&
      signoffData.project?.stage === "HANDED_OVER" &&
      signoffData.project?.isLocked === true,
    "TEST 8.1",
    "Ký biên bản nghiệm thu & Khóa bất biến đề tài (Rule #16)",
    `Stage: ${signoffData.project?.stage}, isLocked: ${signoffData.project?.isLocked}, Ký bởi: ${signoffData.project?.handoverSignoffBy}`,
    null,
    signoffData
  );

  // 8.2 Bàn giao BOM chính thức sang M25 MES
  const bomHandoverRes = await fetch(`${BASE_URL}/api/rd/boms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      projectId,
      productId: newlyCreatedProduct?.id || realProduct.id,
      bomName: "BOM Sản Xuất Hàng Loạt - Bo Mạch Nexus Edge IoT v3",
      formulaVersion: "V2.0",
      components: [
        { productId: realMatId, quantity: 1.5, unit: "Cái", componentName: realProduct.name },
      ],
    }),
  });
  const bomHandoverData: any = await bomHandoverRes.json();

  // 8.3 Kiểm tra xác thực BOM xuất hiện trong GET /api/manufacturing/boms của M25
  const mesBomsRes = await fetch(`${BASE_URL}/api/manufacturing/boms`);
  const mesBoms: any = await mesBomsRes.json();
  const createdBomInMes = mesBoms.find((b: any) => b.code === bomHandoverData.bom?.code);

  assert(
    bomHandoverRes.status === 201 &&
      Boolean(createdBomInMes) &&
      createdBomInMes.status === "APPROVED",
    "TEST 8.2",
    "Chuyển giao BOM kỹ thuật sang Phân hệ MES M25",
    `Mã BOM: ${createdBomInMes?.code}, Tên: ${createdBomInMes?.name}, Trạng thái MES: ${createdBomInMes?.status}`,
    null,
    createdBomInMes
  );

  // ===========================================================================
  // [TEST 9] Kiểm soát bảo mật công thức (RBAC Guard)
  // ===========================================================================
  console.log("\n--- [TEST 9] Kiểm soát bảo mật công thức (RBAC Confidentiality Masking) ---");
  // 9.1 Truy vấn công thức dự án Confidential bằng tài khoản Staff (Không có quyền rd:confidential)
  const staffFormulaRes = await fetch(`${BASE_URL}/api/rd/formulas/${projectId}/versions`, {
    headers: { Authorization: `Bearer ${staffToken}` },
  });
  const staffFormulas: any = await staffFormulaRes.json();
  const staffVer = staffFormulas[0];

  // 9.2 Truy vấn công thức bằng tài khoản SuperAdmin (Có đầy đủ quyền)
  const adminFormulaRes = await fetch(`${BASE_URL}/api/rd/formulas/${projectId}/versions`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const adminFormulas: any = await adminFormulaRes.json();
  const adminVer = adminFormulas[0];

  const isStaffMasked =
    staffVer?.confidentialityMasked === true &&
    staffVer?.components[0]?.qty === null &&
    staffVer?.components[0]?.unit === "***";
  const isAdminUnmasked =
    adminVer?.confidentialityMasked === false &&
    typeof adminVer?.components[0]?.qty === "number" &&
    adminVer?.components[0]?.qty > 0;

  assert(
    isStaffMasked && isAdminUnmasked,
    "TEST 9",
    "RBAC Masking bảo mật bí mật công nghệ R&D",
    `Staff thấy: masked=${staffVer?.confidentialityMasked}, qty=${staffVer?.components[0]?.qty}, unit=${staffVer?.components[0]?.unit} | Admin thấy: qty=${adminVer?.components[0]?.qty}`,
    null,
    { staffSample: staffVer?.components[0], adminSample: adminVer?.components[0] }
  );

  // ===========================================================================
  // [TEST 10] Kiểm tra hồi quy & vết kiểm toán (Regression & Audit Trail)
  // ===========================================================================
  console.log("\n--- [TEST 10] Kiểm tra vết kiểm toán & Hồ sơ lưu trữ DMS ---");
  // 10.1 Kiểm tra M02 Audit Logs
  const auditRes = await fetch(`${BASE_URL}/api/audit-trail`);
  const auditData: any = await auditRes.json();
  const auditItems: any[] = auditData.items || [];

  const actionsFound = {
    CREATE_PROJECT: auditItems.some((a) => a.action === "CREATE_PROJECT" && String(a.entityId) === String(projectId)),
    MATERIAL_REQUISITION: auditItems.some((a) => a.action === "MATERIAL_REQUISITION"),
    EVALUATE_SAMPLE: auditItems.some((a) => a.action === "EVALUATE_SAMPLE"),
    ECO_COMPLIANCE_CHECK: auditItems.some((a) => a.action === "ECO_COMPLIANCE_CHECK"),
    REGISTER_OFFICIAL_SKU: auditItems.some((a) => a.action === "REGISTER_OFFICIAL_SKU"),
    HANDOVER_SIGNOFF: auditItems.some((a) => a.action === "HANDOVER_SIGNOFF" && String(a.entityId) === String(projectId)),
    HANDOVER_BOM_TO_M25: auditItems.some((a) => a.action === "HANDOVER_BOM_TO_M25"),
  };

  const allAuditsPresent = Object.values(actionsFound).every(Boolean);
  assert(
    allAuditsPresent,
    "TEST 10.1",
    "M02 Audit Trail ghi nhận đầy đủ 100% chuỗi nghiệp vụ",
    `Actions log tìm thấy: ${JSON.stringify(actionsFound)}`,
    null,
    actionsFound
  );

  // 10.2 Kiểm tra M29 DMS Documents
  const dmsRes = await fetch(`${BASE_URL}/api/dms/documents`);
  const dmsDocs: any = await dmsRes.json();
  const handoverDossier = dmsDocs.find((d: any) => d.category === "RD_HANDOVER_DOSSIER" && d.refDocNo === createdProj.projectCode);

  assert(
    Boolean(handoverDossier) &&
      handoverDossier.status === "SIGNED" &&
      Boolean(handoverDossier.sha256Hash),
    "TEST 10.2",
    "M29 DMS lưu trữ và niêm phong hồ sơ nghiệm thu kỹ thuật số",
    `Mã tài liệu: ${handoverDossier?.docCode}, Hash SHA256: ${handoverDossier?.sha256Hash?.slice(0, 16)}..., Ký bởi: ${handoverDossier?.signedBy}`,
    null,
    handoverDossier
  );

  // ===========================================================================
  // TỔNG KẾT
  // ===========================================================================
  console.log("\n================================================================================");
  console.log("KẾT QUẢ KIỂM THỬ TỔNG HỢP M06 INNOVATION R&D & FORMULATION");
  console.log("================================================================================");
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`TỔNG SỐ KỊCH BẢN: ${total} | ĐẠT: ${passed} | THẤT BẠI: ${failed}`);
  if (failed === 0) {
    console.log(">>> XÁC NHẬN: 100% KỊCH BẢN KIỂM THỬ ĐỀU ĐẠT CHUẨN KIẾN TRÚC & NGHIỆP VỤ!");
  } else {
    console.error(">>> CẢNH BÁO: CÓ KỊCH BẢN KHÔNG ĐẠT YÊU CẦU!");
    process.exit(1);
  }
}

runQaSuite().catch((err) => {
  console.error("Lỗi thực thi test suite:", err);
  process.exit(1);
});
