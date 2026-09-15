const fs = require('fs');
let fileContent = fs.readFileSync('src/components/workspaces/M32PaymentsTreasuryWorkspace.tsx', 'utf-8');

// Replace standard variables
fileContent = fileContent.replace(/\{totalBalance\.toLocaleString\('vi-VN'\)\}/g, '{(totalBalance || 0).toLocaleString(\'vi-VN\')}');
fileContent = fileContent.replace(/\{totalReceipts\.toLocaleString\('vi-VN'\)\}/g, '{(totalReceipts || 0).toLocaleString(\'vi-VN\')}');
fileContent = fileContent.replace(/\{totalPayments\.toLocaleString\('vi-VN'\)\}/g, '{(totalPayments || 0).toLocaleString(\'vi-VN\')}');
fileContent = fileContent.replace(/\{netCashFlow\.toLocaleString\('vi-VN'\)\}/g, '{(netCashFlow || 0).toLocaleString(\'vi-VN\')}');
fileContent = fileContent.replace(/\{acc\.bookBalance\.toLocaleString\('vi-VN'\)\}/g, '{(acc.bookBalance || 0).toLocaleString(\'vi-VN\')}');
fileContent = fileContent.replace(/\{acc\.bankBalance\.toLocaleString\('vi-VN'\)\}/g, '{(acc.bankBalance || 0).toLocaleString(\'vi-VN\')}');
fileContent = fileContent.replace(/\{v\.amount\.toLocaleString\('vi-VN'\)\}/g, '{(v.amount || 0).toLocaleString(\'vi-VN\')}');
fileContent = fileContent.replace(/\{tr\.amount\.toLocaleString\('vi-VN'\)\}/g, '{(tr.amount || 0).toLocaleString(\'vi-VN\')}');
fileContent = fileContent.replace(/\{st\.amount\.toLocaleString\('vi-VN'\)\}/g, '{(st.amount || 0).toLocaleString(\'vi-VN\')}');
fileContent = fileContent.replace(/\{fc\.openingBalance\.toLocaleString\('vi-VN'\)\}/g, '{(fc.openingBalance || 0).toLocaleString(\'vi-VN\')}');
fileContent = fileContent.replace(/\{fc\.expectedInflows\.toLocaleString\('vi-VN'\)\}/g, '{(fc.expectedInflows || 0).toLocaleString(\'vi-VN\')}');
fileContent = fileContent.replace(/\{fc\.expectedOutflows\.toLocaleString\('vi-VN'\)\}/g, '{(fc.expectedOutflows || 0).toLocaleString(\'vi-VN\')}');
fileContent = fileContent.replace(/\{fc\.netCashFlow\.toLocaleString\('vi-VN'\)\}/g, '{(fc.netCashFlow || 0).toLocaleString(\'vi-VN\')}');
fileContent = fileContent.replace(/\{fc\.closingBalance\.toLocaleString\('vi-VN'\)\}/g, '{(fc.closingBalance || 0).toLocaleString(\'vi-VN\')}');
fileContent = fileContent.replace(/\{a\.bookBalance\.toLocaleString\('vi-VN'\)\}/g, '{(a.bookBalance || 0).toLocaleString(\'vi-VN\')}');
fileContent = fileContent.replace(/\{Number\(vietQrForm\.amount\)\.toLocaleString\('vi-VN'\)\}/g, '{(Number(vietQrForm.amount) || 0).toLocaleString(\'vi-VN\')}');
fileContent = fileContent.replace(/\{selectedVoucherDetail\.amount\.toLocaleString\('vi-VN'\)\}/g, '{(selectedVoucherDetail.amount || 0).toLocaleString(\'vi-VN\')}');
fileContent = fileContent.replace(/selectedVoucherDetail\.amount\.toLocaleString/g, '(selectedVoucherDetail.amount || 0).toLocaleString');

fs.writeFileSync('src/components/workspaces/M32PaymentsTreasuryWorkspace.tsx', fileContent);
