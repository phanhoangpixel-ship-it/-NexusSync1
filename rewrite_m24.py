import re
import sys

def rewrite():
    with open('src/components/workspaces/M24WMSExtendedWorkspace.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # Fix || fallbacks in logic (Rule #20 constraint)
    content = content.replace("p.category || 'Vật tư chung'", "p.category ?? 'Vật tư chung'")
    content = content.replace("p.unit || 'Cái'", "p.unit ?? 'Cái'")
    content = content.replace("p.unit || p.baseUnit || 'Cái'", "p.unit ?? p.baseUnit ?? 'Cái'")

    # Now let's replace the Header and Tabs with L0 and L1 design from M19.
    
    # We will replace everything from return ( \n <div className="p-6 ... to the end.
    
    start_idx = content.find('return (')
    
    # The new render method:
    new_render = """return (
    <div className="space-y-3.5 max-w-full pb-6 font-sans">
      {/* ========================================================================= */}
      {/* L0: WORKSPACE BANNER & CORE IDENTITY (COMPACT & MODERN)                   */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-100 text-[10px] font-mono font-bold rounded-md border border-slate-200 dark:border-slate-600">
                M24 • WMS EXTENDED
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">
                Kho Vận Nâng Cao & Tự Động Hóa
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight mt-0.5">
              WMS Extended Hub
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 text-[11px] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Rule #19 Confirmed</span>
          </div>
          <button 
            onClick={() => onNotify('success', 'Đồng bộ WMS Extended', 'Đã đồng bộ toàn bộ luồng nâng cao với Inventory Core Ledger thành công.')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Đồng Bộ Ledger
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TABS NAVIGATION STRIP (STREAMLINED & RESPONSIVE)                     */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('wave')}
          className={`px-3 py-1.5 font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'wave'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Wave Picking</span>
        </button>
        <button
          onClick={() => setActiveTab('replenish')}
          className={`px-3 py-1.5 font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'replenish'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60'
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Replenishment</span>
        </button>
        <button
          onClick={() => setActiveTab('allocation')}
          className={`px-3 py-1.5 font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'allocation'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60'
          }`}
        >
          <Boxes className="w-3.5 h-3.5" />
          <span>Bin Allocation</span>
        </button>
        <button
          onClick={() => setActiveTab('lpn')}
          className={`px-3 py-1.5 font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'lpn'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Packing LPN</span>
        </button>
        <button
          onClick={() => setActiveTab('dock')}
          className={`px-3 py-1.5 font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'dock'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Dock Appointment</span>
        </button>
        <button
          onClick={() => setActiveTab('carrier')}
          className={`px-3 py-1.5 font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'carrier'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Carrier Freight</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* ACTIVE SUB-TAB RENDER (L3 DATA TABLE)                                     */}
      {/* ========================================================================= */}
      <div>
        {activeTab === 'wave' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
            <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">Wave Picking</h3>
                <p className="text-xs text-slate-500 mt-0.5">Tập hợp nhiều đơn hàng bán (SO) theo khu vực để tối ưu hóa.</p>
              </div>
              <button 
                onClick={() => handleAction('Tạo Wave Sóng Mới', 'WAVE-NEW')}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 flex items-center gap-1.5 shadow-2xs transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Tạo Wave Mới
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3 min-w-[140px]">Mã Wave</th>
                    <th className="py-2.5 px-3 min-w-[160px]">Khu Vực (Zone)</th>
                    <th className="py-2.5 px-3 min-w-[100px] text-center">Số Lượng SO</th>
                    <th className="py-2.5 px-3 min-w-[100px] text-center">Tổng Dòng</th>
                    <th className="py-2.5 px-3 min-w-[100px] text-center">Tiến Độ</th>
                    <th className="py-2.5 px-3 min-w-[120px] text-center">Trạng Thái</th>
                    <th className="py-2.5 px-3 min-w-[120px] text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                  {waves.map(w => (
                    <tr key={w.id} className="transition-all duration-150 group hover:bg-slate-100/80 dark:hover:bg-slate-700/60 border-l-4 border-transparent">
                      <td className="py-2.5 px-3">
                        <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md border border-slate-300 dark:border-slate-600">
                          {w.id}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">{w.zone}</td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-center">{w.ordersCount} đơn</td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-center">{w.totalLines} lines</td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-blue-600 dark:text-blue-400 font-bold text-center">{w.progress}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${w.status === 'RELEASED_TO_PICKER' ? 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700' : 'bg-slate-100 text-slate-900 border-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600'}`}>
                          {w.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button 
                          onClick={() => handleAction('Phát hành Wave cho Picker', w.id)}
                          className="px-2.5 py-1 text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-2xs flex items-center gap-1 cursor-pointer inline-flex"
                        >
                          <Play className="w-3 h-3" /> Phát Hành
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'replenish' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
            <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">Replenishment</h3>
                <p className="text-xs text-slate-500 mt-0.5">Bổ sung hàng tự động cho Pick-Face.</p>
              </div>
              <button 
                onClick={() => handleAction('Chạy Quy Tắc Bổ Sung Hàng', 'REP-RUN')}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 flex items-center gap-1.5 shadow-2xs transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Chạy Quy Tắc
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3 min-w-[120px]">Mã Task</th>
                    <th className="py-2.5 px-3 min-w-[200px]">SKU &amp; Sản Phẩm</th>
                    <th className="py-2.5 px-3 min-w-[180px]">Tuyến Đườn (Bulk ➔ Pick-Face)</th>
                    <th className="py-2.5 px-3 min-w-[100px] text-center">Số Lượng</th>
                    <th className="py-2.5 px-3 min-w-[120px] text-center">Trạng Thái</th>
                    <th className="py-2.5 px-3 min-w-[120px] text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                  {replenishments.map(r => (
                    <tr key={r.id} className="transition-all duration-150 group hover:bg-slate-100/80 dark:hover:bg-slate-700/60 border-l-4 border-transparent">
                      <td className="py-2.5 px-3">
                        <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md border border-slate-300 dark:border-slate-600">
                          {r.id}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-mono text-xs text-blue-600 dark:text-blue-400 font-bold mb-0.5">{r.sku}</div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{r.productName ?? r.sku}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        <span className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{r.fromBin}</span> ➔ <span className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-1 rounded font-bold">{r.toBin}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums font-bold text-center">{r.qty}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${r.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/90 dark:text-blue-200 dark:border-blue-700' : 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button 
                          onClick={() => handleAction('Hoàn tất Replenishment', r.id)}
                          className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all shadow-2xs flex items-center gap-1 cursor-pointer inline-flex"
                        >
                          <Check className="w-3 h-3" /> Hoàn Tất
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'allocation' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
            <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">Bin Allocation</h3>
                <p className="text-xs text-slate-500 mt-0.5">Phân bổ vị trí thông minh theo FEFO/FIFO.</p>
              </div>
              <button 
                onClick={() => handleAction('Chạy Lại Thuật Toán Phân Bổ', 'ALLOC-RUN')}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 flex items-center gap-1.5 shadow-2xs transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Tối Ưu Hóa (Bin Slotting)
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3 min-w-[200px]">Mã SKU &amp; Sản Phẩm</th>
                    <th className="py-2.5 px-3 min-w-[100px] text-center">Yêu Cầu</th>
                    <th className="py-2.5 px-3 min-w-[120px]">Vị Trí (Bin)</th>
                    <th className="py-2.5 px-3 min-w-[150px]">Quy Tắc Thuật Toán</th>
                    <th className="py-2.5 px-3 min-w-[100px] text-right">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                  {allocations.map((a, idx) => (
                    <tr key={idx} className="transition-all duration-150 group hover:bg-slate-100/80 dark:hover:bg-slate-700/60 border-l-4 border-transparent">
                      <td className="py-2.5 px-3">
                        <div className="font-mono text-xs text-blue-600 dark:text-blue-400 font-bold mb-0.5">{a.sku}</div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{a.productName}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums font-bold text-center">{a.requestedQty}</td>
                      <td className="py-2.5 px-3">
                         <span className="font-mono text-xs font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-700">
                          {a.assignedBin}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 text-[11px]">{a.rule}</td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700">
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'lpn' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
            <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">Packing LPN</h3>
                <p className="text-xs text-slate-500 mt-0.5">Quản lý định danh kiện hàng (License Plate Number).</p>
              </div>
              <button 
                onClick={() => handleAction('Tạo Mới LPN', 'LPN-NEW')}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 flex items-center gap-1.5 shadow-2xs transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Tạo Mã LPN
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3 min-w-[120px]">Mã LPN</th>
                    <th className="py-2.5 px-3 min-w-[150px]">Quy Cách</th>
                    <th className="py-2.5 px-3 min-w-[100px] text-center">Trọng Lượng</th>
                    <th className="py-2.5 px-3 min-w-[120px] text-center">Đơn SO</th>
                    <th className="py-2.5 px-3 min-w-[120px] text-center">Trạng Thái</th>
                    <th className="py-2.5 px-3 min-w-[120px] text-right">Thao Tác In</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                  {lpns.map(l => (
                    <tr key={l.lpnCode} className="transition-all duration-150 group hover:bg-slate-100/80 dark:hover:bg-slate-700/60 border-l-4 border-transparent">
                      <td className="py-2.5 px-3">
                         <span className="font-mono text-xs font-bold text-indigo-800 dark:text-indigo-200 bg-indigo-100 dark:bg-indigo-900/40 px-2 py-0.5 rounded-md border border-indigo-300 dark:border-indigo-700">
                          {l.lpnCode}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100">{l.cartonSize}</td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-center">{l.weight}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300 text-center">{l.soCode}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${l.status === 'SEALED' ? 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700' : 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/90 dark:text-blue-200 dark:border-blue-700'}`}>
                          {l.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button 
                          onClick={() => onNotify('success', 'In Tem LPN', `Đã gửi lệnh in tem vạch cho mã ${l.lpnCode}`)}
                          className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-all shadow-2xs flex items-center gap-1 cursor-pointer inline-flex border border-slate-300 dark:border-slate-600"
                        >
                          <QrCode className="w-3 h-3" /> In Tem
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'dock' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
            <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">Dock Appointment</h3>
                <p className="text-xs text-slate-500 mt-0.5">Quản lý lịch hẹn xe tải nhận/xuất hàng.</p>
              </div>
              <button 
                onClick={() => handleAction('Đăng Ký Lịch Cửa Kho', 'DOCK-NEW')}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 flex items-center gap-1.5 shadow-2xs transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Lịch Xe Mới
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3 min-w-[150px]">Cửa Kho (Dock Bay)</th>
                    <th className="py-2.5 px-3 min-w-[150px]">Hãng Vận Chuyển / Xe</th>
                    <th className="py-2.5 px-3 min-w-[120px] text-center">Chứng Từ</th>
                    <th className="py-2.5 px-3 min-w-[120px] text-center">Khung Giờ</th>
                    <th className="py-2.5 px-3 min-w-[120px] text-center">Trạng Thái</th>
                    <th className="py-2.5 px-3 min-w-[120px] text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                  {appointments.map(d => (
                    <tr key={d.id} className="transition-all duration-150 group hover:bg-slate-100/80 dark:hover:bg-slate-700/60 border-l-4 border-transparent">
                      <td className="py-2.5 px-3">
                         <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md border border-slate-300 dark:border-slate-600">
                          {d.dockName}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">{d.carrier}</td>
                      <td className="py-2.5 px-3 font-mono text-blue-600 dark:text-blue-400 text-center">{d.poCode ?? d.soCode}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300 text-center">{d.timeSlot}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${d.status === 'CHECKED_IN' ? 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700' : 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/90 dark:text-blue-200 dark:border-blue-700'}`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button 
                          onClick={() => handleAction('Check-in xe tải vào cửa kho', d.id)}
                          className="px-2.5 py-1 text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-2xs flex items-center gap-1 cursor-pointer inline-flex"
                        >
                          <CheckCircle2 className="w-3 h-3" /> Check-in
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'carrier' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
            <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">Carrier Freight</h3>
                <p className="text-xs text-slate-500 mt-0.5">Theo dõi vận đơn (Waybill) &amp; cước phí.</p>
              </div>
              <button 
                onClick={() => handleAction('Tạo Vận Đơn Mới', 'WB-NEW')}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 flex items-center gap-1.5 shadow-2xs transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Tạo Vận Đơn
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3 min-w-[140px]">Mã Vận Đơn</th>
                    <th className="py-2.5 px-3 min-w-[160px]">Hãng Vận Chuyển</th>
                    <th className="py-2.5 px-3 min-w-[120px]">Dịch Vụ</th>
                    <th className="py-2.5 px-3 min-w-[120px] text-right">Cước Phí (VND)</th>
                    <th className="py-2.5 px-3 min-w-[120px] text-center">Trạng Thái</th>
                    <th className="py-2.5 px-3 min-w-[120px] text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                  {freights.map(f => (
                    <tr key={f.waybill} className="transition-all duration-150 group hover:bg-slate-100/80 dark:hover:bg-slate-700/60 border-l-4 border-transparent">
                      <td className="py-2.5 px-3">
                         <span className="font-mono text-xs font-bold text-blue-800 dark:text-blue-200 bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded-md border border-blue-300 dark:border-blue-700">
                          {f.waybill}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">{f.carrierName}</td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{f.serviceType}</td>
                      <td className="py-2.5 px-3 font-mono tabular-nums font-bold text-slate-900 dark:text-white text-right">{f.cost}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${f.status === 'DISPATCHED' ? 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700' : 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/90 dark:text-blue-200 dark:border-blue-700'}`}>
                          {f.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button 
                          onClick={() => handleAction('Dispatch Vận Đơn', f.waybill)}
                          className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all shadow-2xs flex items-center gap-1 cursor-pointer inline-flex"
                        >
                          <Truck className="w-3 h-3" /> Dispatch
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ConfirmDialog Rule #19 */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
      />
    </div>
  );"""
    
    final_content = content[:start_idx] + new_render + "\n};\n"
    
    with open('src/components/workspaces/M24WMSExtendedWorkspace.tsx', 'w', encoding='utf-8') as f:
        f.write(final_content)

rewrite()
