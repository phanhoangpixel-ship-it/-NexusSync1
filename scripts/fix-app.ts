import * as fs from 'fs';

let appTsx = fs.readFileSync('src/App.tsx', 'utf-8');
appTsx = appTsx.replace(
  `      if (route.includes('stock-adjustment')) {
        const m10 = MODULE_REGISTRY.find((m) => m.moduleId === 'M10');
        if (m10) setCurrentModule(m10);
      } else if (route.includes('inventory')) {
        const m07 = MODULE_REGISTRY.find((m) => m.moduleId === 'M07');
        if (m07) setCurrentModule(m07);`,
  `      if (route.includes('stock-adjustment')) {
        const m20 = MODULE_REGISTRY.find((m) => m.moduleId === 'M20');
        if (m20) setCurrentModule(m20);
      } else if (route.includes('inventory')) {
        const m17 = MODULE_REGISTRY.find((m) => m.moduleId === 'M17');
        if (m17) setCurrentModule(m17);`
);
fs.writeFileSync('src/App.tsx', appTsx);
