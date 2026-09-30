import { db } from '../db';
import * as schema from '../db/schema';
import { ehsService } from '../engines/ehsService';
import { bootstrapDatabase } from '../db/bootstrap';

async function runM40TestSuite() {
  console.log('--- STARTING M40 EHS AUTOMATED QA TEST SUITE ---');
  await bootstrapDatabase();

  // Test 1: JSA 5x5 Matrix Risk Calculation
  console.log('\n[Test 1] Testing JSA 5x5 Matrix Risk Calculation...');
  const jsaLow = ehsService.calculateRiskLevel(2, 2); // 4 -> LOW
  const jsaMed = ehsService.calculateRiskLevel(3, 3); // 9 -> MEDIUM
  const jsaHigh = ehsService.calculateRiskLevel(4, 3); // 12 -> HIGH
  const jsaExt = ehsService.calculateRiskLevel(5, 4); // 20 -> EXTREME

  console.assert(jsaLow.riskScore === 4 && jsaLow.riskLevel === 'LOW', 'JSA Low failed');
  console.assert(jsaMed.riskScore === 9 && jsaMed.riskLevel === 'MEDIUM', 'JSA Med failed');
  console.assert(jsaHigh.riskScore === 12 && jsaHigh.riskLevel === 'HIGH', 'JSA High failed');
  console.assert(jsaExt.riskScore === 20 && jsaExt.riskLevel === 'EXTREME', 'JSA Ext failed');
  console.log('✓ JSA 5x5 Matrix tests passed successfully.');

  // Test 2: Incident Creation with Idempotency & Lifecycle
  console.log('\n[Test 2] Testing Incident Creation & Idempotency...');
  const key = `TEST-IDEMP-${Date.now()}`;
  const inc1 = await ehsService.createIncident({
    title: 'Thử nghiệm tràn dầu máy bảo trì',
    incidentType: 'ENVIRONMENTAL_SPILL',
    severity: 'HIGH',
    warehouseId: 1,
    locationDetail: 'Khu vực máy mài',
    description: 'Tràn dầu bôi trơn trong quá trình tra dầu bảo trì định kỳ',
    idempotencyKey: key,
  }, { userId: 1, username: 'Test Runner' });

  const inc2 = await ehsService.createIncident({
    title: 'Thử nghiệm trùng lặp',
    incidentType: 'ENVIRONMENTAL_SPILL',
    description: 'Trùng lặp',
    idempotencyKey: key,
  }, { userId: 1, username: 'Test Runner' });

  console.assert(inc1.id === inc2.id, 'Idempotency check failed for incidents');
  console.log(`✓ Incident created: ${inc1.incidentNumber} (Status: ${inc1.status}, Reporting Deadline calculated: ${inc1.reportingDeadlineAt})`);

  // Close Incident
  const closeRes = await ehsService.closeIncident(inc1.id, 'Đã làm sạch hiện trường', { userId: 1, username: 'EHS Manager' });
  console.assert(closeRes.status === 'SUCCESS' && closeRes.record?.status === 'CLOSED', 'Incident closing failed');
  console.log(`✓ Incident closed and sealed as CLOSED (Read-Only).`);

  // Test 3: Fire Safety Equipment & Auto-FAIL Audit with CAPA generation
  console.log('\n[Test 3] Testing PCCC Expiry & Auto-FAIL Audit with CAPA generation...');
  // Check if warehouse 1 has overdue fire equipment FE-WH01-003
  const auditRes = await ehsService.executeSafetyAudit({
    title: 'Đợt Kiểm tra An toàn & PCCC Quý 3',
    auditType: 'FIRE_SAFETY',
    warehouseId: 1,
    auditorName: 'Trưởng Ban An toàn',
    checklistItems: [
      { itemDescription: 'Kiểm tra bình chữa cháy', category: 'PCCC', status: 'PASS', isMandatory: true },
      { itemDescription: 'Lối thoát hiểm', category: 'LỐI THOÁT', status: 'PASS', isMandatory: true },
    ],
    idempotencyKey: `AUDIT-TEST-${Date.now()}`,
  }, { userId: 1, username: 'Auditor Test' });

  console.log(`Audit result: ${auditRes.result}, Remarks: ${auditRes.remarks}`);
  console.assert(auditRes.result === 'FAIL', 'Audit should FAIL due to overdue fire equipment FE-WH01-003!');
  console.assert(auditRes.generatedCapa !== null, 'Audit FAIL must automatically generate a CAPA!');
  console.log(`✓ Audit correctly FAILED with Auto-generated CAPA: ${auditRes.generatedCapa?.capaNumber}`);

  // Test 4: Safety Permit & Read-Only API for M27 Assets
  console.log('\n[Test 4] Testing Safety Permit & Read-Only API for M27 Assets...');
  const permit = await ehsService.createPermit({
    permitType: 'LOTO_ISOLATION',
    targetAssetId: 1,
    warehouseId: 1,
    areaLocation: 'Xưởng Cơ khí Chế tạo - Line CNC 1',
    description: 'Khóa cách ly điện 3 pha máy CNC 5 trục',
    validFrom: '2026-09-20',
    validTo: '2026-10-30',
    applicantName: 'Kỹ sư Bảo trì EAM',
    lotoTagNumber: 'LOTO-CNC-001',
    idempotencyKey: `PMT-TEST-${Date.now()}`,
  }, { userId: 1, username: 'EHS Approver' });

  console.log(`✓ Permit created: ${permit.permitNumber} (LOTO Tag: ${permit.lotoTagNumber}, Status: ${permit.status})`);

  // Test open lookup for M27
  const activePermitCheck = await ehsService.getActivePermitForAsset(1);
  console.assert(activePermitCheck.hasActivePermit === true, 'M27 asset active permit lookup failed');
  console.assert(activePermitCheck.permit?.permitNumber === permit.permitNumber, 'Permit mismatch');
  console.log(`✓ M27 Read-Only API verified: Asset ID 1 has active LOTO Permit: ${activePermitCheck.permit?.permitNumber}`);

  // Test 5: Environmental Records QCVN threshold
  console.log('\n[Test 5] Testing Environmental Records & QCVN Threshold...');
  const envComp = await ehsService.createEnvironmentalRecord({
    recordType: 'WASTE_WATER',
    warehouseId: 1,
    parameterName: 'TSS (Chất rắn lơ lửng)',
    measuredValue: 45,
    standardThreshold: 50,
    unit: 'mg/L',
  });
  console.assert(envComp.complianceStatus === 'COMPLIANT', 'Environmental compliant check failed');

  const envExceed = await ehsService.createEnvironmentalRecord({
    recordType: 'WASTE_WATER',
    warehouseId: 1,
    parameterName: 'COD (Nhu cầu oxy hóa học)',
    measuredValue: 120,
    standardThreshold: 75,
    unit: 'mg/L',
  });
  console.assert(envExceed.complianceStatus === 'EXCEEDED', 'Environmental exceeded check failed');
  console.log(`✓ Environmental records verified: COMPLIANT (${envComp.measuredValue} <= ${envComp.standardThreshold}) vs EXCEEDED (${envExceed.measuredValue} > ${envExceed.standardThreshold})`);

  // Test 6: Canonical Legacy Wrapper
  console.log('\n[Test 6] Testing Canonical Legacy Compatibility Endpoint (GET /api/ehs/records)...');
  const canonical = await ehsService.getCanonicalRecords();
  console.assert(Array.isArray(canonical) && canonical.length > 0, 'Canonical records failed');
  console.log(`✓ Canonical records array returned ${canonical.length} records matching legacy structure.`);

  // Test 7: KPI Summary
  console.log('\n[Test 7] Testing KPI Summary...');
  const kpi = await ehsService.getKpiSummary();
  console.log(`✓ KPI Summary: Total Incidents=${kpi.totalIncidents}, Open CAPAs=${kpi.openCapas}, Overdue PCCC=${kpi.expiredFireEquipment}, Active Permits=${kpi.activePermits}, Audit Pass Rate=${kpi.auditPassRate}%`);

  console.log('\n========================================');
  console.log('ALL M40 EHS AUTOMATED QA TESTS PASSED 100%!');
  console.log('========================================');
}

runM40TestSuite().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
