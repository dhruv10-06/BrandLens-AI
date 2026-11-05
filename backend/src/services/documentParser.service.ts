import pdfParse from 'pdf-parse';

export interface ParsedDocumentResult {
  text: string;
  charCount: number;
  pageCount?: number;
}

export interface DocumentChunk {
  chunkIndex: number;
  content: string;
  charCount: number;
  title: string;
  category?: string;
  pageNumber?: number;
}

export class DocumentParserService {
  /**
   * Extract plain text from PDF buffer or TXT buffer.
   */
  public static async extractText(
    buffer: Buffer,
    fileType: 'pdf' | 'txt'
  ): Promise<ParsedDocumentResult> {
    if (!buffer || buffer.length === 0) {
      throw new Error('File buffer is empty.');
    }

    let rawText = '';
    let pageCount: number | undefined;

    if (fileType === 'pdf') {
      try {
        const pdfData = await pdfParse(buffer);
        rawText = pdfData.text || '';
        pageCount = pdfData.numpages;
      } catch (err: any) {
        throw new Error(`Failed to parse PDF document: ${err.message || 'File may be corrupted or password-protected.'}`);
      }
    } else if (fileType === 'txt') {
      try {
        rawText = buffer.toString('utf-8');
      } catch (err: any) {
        throw new Error(`Failed to read TXT document: ${err.message}`);
      }
    } else {
      throw new Error(`Unsupported file type: ${fileType}. Supported types are: pdf, txt.`);
    }

    // Clean and normalize text
    const cleanedText = this.sanitizeText(rawText);

    if (cleanedText.trim().length < 15) {
      throw new Error('Extracted text is empty or too short to contain meaningful brand guidelines.');
    }

    return {
      text: cleanedText,
      charCount: cleanedText.length,
      pageCount,
    };
  }

  /**
   * Sanitize text: remove null bytes, normalize linebreaks and spaces.
   */
  public static sanitizeText(text: string): string {
    return text
      .replace(/\0/g, '')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * Chunk text into semantically cohesive guideline sections.
   * Uses paragraph breaks, section headings, or sliding window chunks (~500 chars with 100 char overlap).
   */
  public static chunkDocument(
    fullText: string,
    documentTitle: string,
    targetChunkSize = 600,
    chunkOverlap = 100
  ): DocumentChunk[] {
    const paragraphs = fullText.split(/\n\s*\n/);
    const chunks: DocumentChunk[] = [];
    let currentBuffer = '';
    let chunkIndex = 0;

    for (const para of paragraphs) {
      const cleanPara = para.trim();
      if (!cleanPara) continue;

      if ((currentBuffer + '\n\n' + cleanPara).length > targetChunkSize && currentBuffer.length > 0) {
        // Push current chunk
        chunks.push({
          chunkIndex,
          content: currentBuffer.trim(),
          charCount: currentBuffer.trim().length,
          title: `${documentTitle} (Part ${chunkIndex + 1})`,
        });
        chunkIndex++;

        // Keep overlap if possible
        const words = currentBuffer.split(' ');
        const overlapWords = words.slice(Math.max(0, words.length - 20)).join(' ');
        currentBuffer = overlapWords + '\n\n' + cleanPara;
      } else {
        if (currentBuffer.length > 0) {
          currentBuffer += '\n\n' + cleanPara;
        } else {
          currentBuffer = cleanPara;
        }
      }
    }

    // Push trailing buffer
    if (currentBuffer.trim().length > 0) {
      chunks.push({
        chunkIndex,
        content: currentBuffer.trim(),
        charCount: currentBuffer.trim().length,
        title: `${documentTitle} (Part ${chunkIndex + 1})`,
      });
    }

    // Fallback if no chunks produced
    if (chunks.length === 0 && fullText.trim().length > 0) {
      chunks.push({
        chunkIndex: 0,
        content: fullText.trim(),
        charCount: fullText.trim().length,
        title: documentTitle,
      });
    }

    return chunks;
  }
}
