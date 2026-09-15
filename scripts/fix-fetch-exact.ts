import fs from "fs";

let content = fs.readFileSync("src/main.tsx", "utf-8");

const startIndex = content.indexOf("const originalFetch = window.fetch;");
const endIndex = content.indexOf("ReactDOM.createRoot");

if (startIndex !== -1 && endIndex !== -1) {
  const newPatch = `const originalFetch = window.fetch;
Object.defineProperty(window, 'fetch', {
  configurable: true,
  enumerable: true,
  writable: true,
  value: async (...args: any[]) => {
    let [resource, config] = args;
    config = config || {};
    config.headers = config.headers || {};
    const token = localStorage.getItem('nexus_jwt');
    if (token) {
      if (config.headers instanceof Headers) {
        config.headers.set('Authorization', \`Bearer \${token}\`);
      } else {
        (config.headers as any)['Authorization'] = \`Bearer \${token}\`;
      }
    }
    return originalFetch(resource, config);
  }
});
`;
  content = content.substring(0, startIndex) + newPatch + content.substring(endIndex);
  fs.writeFileSync("src/main.tsx", content);
  console.log("Patched successfully");
} else {
  console.log("Could not find boundaries");
}
