import fs from "fs";
import path from "path";

const rootDir = process.cwd();
const srcDir = path.join(rootDir, "src");
const routesDir = path.join(srcDir, "routes");
const componentsDir = path.join(srcDir, "components");

let apiEndpoints: { method: string, path: string, file: string }[] = [];
let fetchCalls: { path: string, file: string }[] = [];
let todos: { file: string, line: number, text: string }[] = [];
let mocks: { file: string, line: number, text: string }[] = [];

// Recursive file search
function walkSync(dir: string, filelist: string[] = []) {
  if (!fs.existsSync(dir)) return filelist;
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      filelist = walkSync(filepath, filelist);
    } else {
      filelist.push(filepath);
    }
  });
  return filelist;
}

// 1. Analyze Routes (Backend APIs)
if (fs.existsSync(routesDir)) {
  const routeFiles = walkSync(routesDir).filter(f => f.endsWith(".ts"));
  routeFiles.forEach(file => {
    const content = fs.readFileSync(file, "utf-8");
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      const match = line.match(/router\.(get|post|put|delete|patch)\(\s*["']([^"']+)["']/i);
      if (match) {
        apiEndpoints.push({ method: match[1].toUpperCase(), path: match[2], file: path.relative(rootDir, file) });
      } else {
        // Match arrays of routes like router.get(["/api/1", "/api/2"]
        const arrayMatch = line.match(/router\.(get|post|put|delete|patch)\(\s*\[(.*?)\]/i);
        if (arrayMatch) {
           const method = arrayMatch[1].toUpperCase();
           const paths = arrayMatch[2].match(/["']([^"']+)["']/g);
           if (paths) {
             paths.forEach(p => {
                apiEndpoints.push({ method, path: p.replace(/['"]/g, ''), file: path.relative(rootDir, file) });
             });
           }
        }
      }
      
      if (line.match(/TODO|FIXME/i)) todos.push({ file: path.relative(rootDir, file), line: idx + 1, text: line.trim() });
      if (line.match(/mock|fake/i)) mocks.push({ file: path.relative(rootDir, file), line: idx + 1, text: line.trim() });
    });
  });
}

// 2. Analyze Frontend Fetch Calls
const allSrcFiles = walkSync(srcDir).filter(f => f.endsWith(".ts") || f.endsWith(".tsx"));
allSrcFiles.forEach(file => {
  const content = fs.readFileSync(file, "utf-8");
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    const fetchMatch = line.match(/fetch\(\s*[`"']([^`"'\$]+)/);
    if (fetchMatch && fetchMatch[1].startsWith('/api')) {
      fetchCalls.push({ path: fetchMatch[1], file: path.relative(rootDir, file) });
    }
    
    // Don't double count routes for TODOs
    if (!file.includes('routes')) {
      if (line.match(/TODO|FIXME/i)) todos.push({ file: path.relative(rootDir, file), line: idx + 1, text: line.trim() });
      if (line.match(/mock|fake/i) && !line.includes('mockData')) mocks.push({ file: path.relative(rootDir, file), line: idx + 1, text: line.trim() });
    }
  });
});

// Cross-reference
const definedPaths = new Set(apiEndpoints.map(e => e.path.split('?')[0].split('/:')[0])); // Simplify paths
const calledPaths = new Set(fetchCalls.map(f => f.path.split('?')[0]));

const unusedAPIs = Array.from(definedPaths).filter(p => !Array.from(calledPaths).some(cp => cp.startsWith(p) || p.startsWith(cp)));
const missingAPIs = Array.from(calledPaths).filter(cp => !Array.from(definedPaths).some(p => cp.startsWith(p) || p.startsWith(cp)));

// Generate Report
const report = `# FULL SYSTEM AUDIT REPORT - MODULAR ERP PLATFORM
Date: ${new Date().toISOString()}

## 1. System Overview
- **Total Defined API Endpoints**: ${apiEndpoints.length}
- **Total Frontend API Calls**: ${fetchCalls.length}
- **Total TODOs/FIXMEs**: ${todos.length}
- **Total Mock/Fake references**: ${mocks.length}

## 2. All Declared APIs
${apiEndpoints.map(e => `- ${e.method} ${e.path} (in ${e.file})`).join('\n')}

## 3 & 4 & 6. Backend APIs Declared But Potentially Unused (Or only used dynamically)
${unusedAPIs.length > 0 ? unusedAPIs.map(p => `- ${p}`).join('\n') : 'None detected directly.'}

## 5. Frontend API Calls with No Exact Backend Match (Check for dynamic params or missing implementations)
${missingAPIs.length > 0 ? missingAPIs.map(p => `- ${p}`).join('\n') : 'All frontend calls seem to have a backend match.'}

## 12 & 13. Technical Debt: TODOs, FIXMEs, and Mocks
### TODOs / FIXMEs
${todos.map(t => `- **${t.file}:${t.line}**: ${t.text}`).join('\n')}

### Mock/Fake Implementations Detected
${mocks.map(m => `- **${m.file}:${m.line}**: ${m.text}`).join('\n')}
`;

const reportsDir = path.join(rootDir, "docs/reports");
if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
fs.writeFileSync(path.join(reportsDir, "FULL_SYSTEM_AUDIT.md"), report);
console.log("Audit complete. Report generated at docs/reports/FULL_SYSTEM_AUDIT.md");
