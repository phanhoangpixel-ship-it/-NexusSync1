const fs = require('fs');
let content = fs.readFileSync('src/components/workspaces/M09SuppliersSRMWorkspace_temp.tsx', 'utf-8');

// 1. Add ConfirmDialog import
content = content.replace(
  "import { useWorkspaceSessionTab } from '../../hooks/useWorkspaceSessionTab';",
  "import { useWorkspaceSessionTab } from '../../hooks/useWorkspaceSessionTab';\nimport { ConfirmDialog } from '../common/ConfirmDialog';"
);

// 2. Add Archive Button & update table fields
content = content.replace(
  /<td className="py-3 px-3 font-mono text-slate-700">\{s.paymentTerm\}<\/td>\s*<td className="py-3 px-3 font-mono tabular-nums text-right font-semibold text-slate-800">\{s.creditLimit\}<\/td>\s*<td className="py-3 px-3 text-emerald-700 font-bold">\{s.rating\}<\/td>\s*<td className="py-3 px-3 text-right">\s*<button/g,
  `<td className="py-3 px-3 font-mono text-slate-700">{s.paymentTerms}</td>
                        <td className="py-3 px-3 font-mono tabular-nums text-right font-semibold text-slate-800">{s.creditLimit} {s.currency || 'VND'}</td>
                        <td className="py-3 px-3 text-emerald-700 font-bold">{s.performanceTier}</td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => requestArchiveSupplier(s)}
                            disabled={s.status === 'ARCHIVED'}
                            className="mr-2 px-2.5 py-1 text-[11px] font-semibold bg-red-50 hover:bg-red-600 text-red-800 hover:text-white rounded-lg transition-all disabled:opacity-50"
                          >
                            Lưu trữ
                          </button>
                          <button`
);

// 3. Update the modal details
content = content.replace(
  /<span className="font-mono font-bold text-slate-900 text-sm">\{selectedSupplierForModal.paymentTerm\}<\/span>/g,
  `<span className="font-mono font-bold text-slate-900 text-sm">{selectedSupplierForModal.paymentTerms}</span>`
);
content = content.replace(
  /<span className="font-mono font-bold text-slate-900 text-sm">\{selectedSupplierForModal.creditLimit\}<\/span>/g,
  `<span className="font-mono font-bold text-slate-900 text-sm">{selectedSupplierForModal.creditLimit} {selectedSupplierForModal.currency || 'VND'}</span>`
);
content = content.replace(
  /\{selectedSupplierForModal.rating \|\| '4.8 \/ 5.0'\}/g,
  `{selectedSupplierForModal.performanceTier}`
);

// 4. Update CSV export
content = content.replace(
  /\`"\$\{s.id\}","\$\{s.name\}","\$\{s.taxCode\}","\$\{s.paymentTerm\}","\$\{s.creditLimit\}","\$\{s.rating\}","\$\{s.otifRate\}","\$\{s.qualityScore\}","\$\{s.complianceScore\}","\$\{s.status\}"\`/g,
  `\`"\${s.code}","\${s.name}","\${s.taxCode}","\${s.paymentTerms}","\${s.creditLimit}","\${s.performanceTier}","","","","\${s.status}"\``
);

// 5. Render ConfirmDialog at the end before closing div
content = content.replace(
  /    <\/div>\n  \);\n};\n\nexport default M09SuppliersSRMWorkspace;/g,
  `      <ConfirmDialog {...confirmDialog} />\n    </div>\n  );\n};\n\nexport default M09SuppliersSRMWorkspace;`
);

// 6. Update s.id to s.code in table
content = content.replace(
  /<td className="py-3 px-3 font-mono font-bold text-amber-700">\{s.id\}<\/td>/g,
  `<td className="py-3 px-3 font-mono font-bold text-amber-700">{s.code}</td>`
);

fs.writeFileSync('src/components/workspaces/M09SuppliersSRMWorkspace_temp.tsx', content);
