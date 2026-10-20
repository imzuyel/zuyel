export interface ExtractedPage {
  pageNumber: number;
  text: string;
  isScanned: boolean;
}

export interface ExtractedDoc {
  pageCount: number;
  pages: ExtractedPage[];
  chunks: { chunkIndex: number; startPage: number; endPage: number; text: string }[];
  isScannedDoc: boolean;
}

export class PdfExtractor {
  /**
   * Processes the PDF Buffer, extracting pages and chunks.
   * If the PDF is scanned (contains no text or binary-only streams), detects it and flags OCR requirement.
   */
  static extractText(buffer: Buffer): ExtractedDoc {
    const textContent = buffer.toString("binary");
    
    // Simple page count heuristic: Count /Type /Page occurrences (case insensitive)
    const pageMatches = textContent.match(/\/Type\s*\/Page\b/gi);
    let pageCount = pageMatches ? pageMatches.length : 1;
    if (pageCount === 0) pageCount = 1;

    // Separate text by page boundaries or estimate chunks
    const pages: ExtractedPage[] = [];
    let totalTextLength = 0;

    // Regular expression to extract text blocks in PDFs: (String) or <Hex>
    const textGroupRegex = /\(([^)]+)\)/g;

    for (let p = 1; p <= pageCount; p++) {
      // Extract segment corresponding to estimated page slice
      const startIdx = Math.floor((p - 1) * (textContent.length / pageCount));
      const endIdx = Math.floor(p * (textContent.length / pageCount));
      const pageSlice = textContent.slice(startIdx, endIdx);

      let extractedPageText = "";
      let match;
      
      // Attempt to extract text from PDF string groups
      while ((match = textGroupRegex.exec(pageSlice)) !== null && extractedPageText.length < 3000) {
        const textValue = match[1].replace(/\\([0-7]{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
                                 .replace(/\\(.)/g, "$1")
                                 .trim();
        
        // Exclude internal PDF layout codes, fonts, and binary noise
        if (textValue.length > 2 && !textValue.startsWith("/") && !/^[a-zA-Z0-9+\/=]{15,}$/.test(textValue)) {
          extractedPageText += textValue + " ";
        }
      }

      // Clean up spacing and symbols
      extractedPageText = extractedPageText
        .replace(/\s+/g, " ")
        .replace(/[^\x20-\x7E\u0980-\u09FF]/g, " ") // Keep basic printable ASCII and Bengali character sets
        .trim();

      // If we got very little text, check for fallback mock based on filenames in seed, or mark as scanned
      const isScanned = extractedPageText.trim().length < 15;
      
      pages.push({
        pageNumber: p,
        text: isScanned ? "" : extractedPageText,
        isScanned,
      });

      if (!isScanned) {
        totalTextLength += extractedPageText.length;
      }
    }

    // Determine if entire document is scanned
    const isScannedDoc = totalTextLength < 30;

    // If it's a test file or uploaded empty file, provide a clean mock generator for educational realism if we are in local sandbox
    // but strictly mark scanned files as failed to fulfill OCR-requirements
    
    // Segment into manageable chunks
    const chunks: { chunkIndex: number; startPage: number; endPage: number; text: string }[] = [];
    let chunkIndex = 1;
    let currentChunkText = "";
    let chunkStartPage = 1;

    for (const page of pages) {
      if (page.isScanned) continue;
      
      if (currentChunkText.length + page.text.length > 1000) {
        if (currentChunkText) {
          chunks.push({
            chunkIndex,
            startPage: chunkStartPage,
            endPage: page.pageNumber - 1,
            text: currentChunkText.trim(),
          });
          chunkIndex++;
        }
        currentChunkText = page.text + " ";
        chunkStartPage = page.pageNumber;
      } else {
        currentChunkText += page.text + " ";
      }
    }

    if (currentChunkText.trim()) {
      chunks.push({
        chunkIndex,
        startPage: chunkStartPage,
        endPage: pageCount,
        text: currentChunkText.trim(),
      });
    }

    return {
      pageCount,
      pages,
      chunks,
      isScannedDoc,
    };
  }
}
