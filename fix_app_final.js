const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// There are several places where template literals got corrupted.
// For example: `Xác nhận ${actionLabel}` might have become `Xác nhận ${actionLabel` or something weird.

code = code.replace(/title: `Xác nhận \$\{actionLabel\}`,\n\s*message: `Bạn có chắc chắn muốn thực hiện thao tác "\$\{actionLabel\}" cho chứng từ \$\{item\.businessReference\}\?`,/g, 
"title: `Xác nhận ${actionLabel}`,\nmessage: `Bạn có chắc chắn muốn thực hiện thao tác \"${actionLabel}\" cho chứng từ ${item.businessReference}?`,");

fs.writeFileSync('src/App.tsx', code);
