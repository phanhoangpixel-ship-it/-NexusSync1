const dateStr = "2026-09-08 02:24:40";
let str = String(dateStr);
if (str.includes('T') && !str.endsWith('Z') && !str.includes('+')) {
  str += 'Z';
}
console.log("Original string:", str);
let d = new Date(str);
console.log("Parsed Date:", d.toISOString());
console.log("Formatted:", d.toLocaleString('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
}));
