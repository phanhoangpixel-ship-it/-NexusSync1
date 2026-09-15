import fs from 'fs';

let content = fs.readFileSync('src/components/workspaces/LotInventoryHistoryDrilldown.tsx', 'utf-8');

// 1. Add useEffect for currentLot
content = content.replace(
  "  const [currentLot, setCurrentLot] = useState<LotItem>(lot);\n  const [lotLedgerMovements, setLotLedgerMovements] = useState<LotLedgerMovement[]>([]);",
  `  const [currentLot, setCurrentLot] = useState<LotItem>(lot);

  // Sync currentLot when lot prop changes (Rule #2)
  useEffect(() => {
    setCurrentLot(lot);
  }, [lot]);

  const [lotLedgerMovements, setLotLedgerMovements] = useState<LotLedgerMovement[]>([]);`
);

fs.writeFileSync('src/components/workspaces/LotInventoryHistoryDrilldown.tsx', content);

let m22 = fs.readFileSync('src/components/workspaces/M22LotsBatchesWorkspace.tsx', 'utf-8');

// 2. Import LotInventoryHistoryDrilldown in M22
if (!m22.includes("import { LotInventoryHistoryDrilldown }")) {
  m22 = m22.replace(
    "import { LotItem } from './lotsBatches/LotInventoryHistoryDrilldown';",
    "import { LotItem, LotInventoryHistoryDrilldown } from './lotsBatches/LotInventoryHistoryDrilldown';"
  );
  m22 = m22.replace(
    "import { LotItem } from './LotInventoryHistoryDrilldown';",
    "import { LotItem, LotInventoryHistoryDrilldown } from './LotInventoryHistoryDrilldown';"
  );
}

// 3. Add selectedLotForDrilldown state in M22
m22 = m22.replace(
  "const [selectedLotForTraceId, setSelectedLotForTraceId] = useState<string>('LOT-2026-001');",
  `const [selectedLotForTraceId, setSelectedLotForTraceId] = useState<string>('LOT-2026-001');
  const [selectedLotForDrilldown, setSelectedLotForDrilldown] = useState<LotItem | null>(null);`
);

// 4. Pass onViewDrilldown to tabs in M22
m22 = m22.replace(
  "<LotsBatchesMasterTab \n            lots={lots}\n            onSelectEntity={onSelectEntity}\n            onViewTraceability={handleViewTraceability}\n          />",
  `<LotsBatchesMasterTab 
            lots={lots}
            onSelectEntity={onSelectEntity}
            onViewTraceability={handleViewTraceability}
            onViewDrilldown={setSelectedLotForDrilldown}
          />`
);

m22 = m22.replace(
  "<LotsBatchesTraceabilityTab \n            lots={lots} \n            onSelectEntity={onSelectEntity} \n            initialLotId={selectedLotForTraceId}\n          />",
  `<LotsBatchesTraceabilityTab 
            lots={lots} 
            onSelectEntity={onSelectEntity} 
            initialLotId={selectedLotForTraceId}
            onViewDrilldown={setSelectedLotForDrilldown}
          />`
);

// 5. Add the Drilldown modal to M22
if (!m22.includes("<LotInventoryHistoryDrilldown")) {
  m22 = m22.replace(
    "    </div>\n  );\n};",
    `
      {/* LOT INVENTORY HISTORY & STOCK MOVEMENTS DRILLDOWN MODAL */}
      {selectedLotForDrilldown && (
        <LotInventoryHistoryDrilldown
          lot={selectedLotForDrilldown}
          onClose={() => setSelectedLotForDrilldown(null)}
          onNotify={onNotify}
          onUpdateLotStatus={(lotId, newStatus) => {
            setLots(prev => prev.map(l => l.id === lotId ? { ...l, status: newStatus } : l));
            setSelectedLotForDrilldown(prev => prev && prev.id === lotId ? { ...prev, status: newStatus } : prev);
          }}
        />
      )}
    </div>
  );
};`
  );
}

fs.writeFileSync('src/components/workspaces/M22LotsBatchesWorkspace.tsx', m22);

let master = fs.readFileSync('src/components/workspaces/lotsBatches/LotsBatchesMasterTab.tsx', 'utf-8');

// 6. Add onViewDrilldown to LotsBatchesMasterTab props
master = master.replace(
  "  onViewTraceability?: (lot: LotItem) => void;\n}",
  "  onViewTraceability?: (lot: LotItem) => void;\n  onViewDrilldown?: (lot: LotItem) => void;\n}"
);

master = master.replace(
  "export const LotsBatchesMasterTab: React.FC<LotsBatchesMasterTabProps> = ({ lots, onSelectEntity, onViewTraceability }) => {",
  "export const LotsBatchesMasterTab: React.FC<LotsBatchesMasterTabProps> = ({ lots, onSelectEntity, onViewTraceability, onViewDrilldown }) => {"
);

// 7. Remove Drilldown from MasterTab
master = master.replace(
  "const [selectedLotForDrilldown, setSelectedLotForDrilldown] = useState<LotItem | null>(null);",
  ""
);

master = master.replace(
  "setSelectedLotForDrilldown(lot);",
  "if (onViewDrilldown) onViewDrilldown(lot);"
);

master = master.replace(
  /\{\/\* LOT INVENTORY HISTORY & STOCK MOVEMENTS DRILLDOWN MODAL \*\/\}[\s\S]*?<\LotInventoryHistoryDrilldown[\s\S]*?\/>\n      \)\}/,
  ""
);

fs.writeFileSync('src/components/workspaces/lotsBatches/LotsBatchesMasterTab.tsx', master);

let trace = fs.readFileSync('src/components/workspaces/lotsBatches/LotsBatchesTraceabilityTab.tsx', 'utf-8');

// 8. Add onViewDrilldown to LotsBatchesTraceabilityTab
trace = trace.replace(
  "  initialLotId?: string;\n}",
  "  initialLotId?: string;\n  onViewDrilldown?: (lot: any) => void;\n}"
);

trace = trace.replace(
  "export const LotsBatchesTraceabilityTab: React.FC<LotsBatchesTraceabilityTabProps> = ({ lots, onSelectEntity, initialLotId }) => {",
  "export const LotsBatchesTraceabilityTab: React.FC<LotsBatchesTraceabilityTabProps> = ({ lots, onSelectEntity, initialLotId, onViewDrilldown }) => {"
);

// 9. Update the "Chi Tiết Sổ Cái" button in TraceabilityTab
trace = trace.replace(
  "onClick={() => onSelectEntity && onSelectEntity(activeLot)}\n                className=\"px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer\"\n                title=\"Đồng bộ vào khung ngữ cảnh & sổ cái chi tiết\"",
  `onClick={() => onViewDrilldown ? onViewDrilldown(activeLot) : (onSelectEntity && onSelectEntity(activeLot))}
                className="px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                title="Mở sổ cái chi tiết cho lô hàng này"`
);

fs.writeFileSync('src/components/workspaces/lotsBatches/LotsBatchesTraceabilityTab.tsx', trace);

