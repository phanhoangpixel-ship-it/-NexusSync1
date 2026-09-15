const str = "2026-09-08 02:24:40";
let normalized = str.replace(' ', 'T');
if (!normalized.endsWith('Z') && !normalized.includes('+')) {
    normalized += 'Z';
}
console.log(normalized);
