const fs = require('fs');
let content = fs.readFileSync('src/components/workspaces/M09SuppliersSRMWorkspace.tsx', 'utf-8');
content = content.replace(/<ConfirmDialog \{\.\.\.confirmDialog\} \/>\n/g, '');
content = content.replace(
  /    <\/div>\n  \);\n};\nexport default M09SuppliersSRMWorkspace;/g,
  `      <ConfirmDialog {...confirmDialog} />\n    </div>\n  );\n};\nexport default M09SuppliersSRMWorkspace;`
);
fs.writeFileSync('src/components/workspaces/M09SuppliersSRMWorkspace.tsx', content);
