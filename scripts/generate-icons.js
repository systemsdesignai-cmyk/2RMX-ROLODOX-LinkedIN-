import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Minimal PNG generator using Node.js built-in zlib
function createPNG(width, height, isMaskable = false) {
  // RGBA buffer with filter byte per scanline
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  const cx = width / 2;
  const cy = height / 2;
  const radius = width * (isMaskable ? 0.35 : 0.42);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background color: #09090b (9, 9, 11)
      let r = 9, g = 9, b = 11, a = 255;

      // Outer gradient glow / border
      if (dist <= radius + 6 && dist >= radius - 6) {
        // Electric Blue #007BFF
        const t = (x + y) / (width + height);
        r = Math.round(0 * (1 - t) + 0 * t);
        g = Math.round(123 * (1 - t) + 210 * t);
        b = Math.round(255);
      } else if (dist < radius - 6 && dist > radius * 0.45) {
        // Deep navy aura
        r = 14; g = 19; b = 35;
      } else if (dist <= radius * 0.45 && dist >= radius * 0.35) {
        // Central ring
        r = 0; g = 123; b = 255;
      } else if (dist < radius * 0.35) {
        // Center hub
        const subDist = Math.sqrt(dx * dx + (dy + radius * 0.08) * (dy + radius * 0.08));
        if (subDist < radius * 0.14) {
          // Head
          r = 0; g = 180; b = 255;
        } else if (dy > 0 && dy < radius * 0.25 && Math.abs(dx) < radius * 0.22) {
          // Body
          r = 0; g = 123; b = 255;
        } else {
          r = 10; g = 14; b = 24;
        }
      }

      // Constellation node dots
      const nodes = [
        { x: cx - radius * 0.55, y: cy - radius * 0.45, r: 0, g: 210, b: 255, size: radius * 0.1 },
        { x: cx + radius * 0.55, y: cy - radius * 0.45, r: 0, g: 123, b: 255, size: radius * 0.1 },
        { x: cx - radius * 0.5, y: cy + radius * 0.48, r: 0, g: 123, b: 255, size: radius * 0.09 },
        { x: cx + radius * 0.5, y: cy + radius * 0.48, r: 0, g: 210, b: 255, size: radius * 0.09 },
      ];

      for (const node of nodes) {
        const ndx = x - node.x;
        const ndy = y - node.y;
        if (Math.sqrt(ndx * ndx + ndy * ndy) <= node.size) {
          r = node.r; g = node.g; b = node.b;
          break;
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG Header
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: RGBA
  ihdrData[10] = 0; // compression method
  ihdrData[11] = 0; // filter method
  ihdrData[12] = 0; // interlace method
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // IDAT Chunk
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND Chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  const crc = crc32(chunk.subarray(4, 8 + len));
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

// CRC32 implementation
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

const outDir = path.resolve('public');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Generate required PWA icons
fs.writeFileSync(path.join(outDir, 'pwa-192x192.png'), createPNG(192, 192, false));
fs.writeFileSync(path.join(outDir, 'pwa-512x512.png'), createPNG(512, 512, false));
fs.writeFileSync(path.join(outDir, 'pwa-maskable-512x512.png'), createPNG(512, 512, true));
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), createPNG(180, 180, false));
fs.writeFileSync(path.join(outDir, 'favicon.ico'), createPNG(64, 64, false));

console.log('Successfully generated PWA icon assets in /public');
