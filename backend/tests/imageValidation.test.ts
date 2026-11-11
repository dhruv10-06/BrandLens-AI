import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Organisation } from '../src/models/Organisation.js';
import { ContentSubmission } from '../src/models/ContentSubmission.js';
import {
  validateImageDimensions,
  getImageDimensions,
  extractImageBuffer,
  MIN_IMAGE_DIMENSION,
  MAX_IMAGE_FILE_SIZE,
} from '../src/utils/imageValidator.js';
import { VisualAnalysisService } from '../src/services/visualAnalysis.service.js';

// Helper to generate minimal valid PNG buffer with custom dimensions
function createTestPng(width: number, height: number): Buffer {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // CRC32 calculation table
  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c;
  }
  const calcCrc = (buf: Buffer) => {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  };

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 2; // Truecolor RGB
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  const ihdrType = Buffer.from('IHDR', 'ascii');
  const ihdrCrc = Buffer.alloc(4);
  ihdrCrc.writeUInt32BE(calcCrc(Buffer.concat([ihdrType, ihdrData])), 0);

  const ihdrChunk = Buffer.concat([
    Buffer.from([0x00, 0x00, 0x00, 0x0d]),
    ihdrType,
    ihdrData,
    ihdrCrc,
  ]);

  const iendChunk = Buffer.from([
    0x00, 0x00, 0x00, 0x00,
    0x49, 0x45, 0x4e, 0x44,
    0xae, 0x42, 0x60, 0x82,
  ]);

  return Buffer.concat([signature, ihdrChunk, iendChunk]);
}

// Helper to generate minimal JPEG buffer with custom dimensions
function createTestJpeg(width: number, height: number): Buffer {
  const soi = Buffer.from([0xff, 0xd8]);
  const sof0 = Buffer.alloc(19);
  sof0[0] = 0xff;
  sof0[1] = 0xc0;
  sof0[2] = 0x00;
  sof0[3] = 0x11;
  sof0[4] = 0x08;
  sof0.writeUInt16BE(height, 5);
  sof0.writeUInt16BE(width, 7);
  sof0[9] = 0x03;
  sof0[10] = 1; sof0[11] = 0x11; sof0[12] = 0;
  sof0[13] = 2; sof0[14] = 0x11; sof0[15] = 1;
  sof0[16] = 3; sof0[17] = 0x11; sof0[18] = 1;
  const eoi = Buffer.from([0xff, 0xd9]);
  return Buffer.concat([soi, sof0, eoi]);
}

// Helper to generate minimal GIF buffer with custom dimensions
function createTestGif(width: number, height: number): Buffer {
  const buf = Buffer.alloc(13);
  buf.write('GIF89a', 0, 'ascii');
  buf.writeUInt16LE(width, 6);
  buf.writeUInt16LE(height, 8);
  buf[10] = 0x80;
  return buf;
}

// Helper to generate minimal WebP buffer with custom dimensions
function createTestWebp(width: number, height: number): Buffer {
  const buf = Buffer.alloc(30);
  buf.write('RIFF', 0, 'ascii');
  buf.writeUInt32LE(22, 4);
  buf.write('WEBP', 8, 'ascii');
  buf.write('VP8X', 12, 'ascii');
  buf.writeUInt32LE(10, 16);
  buf.writeUInt32LE(0, 20);
  buf.writeUIntLE(width - 1, 24, 3);
  buf.writeUIntLE(height - 1, 27, 3);
  return buf;
}

const app = createApp();

