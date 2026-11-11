/**
 * Utility for robust, zero-dependency validation of creative image assets.
 * Validates actual binary headers for PNG, JPEG, GIF, WebP, SVG, and BMP.
 * Enforces minimum 32x32 resolution and 10MB file size limit.
 */

export interface ImageDimensions {
  width: number;
  height: number;
  format: 'png' | 'jpeg' | 'gif' | 'webp' | 'svg' | 'bmp';
}

export const MIN_IMAGE_DIMENSION = 32;
export const MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Extracts raw buffer from a base64 string or data URL.
 */
export function extractImageBuffer(dataUrlOrBase64: string): Buffer {
  if (!dataUrlOrBase64 || typeof dataUrlOrBase64 !== 'string') {
    throw new Error('Image data is missing or invalid.');
  }

  // Strip data URL prefix if present: data:image/...;base64,
  const cleanBase64 = dataUrlOrBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '').trim();
  if (!cleanBase64) {
    throw new Error('Image base64 content is empty.');
  }

  try {
    const buffer = Buffer.from(cleanBase64, 'base64');
    if (buffer.length === 0) {
      throw new Error('Decoded image buffer is empty (0 bytes).');
    }
    return buffer;
  } catch (err: any) {
    throw new Error(`Corrupted base64 image data: ${err.message}`);
  }
}

/**
 * Parses image binary headers to extract actual image dimensions and format.
 * Supports PNG, JPEG, GIF, WebP, SVG, and BMP without external native dependencies.
 */
