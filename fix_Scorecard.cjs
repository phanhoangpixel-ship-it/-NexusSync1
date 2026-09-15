const fs = require('fs');
let fileContent = fs.readFileSync('src/components/workspaces/M09SuppliersSRMWorkspace.tsx', 'utf-8');

const target = `<ScorecardTabPanel
                  supplierId={currentEvalSupplier.id}
                  supplierName={currentEvalSupplier.name}
                  scorecards={currentEvalSupplier.scorecards || []}
                  canManage={canManageM11}
                  onNotify={onNotify}
                />`;

const replacement = `{currentEvalSupplier ? (
                  <ScorecardTabPanel
                    supplierId={currentEvalSupplier.id}
                    supplierName={currentEvalSupplier.name}
                    scorecards={currentEvalSupplier.scorecards || []}
                    canManage={canManageM11}
                    onNotify={onNotify}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <p className="text-sm">Chưa có dữ liệu nhà cung cấp</p>
                  </div>
                )}`;

if (fileContent.includes(target)) {
  fileContent = fileContent.replace(target, replacement);
  fs.writeFileSync('src/components/workspaces/M09SuppliersSRMWorkspace.tsx', fileContent);
  console.log("Successfully replaced ScorecardTabPanel.");
} else {
  console.log("Target string not found. Please check exact string matches.");
}
