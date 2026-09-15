import * as fs from 'fs';
import * as path from 'path';

const filesToFix = [
  "src/components/common/UnifiedActivityTaskDrawer.tsx",
  "src/modules/hr/m28-hr-payroll/components/HRWorkspace.tsx",
  "src/modules/hr/m28-hr-payroll/components/PayrollCalculationGLModal.tsx"
];

filesToFix.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix gradients
    content = content.replace(/bg-gradient-to-r from-purple-600 to-indigo-600/g, "bg-slate-800");
    content = content.replace(/bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50/g, "bg-slate-50");
    content = content.replace(/bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900/g, "bg-slate-900");
    content = content.replace(/from-purple-600 to-indigo-600/g, "bg-slate-800");
    content = content.replace(/from-purple-50 via-blue-50 to-indigo-50/g, "bg-slate-50");
    content = content.replace(/from-purple-900 via-indigo-900 to-slate-900/g, "bg-slate-900");
    
    // Fix side tab borders
    content = content.replace(/border-l-4 border-blue-500/g, "border border-slate-200");
    content = content.replace(/border-l-4 border-emerald-500/g, "border border-slate-200");
    content = content.replace(/border-l-4 border-amber-500/g, "border border-slate-200");
    content = content.replace(/border-l-4 border-rose-500/g, "border border-slate-200");
    content = content.replace(/border-l-4 border-slate-500/g, "border border-slate-200");
    content = content.replace(/border-l-4/g, "border border-slate-200 rounded-md");
    
    fs.writeFileSync(filePath, content);
    console.log(`Fixed UI slop in ${filePath}`);
  } else {
    console.log(`Could not find ${filePath}`);
  }
});
