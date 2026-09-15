/**
 * NEXUSSYNC ERP - WORKSPACE MODULE PARITY & ORPHAN AUDIT SCRIPT
 *
 * Compares DEDICATED_WORKSPACE_MODULE_IDS and JSX workspace renderers in src/App.tsx
 * against MODULE_REGISTRY in config/moduleRegistry.ts to ensure 100% parity
 * and flag any orphan or unmapped modules.
 *
 * Usage:
 *   npx tsx scripts/verify-workspace-modules.ts
 */

import fs from 'fs';
import path from 'path';
import { MODULE_REGISTRY } from '../config/moduleRegistry';

const rootDir = process.cwd();
const appTsxPath = path.join(rootDir, 'src', 'App.tsx');

interface AuditResult {
  passed: boolean;
  totalRegistryModules: number;
  totalDedicatedIds: number;
  totalJsxBranches: number;
  totalLazyImports: number;
  missingFromDedicated: string[];
  missingFromJsx: string[];
  orphanDedicatedIds: string[];
  orphanJsxBranches: string[];
  unusedLazyImports: string[];
  hasFallbackWorkspace: boolean;
}

export function runModuleParityAudit(): AuditResult {
  if (!fs.existsSync(appTsxPath)) {
    throw new Error(`File not found: ${appTsxPath}`);
  }

  const appCode = fs.readFileSync(appTsxPath, 'utf8');

  // 1. Extract DEDICATED_WORKSPACE_MODULE_IDS
  const dedicatedMatch = appCode.match(
    /const DEDICATED_WORKSPACE_MODULE_IDS = new Set\(\[([\s\S]*?)\]\);/
  );
  if (!dedicatedMatch) {
    throw new Error('Could not find DEDICATED_WORKSPACE_MODULE_IDS in src/App.tsx');
  }

  const dedicatedIds = dedicatedMatch[1]
    .split(',')
    .map((s) => s.trim().replace(/['"]/g, ''))
    .filter(Boolean);

  // 2. Extract active lazy-loaded imports in App.tsx
  const lazyImports: { name: string; path: string }[] = [];
  const lazyRegex = /const\s+(\w+)\s*=\s*lazy\(\(\)\s*=>\s*import\(['"]([^'"]+)['"]\)/g;
  let match: RegExpExecArray | null;
  while ((match = lazyRegex.exec(appCode)) !== null) {
    lazyImports.push({ name: match[1], path: match[2] });
  }

  // 3. Extract JSX branches in App.tsx ({currentModule.moduleId === 'MXX' && (<Component .../>)})
  const jsxBranches: { moduleId: string; component: string }[] = [];
  const jsxRegex =
    /currentModule\.moduleId\s*===\s*['"]([^'"]+)['"]\s*&&\s*\(\s*<(\w+)/g;
  while ((match = jsxRegex.exec(appCode)) !== null) {
    jsxBranches.push({ moduleId: match[1], component: match[2] });
  }

  // 4. Verify fallback loader presence
  const hasFallbackWorkspace =
    /!DEDICATED_WORKSPACE_MODULE_IDS\.has\(currentModule\.moduleId\)\s*&&\s*\(\s*<GenericModuleWorkspace/.test(
      appCode
    );

  // 5. Compare against MODULE_REGISTRY
  const registryIds = MODULE_REGISTRY.map((m) => m.moduleId);
  const dedicatedSet = new Set(dedicatedIds);
  const jsxModuleMap = new Map(jsxBranches.map((b) => [b.moduleId, b.component]));

  // Check for modules in registry missing from DEDICATED_WORKSPACE_MODULE_IDS
  const missingFromDedicated = registryIds.filter((id) => !dedicatedSet.has(id));

  // Check for modules in registry missing from JSX renderer
  const missingFromJsx = registryIds.filter((id) => !jsxModuleMap.has(id));

  // Check for orphan IDs in DEDICATED_WORKSPACE_MODULE_IDS not in MODULE_REGISTRY
  const orphanDedicatedIds = dedicatedIds.filter((id) => !registryIds.includes(id));

  // Check for orphan JSX branches not in MODULE_REGISTRY
  const orphanJsxBranches = jsxBranches
    .filter((b) => !registryIds.includes(b.moduleId))
    .map((b) => `${b.moduleId} (<${b.component} />)`);

  // Check for unused lazy imports
  const renderedComponents = new Set(jsxBranches.map((b) => b.component));
  renderedComponents.add('GenericModuleWorkspace'); // Standard fallback
  const unusedLazyImports = lazyImports
    .filter((imp) => !renderedComponents.has(imp.name))
    .map((imp) => `${imp.name} (${imp.path})`);

  const passed =
    missingFromDedicated.length === 0 &&
    missingFromJsx.length === 0 &&
    orphanDedicatedIds.length === 0 &&
    orphanJsxBranches.length === 0 &&
    unusedLazyImports.length === 0 &&
    hasFallbackWorkspace;

  return {
    passed,
    totalRegistryModules: registryIds.length,
    totalDedicatedIds: dedicatedIds.length,
    totalJsxBranches: jsxBranches.length,
    totalLazyImports: lazyImports.length,
    missingFromDedicated,
    missingFromJsx,
    orphanDedicatedIds,
    orphanJsxBranches,
    unusedLazyImports,
    hasFallbackWorkspace,
  };
}

function printAuditReport() {
  console.log('='.repeat(82));
  console.log(' NEXUSSYNC ERP - WORKSPACE MODULE PARITY & ORPHAN AUDIT REPORT');
  console.log('='.repeat(82));
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Target:    src/App.tsx <---> config/moduleRegistry.ts\n`);

  try {
    const result = runModuleParityAudit();

    console.log('--- METRIC COUNTS ---');
    console.log(`• MODULE_REGISTRY Modules:          ${result.totalRegistryModules}`);
    console.log(`• DEDICATED_WORKSPACE_MODULE_IDS:   ${result.totalDedicatedIds}`);
    console.log(`• JSX Workspace Render Branches:    ${result.totalJsxBranches}`);
    console.log(`• Lazy-Loaded Workspace Imports:    ${result.totalLazyImports}`);
    console.log(
      `• Generic Fallback Loader Present:  ${result.hasFallbackWorkspace ? 'YES (Active)' : 'NO (Missing!)'}\n`
    );

    console.log('--- PARITY VERIFICATION CHECKS ---');

    // 1. Missing from DEDICATED_WORKSPACE_MODULE_IDS
    if (result.missingFromDedicated.length === 0) {
      console.log('✓ [PASS] All registry modules are registered in DEDICATED_WORKSPACE_MODULE_IDS.');
    } else {
      console.error(
        `✗ [FAIL] Found ${result.missingFromDedicated.length} registry modules missing from DEDICATED_WORKSPACE_MODULE_IDS:`
      );
      result.missingFromDedicated.forEach((id) => console.error(`    - ${id}`));
    }

    // 2. Missing from JSX render branches
    if (result.missingFromJsx.length === 0) {
      console.log('✓ [PASS] All registry modules have an active JSX render branch in workspace loader.');
    } else {
      console.error(
        `✗ [FAIL] Found ${result.missingFromJsx.length} registry modules missing from JSX workspace loader:`
      );
      result.missingFromJsx.forEach((id) => console.error(`    - ${id}`));
    }

    // 3. Orphan dedicated IDs
    if (result.orphanDedicatedIds.length === 0) {
      console.log('✓ [PASS] No orphan module IDs in DEDICATED_WORKSPACE_MODULE_IDS.');
    } else {
      console.error(
        `✗ [FAIL] Found ${result.orphanDedicatedIds.length} orphan IDs in DEDICATED_WORKSPACE_MODULE_IDS (not in registry):`
      );
      result.orphanDedicatedIds.forEach((id) => console.error(`    - ${id}`));
    }

    // 4. Orphan JSX branches
    if (result.orphanJsxBranches.length === 0) {
      console.log('✓ [PASS] No orphan JSX workspace branches in App.tsx.');
    } else {
      console.error(
        `✗ [FAIL] Found ${result.orphanJsxBranches.length} orphan JSX branches:`
      );
      result.orphanJsxBranches.forEach((b) => console.error(`    - ${b}`));
    }

    // 5. Unused lazy imports
    if (result.unusedLazyImports.length === 0) {
      console.log('✓ [PASS] No unused lazy workspace imports detected.');
    } else {
      console.error(
        `✗ [FAIL] Found ${result.unusedLazyImports.length} unused lazy workspace imports in src/App.tsx:`
      );
      result.unusedLazyImports.forEach((imp) => console.error(`    - ${imp}`));
    }

    // 6. Fallback loader check
    if (result.hasFallbackWorkspace) {
      console.log('✓ [PASS] Defensive GenericModuleWorkspace fallback is active.');
    } else {
      console.error('✗ [FAIL] Defensive GenericModuleWorkspace fallback is missing!');
    }

    console.log('\n' + '='.repeat(82));
    if (result.passed) {
      console.log(' RESULT: 100% PARITY ACHIEVED — ZERO ORPHAN MODULES IN UI WORKSPACE LOADER');
      console.log('='.repeat(82));
      process.exit(0);
    } else {
      console.error(' RESULT: AUDIT FAILED — ORPHAN OR UNMAPPED MODULES DETECTED');
      console.error('='.repeat(82));
      process.exit(1);
    }
  } catch (err: any) {
    console.error(`\n[ERROR] Audit script encountered an unhandled exception: ${err.message}`);
    process.exit(1);
  }
}

// Run audit when invoked directly
printAuditReport();
