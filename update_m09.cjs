const fs = require('fs');
const content = fs.readFileSync('src/components/workspaces/M09SuppliersSRMWorkspace.tsx', 'utf-8');

const updated = content
  // Remove the static state initialization for suppliers
  .replace(/const \[suppliers, setSuppliers\] = useState<any\[\]>\(\[[\s\S]*?\]\);/, `const [suppliers, setSuppliers] = useState<any[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<any>(null);

  const fetchSuppliers = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/suppliers', {
        headers: {
          'Authorization': \`Bearer \${currentUser?.token || ''}\`
        }
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
           throw new Error('Unauthorized or Forbidden access');
        }
        throw new Error(\`HTTP \${res.status}\`);
      }
      const data = await res.json();
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setFetchError(err.message);
      onNotify('danger', 'Lỗi tải dữ liệu', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);`)
  // Update handleCreateSupplier
  .replace(/const handleCreateSupplier = \(e: React.FormEvent\) => {[\s\S]*?};/, `const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!newSuppName.trim()) {
      onNotify('warning', 'Thiếu thông tin', 'Vui lòng nhập tên nhà cung cấp.');
      return;
    }
    setIsSubmitting(true);
    try {
      const idempotencyKey = crypto.randomUUID();
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${currentUser?.token || ''}\`,
          'Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify({
          code: newSuppTax || \`SUP-\${Date.now().toString().slice(-6)}\`,
          name: newSuppName,
          taxCode: newSuppTax,
          paymentTerms: newSuppTerm,
          creditLimit: parseInt(newSuppLimit.replace(/\\D/g, '')) || 0,
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || \`HTTP \${res.status}\`);
      }
      onNotify('success', 'Thành công', \`Đã tạo nhà cung cấp: \${data.data?.name}\`);
      setNewSuppName('');
      setNewSuppTax('');
      fetchSuppliers();
    } catch (err: any) {
      onNotify('danger', 'Lỗi tạo NCC', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchiveSupplier = async (id: number) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(\`/api/suppliers/\${id}\`, {
        method: 'DELETE',
        headers: {
          'Authorization': \`Bearer \${currentUser?.token || ''}\`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || \`HTTP \${res.status}\`);
      }
      onNotify('success', 'Thành công', 'Đã lưu trữ nhà cung cấp.');
      fetchSuppliers();
    } catch (err: any) {
      onNotify('danger', 'Lỗi lưu trữ', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestArchiveSupplier = (supplier: any) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xác nhận Lưu trữ',
      message: \`Lưu trữ nhà cung cấp "\${supplier.name}"? Hành động này sẽ chuyển trạng thái sang ARCHIVED.\`,
      variant: 'warning',
      confirmText: 'Đồng ý',
      cancelText: 'Hủy',
      onConfirm: () => {
         setConfirmDialog(null);
         handleArchiveSupplier(supplier.id);
      },
      onClose: () => setConfirmDialog(null)
    });
  };`);

fs.writeFileSync('src/components/workspaces/M09SuppliersSRMWorkspace_temp.tsx', updated);
