import fs from 'fs';
import zlib from 'zlib';

function createPngBuffer(width, height, colorGenerator) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // 8-bit depth
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10); // Deflate compression
  ihdrData.writeUInt8(0, 11); // Filter method 0
  ihdrData.writeUInt8(0, 12); // Interlace method 0

  function createChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(4 + 4 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    const crc = crc32(buf.subarray(4, 8 + len));
    buf.writeInt32BE(crc, 8 + len);
    return buf;
  }

  // Generate raw scanlines (filter byte 0 + RGBA)
  const rawData = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // None filter
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = colorGenerator(x, y, width, height);
      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const idatData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', idatData);
  const ihdrChunk = createChunk('IHDR', ihdrData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// CRC32 implementation
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return crc ^ -1;
}

function brandIconGenerator(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const cornerRadius = w * 0.22;

  // Squircle distance
  const dx = Math.max(0, Math.abs(x - cx) - (cx - cornerRadius));
  const dy = Math.max(0, Math.abs(y - cy) - (cy - cornerRadius));
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist > cornerRadius) {
    return [0, 0, 0, 0]; // Transparent outside
  }

  // Gradient background: from #2563eb (37, 99, 235) to #1e3a8a (30, 58, 138)
  const ratio = (x + y) / (w + h);
  let r = Math.round(37 + ratio * (30 - 37));
  let g = Math.round(99 + ratio * (58 - 99));
  let b = Math.round(235 + ratio * (138 - 235));
  let a = 255;

  // Central symbol / Diamond layers:
  const nx = (x - cx) / (w * 0.45);
  const ny = (y - cy) / (h * 0.45);
  const diamond = Math.abs(nx) + Math.abs(ny);

  if (diamond <= 0.75 && diamond >= 0.2) {
    // Middle / top layer
    const layer = (ny + 0.5);
    if (Math.abs(nx) * 1.5 + Math.abs(ny - 0.1) < 0.6) {
      // White top plate
      r = 255;
      g = 255;
      b = 255;
    } else if (Math.abs(nx) * 1.5 + Math.abs(ny + 0.2) < 0.65) {
      // Light blue middle plate
      r = 147;
      g = 197;
      b = 253;
    }
  }

  // Center node dot
  const centerDist = Math.sqrt(nx * nx + (ny - 0.1) * (ny - 0.1));
  if (centerDist < 0.12) {
    r = 37;
    g = 99;
    b = 235;
  }

  return [r, g, b, a];
}

const pwa192 = createPngBuffer(192, 192, brandIconGenerator);
fs.writeFileSync('public/pwa-192x192.png', pwa192);

const pwa512 = createPngBuffer(512, 512, brandIconGenerator);
fs.writeFileSync('public/pwa-512x512.png', pwa512);

const appleIcon = createPngBuffer(180, 180, brandIconGenerator);
fs.writeFileSync('public/apple-touch-icon.png', appleIcon);

console.log('Successfully generated public/pwa-192x192.png, public/pwa-512x512.png, public/apple-touch-icon.png');
