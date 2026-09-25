import fs from 'fs';
import zlib from 'zlib';

function createPNG(width, height, isMaskable = false) {
  // RGBA buffer: width * height * 4
  const buffer = Buffer.alloc(width * height * 4);
  const cx = width / 2;
  const cy = height / 2;
  const radius = isMaskable ? width * 0.44 : width * 0.42;
  const cornerRadius = isMaskable ? 0 : width * 0.22;

  // Draw background and globe motif
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      // Squircle check if not maskable
      let inShape = true;
      if (!isMaskable) {
        const dx = Math.abs(x - cx);
        const dy = Math.abs(y - cy);
        const half = width / 2 - 8;
        if (dx > half || dy > half) {
          inShape = false;
        } else if (dx > half - cornerRadius && dy > half - cornerRadius) {
          const cornerDist = Math.hypot(dx - (half - cornerRadius), dy - (half - cornerRadius));
          if (cornerDist > cornerRadius) {
            inShape = false;
          }
        }
      }

      if (!inShape) {
        // Transparent
        buffer[idx] = 0;
        buffer[idx + 1] = 0;
        buffer[idx + 2] = 0;
        buffer[idx + 3] = 0;
        continue;
      }

      // Background gradient (Royal Blue to Deep Indigo)
      const gradT = (x + y) / (width + height);
      let r = Math.round(37 + (29 - 37) * gradT);
      let g = Math.round(99 + (78 - 99) * gradT);
      let b = Math.round(235 + (216 - 235) * gradT);
      let a = 255;

      // Distance from center
      const distFromCenter = Math.hypot(x - cx, y - cy);
      const globeR = width * (isMaskable ? 0.26 : 0.28);
      const strokeW = Math.max(2, width * 0.038);

      // Globe outer ring
      if (Math.abs(distFromCenter - globeR) < strokeW / 2) {
        r = 255; g = 255; b = 255;
      } else if (distFromCenter < globeR) {
        // Inside globe - longitude ellipse
        const normX = (x - cx) / (globeR * 0.45);
        const normY = (y - cy) / globeR;
        const ellipse1 = Math.hypot(normX, normY);
        if (Math.abs(ellipse1 - 1.0) < (strokeW / globeR) * 0.45) {
          r = 230; g = 240; b = 255;
        }

        // Latitude line (equator)
        const latNormX = (x - cx) / globeR;
        const latNormY = (y - cy) / (globeR * 0.42);
        const ellipse2 = Math.hypot(latNormX, latNormY);
        if (Math.abs(ellipse2 - 1.0) < (strokeW / globeR) * 0.42) {
          r = 230; g = 240; b = 255;
        }

        // Cross axes
        if (Math.abs(x - cx) < strokeW * 0.35 || Math.abs(y - cy) < strokeW * 0.35) {
          r = 210; g = 230; b = 255;
        }
      }

      // Star badge on bottom right
      const badgeX = cx + globeR * 0.7;
      const badgeY = cy + globeR * 0.7;
      const badgeDist = Math.hypot(x - badgeX, y - badgeY);
      const badgeR = width * 0.11;

      if (badgeDist < badgeR) {
        if (badgeDist > badgeR - strokeW * 0.4) {
          r = 255; g = 255; b = 255;
        } else {
          // Gold / Amber star badge
          r = 245; g = 158; b = 11;
          // Star center
          if (badgeDist < badgeR * 0.5) {
            r = 255; g = 255; b = 255;
          }
        }
      }

      buffer[idx] = r;
      buffer[idx + 1] = g;
      buffer[idx + 2] = b;
      buffer[idx + 3] = a;
    }
  }

  // Construct PNG file format
  return encodePNG(width, height, buffer);
}

function encodePNG(width, height, rgbaBuffer) {
  // Scanlines with filter byte 0 (None)
  const scanlineWidth = width * 4 + 1;
  const rawData = Buffer.alloc(height * scanlineWidth);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineWidth;
    rawData[rowOffset] = 0; // Filter: None
    rgbaBuffer.copy(rawData, rowOffset + 1, y * width * 4, (y + 1) * width * 4);
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: 6 (RGBA)
  ihdr[10] = 0; // Compression: deflate
  ihdr[11] = 0; // Filter: standard
  ihdr[12] = 0; // Interlace: none

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crcTarget = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = crc32(crcTarget);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

if (!fs.existsSync('./public')) {
  fs.mkdirSync('./public', { recursive: true });
}

fs.writeFileSync('./public/pwa-192x192.png', createPNG(192, 192, false));
fs.writeFileSync('./public/pwa-512x512.png', createPNG(512, 512, false));
fs.writeFileSync('./public/pwa-maskable-512x512.png', createPNG(512, 512, true));
fs.writeFileSync('./public/apple-touch-icon.png', createPNG(180, 180, false));
fs.writeFileSync('./public/favicon.ico', createPNG(32, 32, false));

console.log('Successfully generated all PWA icons in ./public');