describe('Creative Asset Minimum Image Dimension Validation (>= 32x32px)', () => {
  let creatorToken = '';
  let org: any;

  beforeAll(async () => {
    await connectDB();

    await Organisation.deleteMany({ slug: 'img-val-test-org' });
    await User.deleteMany({ email: 'imgval-creator@brandlens.io' });

    org = await Organisation.create({
      name: 'Image Validation Org',
      slug: 'img-val-test-org',
      brandVoiceSummary: 'Clear and consistent.',
      brandVisualRules: {
        primaryColors: ['#4F46E5', '#0F172A', '#FFFFFF'],
        secondaryColors: ['#10B981', '#6366F1'],
        prohibitedColors: ['#FF1493'],
        logoGuidelines: 'Top left corner placement.',
        typographyRules: 'Modern sans-serif typography.',
      },
    });

    const cRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Image Validator Creator',
        email: 'imgval-creator@brandlens.io',
        password: 'Password123!',
        orgSlug: 'img-val-test-org',
      });
    creatorToken = cRes.body.token;
  });

  afterAll(async () => {
    await Organisation.deleteMany({ slug: 'img-val-test-org' });
    await User.deleteMany({ email: 'imgval-creator@brandlens.io' });
    await ContentSubmission.deleteMany({ organizationId: org._id });
    await disconnectDB();
  });

  // ----------------------------------------------------
  // UNIT TESTS: Dimension Extraction & Validation
  // ----------------------------------------------------
  describe('Unit Tests: Binary Header Dimension Parsing', () => {
    it('1. should accept valid 100x100 PNG image', () => {
      const png = createTestPng(100, 100);
      const dataUrl = `data:image/png;base64,${png.toString('base64')}`;
      const result = validateImageDimensions(dataUrl);

      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
      expect(result.format).toBe('png');
    });

    it('2. should accept valid larger (800x600) image', () => {
      const png = createTestPng(800, 600);
      const dataUrl = `data:image/png;base64,${png.toString('base64')}`;
      const result = validateImageDimensions(dataUrl);

      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
    });

    it('should accept boundary 32x32 image', () => {
      const png = createTestPng(32, 32);
      const dataUrl = `data:image/png;base64,${png.toString('base64')}`;
      const result = validateImageDimensions(dataUrl);

      expect(result.width).toBe(32);
      expect(result.height).toBe(32);
    });

    it('3. should reject 1x1 image (< 32x32) with clear error message', () => {
      const png = createTestPng(1, 1);
      const dataUrl = `data:image/png;base64,${png.toString('base64')}`;

      expect(() => validateImageDimensions(dataUrl)).toThrowError(
        /Image dimensions \(1×1px\) do not meet the minimum requirement of 32×32 pixels/
      );
    });

    it('4. should reject 31x100 image (width < 32)', () => {
      const png = createTestPng(31, 100);
      const dataUrl = `data:image/png;base64,${png.toString('base64')}`;

      expect(() => validateImageDimensions(dataUrl)).toThrowError(
        /Image dimensions \(31×100px\) do not meet the minimum requirement of 32×32 pixels/
      );
    });

    it('5. should reject 100x31 image (height < 32)', () => {
      const png = createTestPng(100, 31);
      const dataUrl = `data:image/png;base64,${png.toString('base64')}`;

      expect(() => validateImageDimensions(dataUrl)).toThrowError(
        /Image dimensions \(100×31px\) do not meet the minimum requirement of 32×32 pixels/
      );
    });

    it('6. should reject corrupted image buffers safely', () => {
      // PNG header with truncated IHDR chunk
      const corruptedPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x05]);
      const dataUrl = `data:image/png;base64,${corruptedPng.toString('base64')}`;

      expect(() => validateImageDimensions(dataUrl)).toThrowError(
        /Corrupted PNG image/
      );

      // Truncated buffer < 8 bytes
      const tooSmall = Buffer.from([0x89, 0x50]);
      expect(() => validateImageDimensions(`data:image/png;base64,${tooSmall.toString('base64')}`)).toThrowError(
        /Buffer is too small/
      );
    });

    it('7. should reject unsupported format (plain text disguised as image)', () => {
      const textBuffer = Buffer.from('This is a plain text file, not a valid image.');
      const dataUrl = `data:image/png;base64,${textBuffer.toString('base64')}`;

      expect(() => validateImageDimensions(dataUrl)).toThrowError(
        /Unsupported image format/
      );
    });

    it('8. should enforce the 10MB file-size limit', () => {
      const validPng = createTestPng(100, 100);
      const dataUrl = `data:image/png;base64,${validPng.toString('base64')}`;

      // Simulate declared size exceeding 10MB
      expect(() =>
        validateImageDimensions(dataUrl, 'image/png', 11 * 1024 * 1024)
      ).toThrowError(/exceeds the maximum allowed limit of 10MB/);
    });

    it('should correctly parse and validate JPEG format', () => {
      const jpgValid = createTestJpeg(200, 150);
      const res = validateImageDimensions(`data:image/jpeg;base64,${jpgValid.toString('base64')}`);
      expect(res.width).toBe(200);
      expect(res.height).toBe(150);
      expect(res.format).toBe('jpeg');

      const jpgSmall = createTestJpeg(16, 16);
      expect(() =>
        validateImageDimensions(`data:image/jpeg;base64,${jpgSmall.toString('base64')}`)
      ).toThrowError(/Image dimensions \(16×16px\) do not meet the minimum requirement/);
    });

    it('should correctly parse and validate GIF format', () => {
      const gifValid = createTestGif(120, 120);
      const res = validateImageDimensions(`data:image/gif;base64,${gifValid.toString('base64')}`);
      expect(res.width).toBe(120);
      expect(res.height).toBe(120);
      expect(res.format).toBe('gif');

      const gifSmall = createTestGif(10, 10);
      expect(() =>
        validateImageDimensions(`data:image/gif;base64,${gifSmall.toString('base64')}`)
      ).toThrowError(/Image dimensions \(10×10px\) do not meet the minimum requirement/);
    });

    it('should correctly parse and validate WebP format', () => {
      const webpValid = createTestWebp(300, 200);
      const res = validateImageDimensions(`data:image/webp;base64,${webpValid.toString('base64')}`);
      expect(res.width).toBe(300);
      expect(res.height).toBe(200);
      expect(res.format).toBe('webp');

      const webpSmall = createTestWebp(20, 20);
      expect(() =>
        validateImageDimensions(`data:image/webp;base64,${webpSmall.toString('base64')}`)
      ).toThrowError(/Image dimensions \(20×20px\) do not meet the minimum requirement/);
    });

    it('should correctly parse and validate SVG format', () => {
      const svgValid = `<svg width="150" height="150" xmlns="http://www.w3.org/2000/svg"><rect fill="#4F46E5" width="150" height="150"/></svg>`;
      const res = validateImageDimensions(
        `data:image/svg+xml;base64,${Buffer.from(svgValid).toString('base64')}`
      );
      expect(res.width).toBe(150);
      expect(res.height).toBe(150);
      expect(res.format).toBe('svg');

      const svgSmall = `<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24"/></svg>`;
      expect(() =>
        validateImageDimensions(`data:image/svg+xml;base64,${Buffer.from(svgSmall).toString('base64')}`)
      ).toThrowError(/Image dimensions \(24×24px\) do not meet the minimum requirement/);
    });
  });

  // ----------------------------------------------------
  // DEFENSE-IN-DEPTH: VisualAnalysisService Direct Call
  // ----------------------------------------------------
  describe('Defense-in-depth: VisualAnalysisService.analyzeImage validation', () => {
    it('should reject sub-32x32 image before dispatching to AI provider', async () => {
      const tinyPng = createTestPng(1, 1);
      const tinyDataUrl = `data:image/png;base64,${tinyPng.toString('base64')}`;

      await expect(
        VisualAnalysisService.analyzeImage(tinyDataUrl, 'image/png', org, 'Test Tiny')
      ).rejects.toThrowError(/Image dimensions \(1×1px\) do not meet the minimum requirement of 32×32 pixels/);
    });

    it('should reject corrupted image buffer before dispatching to AI provider', async () => {
      const corrupted = 'data:image/png;base64,bm90LWFuLWltYWdl';

      await expect(
        VisualAnalysisService.analyzeImage(corrupted, 'image/png', org, 'Test Corrupt')
      ).rejects.toThrowError(/Unsupported image format/);
    });
  });

  // ----------------------------------------------------
  // INTEGRATION TESTS: HTTP API Endpoints
  // ----------------------------------------------------
  describe('HTTP API Validation: POST /api/submissions', () => {
    it('should return HTTP 400 when submitting a 1x1 image and not create a submission', async () => {
      const initialCount = await ContentSubmission.countDocuments();
      const png1x1 = createTestPng(1, 1);

      const res = await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({
          title: 'Degenerate Pixel Creative',
          contentType: 'advertisement',
          submissionFormat: 'image',
          visualAsset: {
            filename: 'tiny.png',
            fileType: 'image/png',
            fileSize: png1x1.length,
            dataUrl: `data:image/png;base64,${png1x1.toString('base64')}`,
          },
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Image dimensions (1×1px) do not meet the minimum requirement of 32×32 pixels');

      // Verify no orphaned submission was created
      const finalCount = await ContentSubmission.countDocuments();
      expect(finalCount).toBe(initialCount);
    });

    it('should return HTTP 400 when submitting a 31x100 image', async () => {
      const png31x100 = createTestPng(31, 100);

      const res = await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({
          title: 'Narrow Banner Creative',
          contentType: 'advertisement',
          submissionFormat: 'image',
          visualAsset: {
            filename: 'narrow.png',
            fileType: 'image/png',
            fileSize: png31x100.length,
            dataUrl: `data:image/png;base64,${png31x100.toString('base64')}`,
          },
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('31×100px');
    });

    it('should return HTTP 400 when submitting a corrupted image', async () => {
      const res = await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({
          title: 'Corrupted Creative',
          contentType: 'advertisement',
          submissionFormat: 'image',
          visualAsset: {
            filename: 'corrupted.png',
            fileType: 'image/png',
            fileSize: 100,
            dataUrl: 'data:image/png;base64,dGhpcyBpcyBub3QgYW4gaW1hZ2U=',
          },
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Unsupported image format');
    });

    it('should accept valid >=32x32 image (100x100 PNG) and proceed with submission', async () => {
      const png100 = createTestPng(100, 100);

      const res = await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({
          title: 'Valid Enterprise Banner',
          contentType: 'advertisement',
          submissionFormat: 'image',
          visualAsset: {
            filename: 'valid_banner.png',
            fileType: 'image/png',
            fileSize: png100.length,
            dataUrl: `data:image/png;base64,${png100.toString('base64')}`,
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.submission).toBeDefined();
      expect(res.body.submission.visualAsset.dimensions.width).toBe(100);
      expect(res.body.submission.visualAsset.dimensions.height).toBe(100);
    });

    it('should return HTTP 400 on reanalyze if attached creative is sub-32x32', async () => {
      // Create a submission directly in DB with a 1x1 image asset
      const png1x1 = createTestPng(1, 1);
      const sub = await ContentSubmission.create({
        organizationId: org._id,
        creatorId: (await User.findOne({ email: 'imgval-creator@brandlens.io' }))!._id,
        title: 'Direct Sub',
        contentType: 'advertisement',
        submissionFormat: 'image',
        originalContent: 'Direct test',
        currentContent: 'Direct test',
        status: 'draft',
        version: 1,
        contentHistory: [{ content: 'Direct test', modifiedAt: new Date() }],
        visualAsset: {
          filename: 'small.png',
          fileType: 'image/png',
          fileSize: png1x1.length,
          dataUrl: `data:image/png;base64,${png1x1.toString('base64')}`,
        },
      });

      const res = await request(app)
        .post(`/api/submissions/${sub._id}/reanalyze`)
        .set('Authorization', `Bearer ${creatorToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Image dimensions (1×1px) do not meet the minimum requirement of 32×32 pixels');
    });
  });
});
