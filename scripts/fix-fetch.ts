import fs from "fs";

let content = fs.readFileSync("src/main.tsx", "utf-8");

const oldPatch = `const originalFetch = window.fetch;window.fetch = async (...args) => {  let [resource, config] = args;  config = config || {};  config.headers = config.headers || {};  const token = localStorage.getItem('nexus_jwt');  if (token) {    if (config.headers instanceof Headers) {      config.headers.set('Authorization', \`Bearer \${token}\`);    } else {      (config.headers as any)['Authorization'] = \`Bearer \${token}\`;    }  }  return originalFetch(resource, config);};`;

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
});`;

content = content.replace(oldPatch, newPatch);

// In case the spacing doesn't exactly match string replacement due to previous cat output
if (content === fs.readFileSync("src/main.tsx", "utf-8")) {
    console.log("String replacement failed, using regex or substring...");
    // fallback regex replacement
    content = content.replace(/const originalFetch = window\.fetch;.*?;};/s, newPatch);
}

fs.writeFileSync("src/main.tsx", content);
