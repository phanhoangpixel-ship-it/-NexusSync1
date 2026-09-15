const fs = require('fs');
const file = 'src/components/workspaces/lotsBatches/LotsBatchesMasterTab.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'interface LotsBatchesMasterTabProps {\n  onNotify: (type: \'success\' | \'warning\' | \'error\' | \'info\', title: string, message: string) => void;\n  onSelectEntity?: (entity: any) => void;\n}',
  'interface LotsBatchesMasterTabProps {\n  lots: LotItem[];\n  setLots: React.Dispatch<React.SetStateAction<LotItem[]>>;\n  onNotify: (type: \'success\' | \'warning\' | \'error\' | \'info\', title: string, message: string) => void;\n  onSelectEntity?: (entity: any) => void;\n}'
);

content = content.replace(
  'export const LotsBatchesMasterTab: React.FC<LotsBatchesMasterTabProps> = ({ onNotify, onSelectEntity }) => {\n  const [lots, setLots] = useState<LotItem[]>([',
  'export const LotsBatchesMasterTab: React.FC<LotsBatchesMasterTabProps> = ({ lots, setLots, onNotify, onSelectEntity }) => {\n  /* useState<LotItem[]>([ ... removed */'
);

const lines = content.split('\n');
const startIndex = lines.findIndex(l => l.includes('/* useState<LotItem[]>([ ... removed */'));
const endIndex = lines.findIndex(l => l.trim() === ']);' && lines.indexOf(l) > startIndex);

if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex && endIndex - startIndex < 60) {
  lines.splice(startIndex + 1, endIndex - startIndex);
}

fs.writeFileSync(file, lines.join('\n'), 'utf8');
