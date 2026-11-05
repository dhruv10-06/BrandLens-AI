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
  private static readonly MAX_EXTRACTED_CHARS = 200000;
  private static readonly PARSE_TIMEOUT_MS = 8000;

  /**
   * Verify actual file signatures (magic bytes) to prevent disguised binary uploads.
   */
  public static verifyFileSignature(buffer: Buffer, declaredType: 'pdf' | 'txt'): void {
    if (!buffer || buffer.length === 0) {
      throw new Error('File buffer is empty (0 bytes).');
    }

    if (declaredType === 'pdf') {
      // PDF must begin with %PDF- (0x25 0x50 0x44 0x46 0x2D)
      const header = buffer.subarray(0, 5).toString('ascii');
      if (!header.startsWith('%PDF-')) {
        throw new Error(
          'File signature verification failed: Uploaded file does not contain valid PDF magic bytes (%PDF-).'
        );
      }
    } else if (declaredType === 'txt') {
      // Check for executable / binary signatures disguised as TXT
      const b0 = buffer[0];
      const b1 = buffer[1];
      const b2 = buffer[2];
      const b3 = buffer[3];

      // MZ (DOS/Windows PE executable)
      if (b0 === 0x4d && b1 === 0x5a) {
        throw new Error('Security violation: Windows PE/Executable file detected in text upload.');
      }
      // \x7fELF (Linux ELF executable)
      if (b0 === 0x7f && b1 === 0x45 && b2 === 0x4c && b3 === 0x46) {
        throw new Error('Security violation: Linux ELF binary detected in text upload.');
      }
      // PK.. (Zip/Jar/Docx archive)
      if (b0 === 0x50 && b1 === 0x4b && b2 === 0x03 && b3 === 0x04) {
        throw new Error('Security violation: Compressed archive (ZIP/JAR) detected in text upload.');
      }

      // Check proportion of non-printable control characters
      let binaryByteCount = 0;
      const sampleLength = Math.min(buffer.length, 1024);
      for (let i = 0; i < sampleLength; i++) {
        const byte = buffer[i];
        // Allow newline (10), carriage return (13), tab (9), standard printable (32-126), and UTF-8 multibyte (> 127)
        if (byte < 9 || (byte > 10 && byte < 13) || (byte > 13 && byte < 32)) {
          binaryByteCount++;
        }
      }
      if (binaryByteCount / sampleLength > 0.05) {
        throw new Error('File content validation failed: TXT file contains excessive binary/non-text control bytes.');
      }
    }
  }

  /**
   * Extract plain text from PDF buffer or TXT buffer with timeout and signature checks.
   */
  public static async extractText(
    buffer: Buffer,
    fileType: 'pdf' | 'txt'
  ): Promise<ParsedDocumentResult> {
    // 1. Verify Magic Byte Signature First
    this.verifyFileSignature(buffer, fileType);

    let rawText = '';
    let pageCount: number | undefined;

    if (fileType === 'pdf') {
      try {
        // Execute PDF parsing with strict timeout protection against decompression bombs / hang
        const parsePromise = pdfParse(buffer, {
          max: 100, // Limit max pages to prevent memory exhaustion
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('PDF extraction timed out after 8 seconds (possible malformed or complex PDF).')),
            this.PARSE_TIMEOUT_MS
          )
        );

        const pdfData: any = await Promise.race([parsePromise, timeoutPromise]);
        rawText = pdfData.text || '';
        pageCount = pdfData.numpages;
      } catch (err: any) {
        throw new Error(`Failed to parse PDF document: ${err.message || 'File is corrupted, invalid or password-protected.'}`);
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

    if (cleanedText.length > this.MAX_EXTRACTED_CHARS) {
      console.warn(`[DocumentParserService] Truncating oversized document from ${cleanedText.length} to ${this.MAX_EXTRACTED_CHARS} chars.`);
      return {
        text: cleanedText.slice(0, this.MAX_EXTRACTED_CHARS),
        charCount: this.MAX_EXTRACTED_CHARS,
        pageCount,
      };
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
