import { describe, it, expect } from 'vitest';
import { DocumentParserService } from '../src/services/documentParser.service.js';

describe('DocumentParserService', () => {
  it('should sanitize and clean text properly', () => {
    const dirty = 'Hello \0 World!   Multiple   spaces \r\n and \n\n\n linebreaks.';
    const sanitized = DocumentParserService.sanitizeText(dirty);
    expect(sanitized).not.toContain('\0');
    expect(sanitized).not.toContain('\r');
    expect(sanitized).toContain('Hello World!');
  });

  it('should extract text from TXT buffer successfully', async () => {
    const textContent = 'ApexFlow Brand Guidelines 2026. The official brand color is deep indigo. Always write ApexFlow Platform with capital P.';
    const buffer = Buffer.from(textContent, 'utf-8');

    const result = await DocumentParserService.extractText(buffer, 'txt');
    expect(result.text).toContain('ApexFlow Brand Guidelines 2026');
    expect(result.charCount).toBeGreaterThan(20);
  });

  it('should reject empty or whitespace-only documents', async () => {
    const emptyBuffer = Buffer.from('    \n\n  \t  ', 'utf-8');
    await expect(DocumentParserService.extractText(emptyBuffer, 'txt')).rejects.toThrow(
      'Extracted text is empty or too short'
    );
  });

  it('should chunk documents into meaningful cohesive chunks with overlap', () => {
    const longText = `
Section 1: Brand Principles.
ApexFlow represents security and high throughput. Our brand voice is authoritative and precise.

Section 2: Terminology Rules.
Always refer to the system as ApexFlow Platform. Never call it a bot or a simple script.

Section 3: Pricing and Claims.
Never describe our solution as cheap. We are cost-effective with high enterprise ROI.
    `.repeat(5);

    const chunks = DocumentParserService.chunkDocument(longText, 'ApexFlow Guidelines', 250, 40);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].chunkIndex).toBe(0);
    expect(chunks[0].content.length).toBeGreaterThan(50);
    expect(chunks[0].title).toContain('ApexFlow Guidelines');
  });
});
