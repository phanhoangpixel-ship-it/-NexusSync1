import React, { useState, useEffect } from 'react';
import { X, Network, Plus, ChevronRight, ChevronDown, Cpu, Layers, Building2, Factory, CheckCircle2 } from 'lucide-react';

interface AssetHierarchyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string) => void;
}

export const AssetHierarchyModal: React.FC<AssetHierarchyModalProps> = ({
  isOpen,
  onClose,
  onNotify,
}) => {
  const [nodes, setNodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // New Node Form State
  const [parentNodeId, setParentNodeId] = useState<number | ''>('');
  const [hierarchyLevel, setHierarchyLevel] = useState<string>('MACHINE');
  const [nodeCode, setNodeCode] = useState<string>('');
  const [nodeName, setNodeName] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [submitting, setSubmitting] = useState<false | true>(false);

  const fetchHierarchy = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/eam/asset-hierarchy');
      if (res.ok) {
        const data = await res.json();
        setNodes(data);
      }
    } catch (err: any) {
      console.warn('Failed to load asset hierarchy:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHierarchy();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nodeCode.trim() || !nodeName.trim()) {
      onNotify('warning', 'Thiếu dữ liệu', 'Vui lòng nhập mã và tên nút cây thiết bị.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/eam/asset-hierarchy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentId: parentNodeId ? Number(parentNodeId) : null,
          hierarchyLevel,
          nodeCode: nodeCode.trim(),
          nodeName: nodeName.trim(),
          location: location.trim() || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Lỗi khi tạo nút cây thiết bị');
      }

      onNotify('success', 'Thêm nút thành công', `Đã thêm [${nodeCode}] vào cấu trúc cây thiết bị.`);
      setNodeCode('');
      setNodeName('');
      setLocation('');
      setShowAddForm(false);
      fetchHierarchy();
    } catch (err: any) {
      onNotify('danger', 'Lỗi tạo nút', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'SITE':
        return <Building2 className="w-4 h-4 text-purple-500" />;
      case 'PRODUCTION_LINE':
        return <Factory className="w-4 h-4 text-blue-500" />;
      case 'MACHINE':
        return <Cpu className="w-4 h-4 text-emerald-500" />;
      default:
        return <Layers className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Cây Cấu Trúc Thiết Bị &amp; Vị Trí (Asset Hierarchy)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Site • Production Line • Machine • Component Topology</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Vị Trí / Nút</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* ADD NODE INLINE FORM */}
          {showAddForm && (
            <form onSubmit={handleCreateNode} className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-800 space-y-3">
              <div className="text-xs font-bold text-indigo-900 dark:text-indigo-300">
                Thêm Nút Mới Vào Cây Cấu Trúc
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cấp Bậc (Hierarchy Level) *
                  </label>
                  <select
                    value={hierarchyLevel}
                    onChange={(e) => setHierarchyLevel(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="SITE">SITE (Nhà máy / Khuôn viên)</option>
                    <option value="PRODUCTION_LINE">PRODUCTION_LINE (Dây chuyền SX / Phân xưởng)</option>
                    <option value="MACHINE">MACHINE (Máy móc thiết bị)</option>
                    <option value="COMPONENT">COMPONENT (Cụm linh kiện / Module)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nút Cha (Parent Node)
                  </label>
                  <select
                    value={parentNodeId}
                    onChange={(e) => setParentNodeId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="">-- Gốc (Root Level) --</option>
                    {nodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        [{n.hierarchyLevel}] {n.nodeCode} - {n.nodeName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mã Vị Trí / Máy *
                  </label>
                  <input
                    type="text"
                    placeholder="VD: LINE-02 hoặc AST-0004"
                    value={nodeCode}
                    onChange={(e) => setNodeCode(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tên Vị Trí / Tên Máy *
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Dây Chuyền Hàn Laser Robot 02"
                    value={nodeName}
                    onChange={(e) => setNodeName(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold"
                >
                  {submitting ? 'Đang lưu...' : 'Lưu Nút Cây'}
                </button>
              </div>
            </form>
          )}

          {/* HIERARCHY TREE VIEW */}
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Đang tải cấu trúc cây thiết bị...</div>
          ) : nodes.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">Chưa có nút cây thiết bị nào được khởi tạo.</div>
          ) : (
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-700/60">
              {nodes.map((node) => {
                const depth = node.parentId ? (node.hierarchyLevel === 'MACHINE' ? 2 : 1) : 0;
                return (
                  <div
                    key={node.id}
                    style={{ paddingLeft: `${depth * 24 + 16}px` }}
                    className="py-3 pr-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors bg-white dark:bg-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                        {getLevelIcon(node.hierarchyLevel)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                            {node.nodeCode}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {node.hierarchyLevel}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                          {node.nodeName}
                        </div>
                        {node.location && (
                          <div className="text-[11px] text-slate-400 dark:text-slate-500">
                            📍 {node.location}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {node.asset ? (
                        <div className="text-right">
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                            Đã liên kết tài sản
                          </span>
                          <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
                            {Number(node.asset.bookValue || 0).toLocaleString('vi-VN')} ₫
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 font-medium">
                          Nút vị trí / Cụm
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