export function getImageDimensions(
  buffer: Buffer,
  declaredDimensions?: { width?: number; height?: number }
): ImageDimensions {
  if (!buffer || buffer.length < 8) {
    throw new Error('Invalid or corrupted image: Buffer is too small to contain valid image headers.');
  }

  // 1. PNG check: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    if (buffer.length < 24) {
      throw new Error('Corrupted PNG image: IHDR chunk is missing or truncated.');
    }
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    return { width, height, format: 'png' };
  }

  // 2. JPEG check: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    let offset = 2;
    while (offset < buffer.length - 8) {
      if (buffer[offset] !== 0xff) {
        offset++;
        continue;
      }
      const marker = buffer[offset + 1];
      // Standalone markers without length: SOI (D8), EOI (D9), TEM (01), RST0-7 (D0-D7)
      if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
        offset += 2;
        continue;
      }

      if (offset + 4 > buffer.length) {
        break;
      }

      const length = buffer.readUInt16BE(offset + 2);
      if (length < 2) {
        throw new Error('Corrupted JPEG image: Invalid segment length.');
      }

      // SOF markers that define frame dimensions:
      // SOF0 (C0), SOF1 (C1), SOF2 (C2), SOF3 (C3), SOF5 (C5), SOF6 (C6), SOF7 (C7),
      // SOF9 (C9), SOF10 (CA), SOF11 (CB), SOF13 (CD), SOF14 (CE), SOF15 (CF)
      const isSofMarker =
        (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf);

      if (isSofMarker && offset + 8 < buffer.length) {
        const height = buffer.readUInt16BE(offset + 5);
        const width = buffer.readUInt16BE(offset + 7);
        return { width, height, format: 'jpeg' };
      }

      offset += 2 + length;
    }
    throw new Error('Corrupted JPEG image: SOF frame marker not found.');
  }

  // 3. GIF check: "GIF87a" or "GIF89a"
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38 &&
    (buffer[4] === 0x37 || buffer[4] === 0x39) &&
    buffer[5] === 0x61
  ) {
    if (buffer.length < 10) {
      throw new Error('Corrupted GIF image: Screen descriptor truncated.');
    }
    const width = buffer.readUInt16LE(6);
    const height = buffer.readUInt16LE(8);
    return { width, height, format: 'gif' };
  }

  // 4. WebP check: RIFF .... WEBP
  if (
    buffer.length >= 30 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    const chunkType = buffer.subarray(12, 16).toString('ascii');
    if (chunkType === 'VP8 ' && buffer.length >= 30) {
      const width = buffer.readUInt16LE(26) & 0x3fff;
      const height = buffer.readUInt16LE(28) & 0x3fff;
      return { width, height, format: 'webp' };
    }
    if (chunkType === 'VP8L' && buffer.length >= 25 && buffer[20] === 0x2f) {
      const b1 = buffer[21];
      const b2 = buffer[22];
      const b3 = buffer[23];
      const b4 = buffer[24];
      const width = 1 + (((b2 & 0x3f) << 8) | b1);
      const height = 1 + (((b4 & 0x0f) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6));
      return { width, height, format: 'webp' };
    }
    if (chunkType === 'VP8X' && buffer.length >= 30) {
      const width = 1 + buffer.readUIntLE(24, 3);
      const height = 1 + buffer.readUIntLE(27, 3);
      return { width, height, format: 'webp' };
    }
    throw new Error('Corrupted WebP image: Unsupported or truncated VP8 bitstream chunk.');
  }

  // 5. BMP check: BM (0x42 0x4D)
  if (buffer[0] === 0x42 && buffer[1] === 0x4d && buffer.length >= 26) {
    const width = buffer.readInt32LE(18);
    const height = Math.abs(buffer.readInt32LE(22));
    return { width, height, format: 'bmp' };
  }

  // 6. SVG check: starts with <svg or <?xml ... <svg
  const textPrefix = buffer.subarray(0, Math.min(buffer.length, 4096)).toString('utf-8');
  if (textPrefix.includes('<svg') || textPrefix.includes('<?xml')) {
    const widthMatch = textPrefix.match(/width=["'](\d+(?:\.\d+)?)(?:px|pt)?["']/i);
    const heightMatch = textPrefix.match(/height=["'](\d+(?:\.\d+)?)(?:px|pt)?["']/i);
    if (widthMatch && heightMatch) {
      return {
        width: Math.round(parseFloat(widthMatch[1])),
        height: Math.round(parseFloat(heightMatch[1])),
        format: 'svg',
      };
    }
    const viewBoxMatch = textPrefix.match(
      /viewBox=["']\s*[-+]?[\d.]+[,\s]+[-+]?[\d.]+[,\s]+([\d.]+)[,\s]+([\d.]+)\s*["']/i
    );
    if (viewBoxMatch) {
      return {
        width: Math.round(parseFloat(viewBoxMatch[1])),
        height: Math.round(parseFloat(viewBoxMatch[2])),
        format: 'svg',
      };
    }
    // Fallback: if caller provided valid dimensions for vector asset
    if (declaredDimensions?.width && declaredDimensions?.height) {
      return {
        width: declaredDimensions.width,
        height: declaredDimensions.height,
        format: 'svg',
      };
    }
    throw new Error('Invalid SVG creative: Unable to determine dimensions from width/height or viewBox.');
  }

  throw new Error(
    'Unsupported image format: Only approved image formats (PNG, JPEG, WebP, GIF, SVG) are accepted for visual brand compliance.'
  );
}

/**
 * Validates image dimensions, file size, format, and data integrity.
 * Throws an Error with a user-friendly message if validation fails.
 */
export function validateImageDimensions(
  dataUrlOrBase64: string,
  declaredFileType?: string,
  declaredFileSize?: number,
  declaredDimensions?: { width?: number; height?: number }
): ImageDimensions {
  const buffer = extractImageBuffer(dataUrlOrBase64);

  // 1. File size check (10MB limit)
  if (buffer.length > MAX_IMAGE_FILE_SIZE || (declaredFileSize && declaredFileSize > MAX_IMAGE_FILE_SIZE)) {
    const sizeMb = ((declaredFileSize || buffer.length) / (1024 * 1024)).toFixed(1);
    throw new Error(`Image size (${sizeMb}MB) exceeds the maximum allowed limit of 10MB.`);
  }

  // 2. Format & dimension extraction
  const dimensions = getImageDimensions(buffer, declaredDimensions);

  // 3. Minimum 32x32 resolution requirement
  if (dimensions.width < MIN_IMAGE_DIMENSION || dimensions.height < MIN_IMAGE_DIMENSION) {
    throw new Error(
      `Image dimensions (${dimensions.width}×${dimensions.height}px) do not meet the minimum requirement of ${MIN_IMAGE_DIMENSION}×${MIN_IMAGE_DIMENSION} pixels for visual brand compliance analysis.`
    );
  }

  return dimensions;
}

