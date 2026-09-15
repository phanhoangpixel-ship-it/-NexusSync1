import fs from "fs";

let content = fs.readFileSync("src/main.tsx", "utf-8");
const patch = `
const originalFetch = window.fetch;
window.fetch = async (...args) => {
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
};
`;
if (!content.includes('originalFetch')) {
  content = content.replace("ReactDOM.createRoot", patch + "\nReactDOM.createRoot");
  fs.writeFileSync("src/main.tsx", content);
}
