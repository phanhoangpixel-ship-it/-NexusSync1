import fs from 'fs';

let m22 = fs.readFileSync('src/components/workspaces/M22LotsBatchesWorkspace.tsx', 'utf-8');

// Replace selectedLotForTraceId with a global active lot state
m22 = m22.replace(
  "const [selectedLotForTraceId, setSelectedLotForTraceId] = useState<string>('LOT-2026-001');",
  "const [globalActiveLotId, setGlobalActiveLotId] = useState<string>('LOT-2026-001');"
);

// Update handleViewTraceability
m22 = m22.replace(
  "setSelectedLotForTraceId(lot.id);",
  "setGlobalActiveLotId(lot.id);"
);

// Update LotsBatchesTraceabilityTab to use global active lot
m22 = m22.replace(
  "initialLotId={selectedLotForTraceId}",
  "activeLotId={globalActiveLotId}\n            onLotChange={setGlobalActiveLotId}"
);

// Add globalActiveLotId to LotsBatchesFEFOTab
m22 = m22.replace(
  "<LotsBatchesFEFOTab \n            lots={lots} \n            onSelectEntity={onSelectEntity} \n          />",
  `<LotsBatchesFEFOTab 
            lots={lots} 
            onSelectEntity={onSelectEntity} 
            activeLotId={globalActiveLotId}
          />`
);

fs.writeFileSync('src/components/workspaces/M22LotsBatchesWorkspace.tsx', m22);

let trace = fs.readFileSync('src/components/workspaces/lotsBatches/LotsBatchesTraceabilityTab.tsx', 'utf-8');

trace = trace.replace(
  "  initialLotId?: string;",
  "  activeLotId?: string;\n  onLotChange?: (lotId: string) => void;"
);

trace = trace.replace(
  "initialLotId, onViewDrilldown }) => {",
  "activeLotId: externalActiveLotId, onLotChange, onViewDrilldown }) => {"
);

// Replace local activeLotId with external or fallback to local
trace = trace.replace(
  "const [activeLotId, setActiveLotId] = useState<string>(initialLotId || lots[0]?.id || 'LOT-2026-001');",
  "const [localActiveLotId, setLocalActiveLotId] = useState<string>(externalActiveLotId || lots[0]?.id || 'LOT-2026-001');\n  const activeLotId = externalActiveLotId || localActiveLotId;"
);

trace = trace.replace(
  "useEffect(() => {\n    if (initialLotId) {\n      setActiveLotId(initialLotId);\n    }\n  }, [initialLotId]);",
  `const handleLotChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLotId = e.target.value;
    setLocalActiveLotId(newLotId);
    if (onLotChange) onLotChange(newLotId);
  };`
);

trace = trace.replace(
  "onChange={(e) => setActiveLotId(e.target.value)}",
  "onChange={handleLotChange}"
);

fs.writeFileSync('src/components/workspaces/lotsBatches/LotsBatchesTraceabilityTab.tsx', trace);

let fefo = fs.readFileSync('src/components/workspaces/lotsBatches/LotsBatchesFEFOTab.tsx', 'utf-8');

fefo = fefo.replace(
  "  onSelectEntity?: (entity: any) => void;\n}",
  "  onSelectEntity?: (entity: any) => void;\n  activeLotId?: string;\n}"
);

fefo = fefo.replace(
  "export const LotsBatchesFEFOTab: React.FC<LotsBatchesFEFOTabProps> = ({ lots, onSelectEntity }) => {",
  "export const LotsBatchesFEFOTab: React.FC<LotsBatchesFEFOTabProps> = ({ lots, onSelectEntity, activeLotId }) => {"
);

fefo = fefo.replace(
  "const [simSku, setSimSku] = useState<string>(uniqueSkus[0] || '');",
  `const [simSku, setSimSku] = useState<string>(uniqueSkus[0] || '');

  // Synchronize FEFO SKU with global active lot
  useEffect(() => {
    if (activeLotId) {
      const lot = lots.find(l => l.id === activeLotId);
      if (lot && uniqueSkus.includes(lot.sku)) {
        setSimSku(lot.sku);
      }
    }
  }, [activeLotId, lots, uniqueSkus]);`
);

fs.writeFileSync('src/components/workspaces/lotsBatches/LotsBatchesFEFOTab.tsx', fefo);

