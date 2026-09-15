const fs = require('fs');
const file = 'src/components/workspaces/M15ReturnsRMAWorkspace.tsx';
let code = fs.readFileSync(file, 'utf8');

const target = `  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });`;

const replacement = `  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [newCustomer, setNewCustomer] = useState('');
  const [newSo, setNewSo] = useState('');
  const [newProduct, setNewProduct] = useState('');
  const [newQty, setNewQty] = useState('');
  const [newReason, setNewReason] = useState('Lỗi kỹ thuật');
  const [newResolution, setNewResolution] = useState('REPAIR');`;

if (code.includes(target)) {
  fs.writeFileSync(file, code.replace(target, replacement));
  console.log("Fixed M15 missing states.");
} else {
  console.log("Target not found!");
}
