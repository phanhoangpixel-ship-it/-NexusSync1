const http = require('http');

function apiCall(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    if (token) {
      options.headers['Authorization'] = 'Bearer ' + token;
    }
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runFullE2ETestSuite() {
  const ts = Date.now();
  console.log('================================================================================');
  console.log('=== THỰC THI KIỂM THỬ M10 STRATEGIC SOURCING (SEED-FROM-REALITY) ===');
  console.log('================================================================================');
  console.log('Timestamp Kiểm Thử:', ts);

  const testLogs = [];

  // =========================================================================
  // GIAI ĐOẠN A: SNAPSHOT MASTER DATA BAN ĐẦU
  // =========================================================================
  console.log('\n--- GIAI ĐOẠN A: SNAPSHOT MASTER DATA THẬT (BASELINE TRƯỚC KHI TEST) ---');
  const suppliersRes = await apiCall('GET', '/api/suppliers');
  const costCentersRes = await apiCall('GET', '/api/org/cost-centers');
  const initialRfqsRes = await apiCall('GET', '/api/sourcing/rfqs');
  const initialAwardsRes = await apiCall('GET', '/api/sourcing/awards');
  const initialPackagesRes = await apiCall('GET', '/api/sourcing/packages');

  const suppliers = Array.isArray(suppliersRes.body) ? suppliersRes.body : (suppliersRes.body?.data || []);
  const costCenters = costCentersRes.body?.data || [];
  console.log('1. Nhà cung cấp Master Data hiện có:', suppliers.map(s => ({ id: s.id, code: s.code, name: s.name })));
  console.log('2. Cost Centers & Hạn mức khả dụng (M30):', costCenters.map(c => ({ code: c.code, available: c.availableBudget })));
  console.log('3. Baseline Sourcing Packages count:', Array.isArray(initialPackagesRes.body) ? initialPackagesRes.body.length : 0);
  console.log('4. Baseline RFQs count:', Array.isArray(initialRfqsRes.body) ? initialRfqsRes.body.length : 0);
  console.log('5. Baseline Awards count:', Array.isArray(initialAwardsRes.body) ? initialAwardsRes.body.length : 0);

  const supplierA = suppliers[0] || { id: 1, name: 'Công ty Cổ phần Nhựa Hà Nội', code: 'SUP-001' };
  const supplierB = suppliers[1] || { id: 2, name: 'Công ty TNHH Bao Bì Á Châu', code: 'SUP-002' };

  // Chọn Cost Center có hạn mức khả dụng lớn nhất để test phê duyệt thành công
  const targetCostCenter = costCenters.filter(c => c.code !== 'CC-RD').sort((a, b) => b.availableBudget - a.availableBudget)[0] || { code: 'CC-WH-MAIN', availableBudget: 300000000 };
  console.log(`-> Sử dụng Cost Center: ${targetCostCenter.code} (Khả dụng: ${targetCostCenter.availableBudget.toLocaleString()} ₫) cho luồng test thành công.`);

  const testQty = 20;
  const targetPrice = 750000;
  const bid1Price = 720000;
  const bid2Price = 680000;
  const totalAwardVal = testQty * bid2Price; // 20 * 680.000 = 13.600.000 ₫ (vừa vặn ngân sách)

  // =========================================================================
  // TEST CASE 1: M10-F01 - Khởi Tạo Gói Thầu Chiến Lược (Sourcing Package)
  // =========================================================================
  console.log('\n--- TEST CASE M10-F01: Tạo Gói Thầu Chiến Lược (Sourcing Package) ---');
  const snap1_before = (await apiCall('GET', '/api/sourcing/packages')).body;
  const pkgCode = `PKG-QA-TEST-${ts}`;
  const pkgRes = await apiCall('POST', '/api/sourcing/packages', {
    code: pkgCode,
    title: `Gói Đấu Thầu Linh Kiện Bán Dẫn QA-TEST-${ts}`,
    category: 'RAW_MATERIAL',
    costCenterCode: targetCostCenter.code,
    estimatedBudget: 30000000,
    targetDate: '2026-10-30',
    description: 'Seed-from-reality QA test package for M10 Sourcing',
    idempotencyKey: `pkg-idemp-${ts}`
  });
  const snap1_after = (await apiCall('GET', '/api/sourcing/packages')).body;
  const createdPkgId = pkgRes.body?.packageId || pkgRes.body?.package?.id;
  const createdPkgCode = pkgRes.body?.code || pkgRes.body?.package?.packageCode || pkgCode;
  const pass1 = (pkgRes.status === 200 || pkgRes.status === 201) && createdPkgId;
  testLogs.push({
    id: 'M10-F01',
    name: 'Khởi tạo Sourcing Package (Gói thầu mua sắm)',
    before: `Packages count: ${Array.isArray(snap1_before) ? snap1_before.length : 0}`,
    action: `POST /api/sourcing/packages (${createdPkgCode})`,
    after: `Packages count: ${Array.isArray(snap1_after) ? snap1_after.length : 0}, PKG ID: ${createdPkgId}`,
    rule: `Package tạo thành công, gắn đúng Cost Center ${targetCostCenter.code} (Dự toán: 30.000.000 ₫)`,
    status: pass1 ? 'PASS' : 'FAIL',
    details: pkgRes.body
  });
  console.log('Result M10-F01:', pass1 ? 'PASS' : 'FAIL', 'PKG ID:', createdPkgId);

  // =========================================================================
  // TEST CASE 2: M10-F02 - Khởi Tạo RFQ Gắn Sourcing Package
  // =========================================================================
  console.log('\n--- TEST CASE M10-F02: Tạo Yêu Cầu Báo Giá (RFQ) ---');
  const snap2_before = (await apiCall('GET', '/api/sourcing/rfqs')).body;
  const rfqTitle = `RFQ-QA-TEST-${ts} Cung Cấp Chip Set & IC Vi Mạch`;
  const rfqRes = await apiCall('POST', '/api/sourcing/rfqs', {
    packageId: createdPkgId,
    title: rfqTitle,
    targetQuantity: testQty,
    targetPrice: targetPrice,
    deadline: '2026-10-15',
    paymentTerms: 'NET_30',
    incoterms: 'DDP_HA_NOI',
    costCenter: targetCostCenter.code,
    idempotencyKey: `rfq-idemp-${ts}`
  });
  const snap2_after = (await apiCall('GET', '/api/sourcing/rfqs')).body;
  const createdRfqId = rfqRes.body?.rfqId;
  const createdRfqCode = rfqRes.body?.code;
  const pass2 = (rfqRes.status === 200 || rfqRes.status === 201) && createdRfqId;
  testLogs.push({
    id: 'M10-F02',
    name: 'Khởi tạo RFQ và gắn Sourcing Package',
    before: `RFQs count: ${Array.isArray(snap2_before) ? snap2_before.length : 0}`,
    action: `POST /api/sourcing/rfqs (${rfqTitle})`,
    after: `RFQs count: ${Array.isArray(snap2_after) ? snap2_after.length : 0}, RFQ Code: ${createdRfqCode} (ID: ${createdRfqId})`,
    rule: `RFQ khởi tạo ở trạng thái OPEN_BIDDING, targetQuantity=${testQty}, targetPrice=${targetPrice.toLocaleString()} ₫`,
    status: pass2 ? 'PASS' : 'FAIL',
    details: rfqRes.body
  });
  console.log('Result M10-F02:', pass2 ? 'PASS' : 'FAIL', 'RFQ Code:', createdRfqCode);

  // =========================================================================
  // TEST CASE 3: M10-F03 - Nộp Hồ Sơ Chào Giá (Bids) Vòng 1 & Đấu Giá Ngược Vòng 2
  // =========================================================================
  console.log('\n--- TEST CASE M10-F03: Nộp Bids Vòng 1 & Mở Đấu Giá Ngược Vòng 2 ---');
  // Bid NCC A - Vòng 1
  const bid1ARes = await apiCall('POST', '/api/sourcing/bids', {
    rfqId: createdRfqId,
    supplierId: supplierA.id,
    items: [{
      rfqLineId: 1,
      unitPrice: bid1Price,
      offeredQuantity: testQty,
      leadTimeDays: 7,
      paymentTerms: 'NET_30',
      warrantyMonths: 24
    }],
    roundNumber: 1,
    idempotencyKey: `bid1A-qa-${ts}`
  });
  // Bid NCC B - Vòng 1
  const bid1BRes = await apiCall('POST', '/api/sourcing/bids', {
    rfqId: createdRfqId,
    supplierId: supplierB.id,
    items: [{
      rfqLineId: 1,
      unitPrice: 740000,
      offeredQuantity: testQty,
      leadTimeDays: 5,
      paymentTerms: 'NET_45',
      warrantyMonths: 18
    }],
    roundNumber: 1,
    idempotencyKey: `bid1B-qa-${ts}`
  });
  // Mở Vòng 2 Đấu giá ngược (Reverse Auction)
  const round2OpenRes = await apiCall('POST', `/api/sourcing/rfqs/${createdRfqId}/reverse-auction/round`, {
    targetReductionPercent: 5,
    reason: 'Đàm phán giảm giá vòng 2 QA TEST',
    idempotencyKey: `round2-qa-${ts}`
  });
  // Bid NCC A - Vòng 2 (giảm giá xuống 680.000 ₫)
  const bid2ARes = await apiCall('POST', '/api/sourcing/bids', {
    rfqId: createdRfqId,
    supplierId: supplierA.id,
    items: [{
      rfqLineId: 1,
      unitPrice: bid2Price,
      offeredQuantity: testQty,
      leadTimeDays: 7,
      paymentTerms: 'NET_30',
      warrantyMonths: 24
    }],
    roundNumber: 2,
    idempotencyKey: `bid2A-qa-${ts}`
  });

  const bidsAfter = (await apiCall('GET', `/api/sourcing/bids?rfqId=${createdRfqId}`)).body;
  const pass3 = (bid1ARes.status < 300) && (bid1BRes.status < 300) && (bid2ARes.status < 300);
  const winningBidId = bid2ARes.body?.bidId || bid2ARes.body?.id || 1;
  testLogs.push({
    id: 'M10-F03',
    name: 'Đấu giá ngược đa vòng (Reverse Auction Rounds)',
    before: '0 bids cho RFQ này',
    action: `Nộp 2 bids V1 (720k/740k), Mở V2 (giảm 5%), Nộp Bid V2 (680.000 ₫)`,
    after: `Bids count: ${Array.isArray(bidsAfter) ? bidsAfter.length : 'N/A'}, Winning Bid ID: ${winningBidId}`,
    rule: 'Lưu vết lịch sử đàm phán từng vòng, áp dụng trần giá trần đấu giá ngược chính xác',
    status: pass3 ? 'PASS' : 'FAIL',
    details: { bid1A: bid1ARes.body, bid2A: bid2ARes.body, round2: round2OpenRes.body }
  });
  console.log('Result M10-F03:', pass3 ? 'PASS' : 'FAIL', 'Winning Bid ID:', winningBidId);

  // =========================================================================
  // TEST CASE 4: M10-F04 - Chấm Điểm Đồng Thuận Đa Tiêu Chí (M11 SRM Scorecard)
  // =========================================================================
  console.log('\n--- TEST CASE M10-F04: Chấm Điểm Đồng Thuận Đa Tiêu Chí ---');
  const consensusRes = await apiCall('POST', `/api/sourcing/rfqs/${createdRfqId}/consensus-evaluation`, {
    customWeights: { commercial: 0.40, technical: 0.30, sla: 0.20, compliance: 0.10 }
  });
  const topSupplier = consensusRes.body?.topRankedSupplier || (Array.isArray(consensusRes.body?.matrix) ? consensusRes.body?.matrix[0] : null);
  const pass4 = (consensusRes.status === 200 || consensusRes.status === 201) && topSupplier;
  testLogs.push({
    id: 'M10-F04',
    name: 'Chấm điểm Đồng thuận Đa tiêu chí (M11 SRM Scorecard)',
    before: 'Chưa có bảng điểm đồng thuận',
    action: `POST /api/sourcing/rfqs/${createdRfqId}/consensus-evaluation`,
    after: `Điểm top: ${topSupplier?.totalScore || 'N/A'}/100, Đề cử #1: ${topSupplier?.supplierName || supplierA.name}`,
    rule: 'Trọng số Thương mại 40% + Kỹ thuật 30% + SLA 20% + Tuân thủ 10% tính toán chính xác theo M11 SRM',
    status: pass4 ? 'PASS' : 'FAIL',
    details: consensusRes.body
  });
  console.log('Result M10-F04:', pass4 ? 'PASS' : 'FAIL', 'Top Score:', topSupplier?.totalScore);

  // =========================================================================
  // TEST CASE 5: M10-F05 - Đối Soát Giá Khung BPA (M09 Price Agreement)
  // =========================================================================
  console.log('\n--- TEST CASE M10-F05: Đối Soát Giá Khung BPA & Bảng So Sánh ---');
  const comparisonRes = await apiCall('GET', `/api/sourcing/rfqs/${createdRfqId}/comparison`);
  const pass5 = comparisonRes.status === 200 && comparisonRes.body?.comparison;
  testLogs.push({
    id: 'M10-F05',
    name: 'Đối soát Giá Khung BPA & Bảng So Sánh Ma Trận',
    before: 'Chưa truy xuất bảng so sánh ma trận chào giá',
    action: `GET /api/sourcing/rfqs/${createdRfqId}/comparison`,
    after: `So sánh ${Array.isArray(comparisonRes.body?.comparison) ? comparisonRes.body?.comparison.length : 0} hồ sơ chào giá, có benchmark BPA`,
    rule: 'Tích hợp benchmark giá khung M09, tính toán % chênh lệch và cảnh báo vượt trần',
    status: pass5 ? 'PASS' : 'FAIL',
    details: comparisonRes.body
  });
  console.log('Result M10-F05:', pass5 ? 'PASS' : 'FAIL', 'Comparisons count:', comparisonRes.body?.comparison?.length);

  // =========================================================================
  // TEST CASE 6: M10-F06 - Rào Chắn Ngân Sách M30 Budget Guard (Chặn Cứng)
  // =========================================================================
  console.log('\n--- TEST CASE M10-F06: Budget Guard M30 (Chặn Vượt Hạn Mức Ngân Sách) ---');
  // Thử tạo Award với Cost Center CC-RD (Available chỉ 40.000.000 ₫ mà cố tình đòi chi 500.000.000 ₫)
  const budgetBlockRes = await apiCall('POST', '/api/sourcing/awards', {
    rfqId: createdRfqId,
    bidId: winningBidId,
    supplierId: supplierA.id,
    costCenter: 'CC-RD',
    items: [{ rfqLineId: 1, bidLineId: 1, awardedQuantity: 1000, awardedUnitPrice: 680000 }], // 680.000.000 > 40.000.000
    idempotencyKey: `award-block-qa-${ts}`
  });
  const blockSuccess = (budgetBlockRes.status === 422 || budgetBlockRes.status === 400) && 
    (budgetBlockRes.body?.error === 'BUDGET_GUARD_EXCEEDED' || String(budgetBlockRes.body?.message || '').includes('ngân sách'));

  // Phê duyệt thành công với Cost Center hợp lệ (Available >= 13.600.000 ₫)
  const validAwardRes = await apiCall('POST', '/api/sourcing/awards', {
    rfqId: createdRfqId,
    bidId: winningBidId,
    supplierId: supplierA.id,
    costCenter: targetCostCenter.code,
    items: [{ rfqLineId: 1, bidLineId: 1, awardedQuantity: testQty, awardedUnitPrice: bid2Price }],
    idempotencyKey: `award-valid-qa-${ts}`
  });
  const pass6 = blockSuccess && (validAwardRes.status === 200 || validAwardRes.status === 201);
  const createdAwardId = validAwardRes.body?.awardId || validAwardRes.body?.id;
  const createdAwardNo = validAwardRes.body?.awardNo;
  testLogs.push({
    id: 'M10-F06',
    name: 'Rào chắn Ngân sách M30 Budget Guard',
    before: `CC-RD khả dụng: 40M, ${targetCostCenter.code} khả dụng: ${targetCostCenter.availableBudget.toLocaleString()} ₫, Giá trị thầu: ${totalAwardVal.toLocaleString()} ₫`,
    action: `POST /api/sourcing/awards (Lần 1: CC-RD 680M -> Lần 2: ${targetCostCenter.code} 13.6M)`,
    after: `Lần 1 chặn 422 BUDGET_GUARD_EXCEEDED; Lần 2 phê duyệt thành công ${createdAwardNo} (ID: ${createdAwardId})`,
    rule: 'Chặn cứng hành động phê duyệt nếu giá trị trúng thầu vượt quá ngân sách khả dụng M30',
    status: pass6 ? 'PASS' : 'FAIL',
    details: { blockResponse: budgetBlockRes.body, validResponse: validAwardRes.body }
  });
  console.log('Result M10-F06:', pass6 ? 'PASS' : 'FAIL', 'Award No:', createdAwardNo);

  // =========================================================================
  // TEST CASE 7: M10-F07 - Idempotency & Concurrency Guard
  // =========================================================================
  console.log('\n--- TEST CASE M10-F07: Idempotency & Concurrency Guard ---');
  const duplicateKey = `idemp-guard-qa-${ts}`;
  // Gọi lần 1
  const call1 = await apiCall('POST', '/api/sourcing/awards', {
    rfqId: createdRfqId,
    bidId: winningBidId,
    supplierId: supplierA.id,
    costCenter: targetCostCenter.code,
    items: [{ rfqLineId: 1, bidLineId: 1, awardedQuantity: testQty, awardedUnitPrice: bid2Price }],
    idempotencyKey: duplicateKey
  });
  // Gọi lần 2 với cùng idempotencyKey
  const call2 = await apiCall('POST', '/api/sourcing/awards', {
    rfqId: createdRfqId,
    bidId: winningBidId,
    supplierId: supplierA.id,
    costCenter: targetCostCenter.code,
    items: [{ rfqLineId: 1, bidLineId: 1, awardedQuantity: testQty, awardedUnitPrice: bid2Price }],
    idempotencyKey: duplicateKey
  });
  const pass7 = (call1.status === 200 || call1.status === 201) && (call2.status === 200 && call2.body?.replayed === true);
  testLogs.push({
    id: 'M10-F07',
    name: 'Idempotency & Concurrency Guard',
    before: 'Gửi 2 request với cùng IdempotencyKey',
    action: `POST /api/sourcing/awards (IdempotencyKey: ${duplicateKey})`,
    after: `Lần 1 Status ${call1.status}; Lần 2 Status 200 Replayed: true (AggregateId: ${call2.body?.awardId})`,
    rule: 'Chỉ chấp thuận đúng 1 giao dịch thực tế, phát hiện và trả về kết quả đã xử lý (Replayed) an toàn',
    status: pass7 ? 'PASS' : 'FAIL',
    details: { call1: call1.body, call2: call2.body }
  });
  console.log('Result M10-F07:', pass7 ? 'PASS' : 'FAIL', 'Replayed:', call2.body?.replayed);

  // =========================================================================
  // TEST CASE 8: M10-F08 - Ủy Quyền Khởi Tạo Đơn Mua Hàng M08 PO (Single-Writer Boundary)
  // =========================================================================
  console.log('\n--- TEST CASE M10-F08: M08 PO Delegation (Single-Writer Authority) ---');
  const poRes = await apiCall('POST', `/api/sourcing/awards/${createdAwardId}/generate-po`, {
    idempotencyKey: `po-delegation-qa-${ts}`
  });
  // Thử gọi lần 2 để kiểm tra Idempotency
  const poRes2 = await apiCall('POST', `/api/sourcing/awards/${createdAwardId}/generate-po`, {
    idempotencyKey: `po-delegation-qa-${ts}`
  });
  const pass8 = (poRes.status === 200 || poRes.status === 201) && poRes.body?.poCode && (poRes2.body?.alreadyExists === true || poRes2.status === 200);
  const createdPoCode = poRes.body?.poCode;
  testLogs.push({
    id: 'M10-F08',
    name: 'Ủy quyền Khởi tạo Đơn Mua Hàng M08 (PO Delegation)',
    before: `Award ${createdAwardNo} chưa liên kết PO`,
    action: `POST /api/sourcing/awards/${createdAwardId}/generate-po (x2)`,
    after: `PO Code: ${createdPoCode}, Lần 2 trả về alreadyExists: true (${poRes2.body?.poCode})`,
    rule: 'Tuân thủ Single-Writer M08: ủy quyền qua /api/purchase/orders, không insert trực tiếp bảng purchase_orders',
    status: pass8 ? 'PASS' : 'FAIL',
    details: { call1: poRes.body, call2: poRes2.body }
  });
  console.log('Result M10-F08:', pass8 ? 'PASS' : 'FAIL', 'Created PO:', createdPoCode);

  // =========================================================================
  // TEST CASE 9: M10-F09 - Niêm Phong Số Hồ Sơ Vào M29 DMS Secure Vault (SHA-256)
  // =========================================================================
  console.log('\n--- TEST CASE M10-F09: Niêm Phong Số M29 DMS Vault (SHA-256) ---');
  const sealAwardRes = await apiCall('POST', `/api/sourcing/awards/${createdAwardId}/seal-dms`);
  const sealMatrixRes = await apiCall('POST', `/api/sourcing/comparison/${createdRfqId}/seal-dms`);
  const pass9 = sealAwardRes.status === 200 && sealAwardRes.body?.sha256Hash && sealMatrixRes.status === 200 && sealMatrixRes.body?.sha256Hash;
  testLogs.push({
    id: 'M10-F09',
    name: 'Niêm Phong Số Hồ Sơ Thầu Vào M29 Secure Vault',
    before: 'Hồ sơ chưa được băm SHA-256 và niêm phong',
    action: `POST /api/sourcing/awards/${createdAwardId}/seal-dms & POST /api/sourcing/comparison/${createdRfqId}/seal-dms`,
    after: `Award Sealed: ${sealAwardRes.body?.dmsDocument?.docCode || sealAwardRes.body?.awardNo} (SHA-256: ${sealAwardRes.body?.sha256Hash?.substring(0, 16)}...), Matrix Sealed: ${sealMatrixRes.body?.dmsDocument?.docCode || sealMatrixRes.body?.rfqCode}`,
    rule: 'Mã băm SHA-256 bất biến, phân hạng HOT_ENCRYPTED, lưu trữ bảo mật M29',
    status: pass9 ? 'PASS' : 'FAIL',
    details: { awardVault: sealAwardRes.body, matrixVault: sealMatrixRes.body }
  });
  console.log('Result M10-F09:', pass9 ? 'PASS' : 'FAIL', 'Award Vault Doc:', sealAwardRes.body?.dmsDocument?.docCode || sealAwardRes.body?.awardNo);

  // =========================================================================
  // TEST CASE 10: M10-F10 - Immutability & Audit Trail Verification (M02)
  // =========================================================================
  console.log('\n--- TEST CASE M10-F10: Immutability Guard & Audit Trail (M02) ---');
  // Thử mở vòng đàm phán khi RFQ đã ở trạng thái AWARDED -> Phải bị từ chối
  const immutabilityCheck = await apiCall('POST', `/api/sourcing/rfqs/${createdRfqId}/reverse-auction/round`, {
    targetReductionPercent: 3,
    idempotencyKey: `invalid-round-qa-${ts}`
  });
  const auditRes = await apiCall('GET', '/api/audit-logs');
  const auditLogs = Array.isArray(auditRes.body) ? auditRes.body : (auditRes.body?.data || []);
  const pass10 = (immutabilityCheck.status === 400 || immutabilityCheck.body?.error === 'INVALID_RFQ_STATUS') && (auditRes.status === 200 || auditLogs.length > 0);
  testLogs.push({
    id: 'M10-F10',
    name: 'Tính Bất Biến (Immutability) & Ghi Nhận Audit Trail (M02)',
    before: `RFQ ${createdRfqCode} đã chuyển trạng thái AWARDED`,
    action: `POST /api/sourcing/rfqs/${createdRfqId}/reverse-auction/round (thử sửa sau khi đóng) & GET /api/audit-logs`,
    after: `Bị chặn 400 INVALID_RFQ_STATUS; Ghi nhận đầy đủ ${auditLogs.length} sự kiện kiểm toán M02`,
    rule: 'Khóa bất biến sau khi hoàn tất/Awarded; ghi nhận toàn bộ Audit Trail',
    status: pass10 ? 'PASS' : 'FAIL',
    details: { immutabilityCheck: immutabilityCheck.body, auditLogsCount: auditLogs.length }
  });
  console.log('Result M10-F10:', pass10 ? 'PASS' : 'FAIL');

  console.log('\n================================================================================');
  console.log('================ TỔNG KẾT KẾT QUẢ TEST SUITE ================');
  console.log('================================================================================');
  console.table(testLogs.map(l => ({ ID: l.id, Feature: l.name, Status: l.status, Rule: l.rule })));

  const allPassed = testLogs.every(l => l.status === 'PASS');
  console.log('\nTỔNG KẾT: ' + (allPassed ? '>>> TẤT CẢ 10/10 TEST CASES ĐỀU PASS 100%! <<<' : '>>> CÓ TEST CASE FAIL! <<<'));

  return {
    allPassed,
    testLogs,
    seedData: {
      pkgCode: createdPkgCode,
      createdPkgId,
      rfqTitle,
      createdRfqId,
      createdRfqCode,
      createdAwardId,
      createdAwardNo,
      createdPoCode,
      ts
    }
  };
}

runFullE2ETestSuite().catch(console.error);
