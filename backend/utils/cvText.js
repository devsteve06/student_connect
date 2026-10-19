// utils/cvText.js
// -----------------------------------------------------------------------------
// Pulls plain text out of an uploaded CV file.
//
//   • PDF          -> pdf-parse (WASM-free build, runs in-process).
//   • text/* (.txt)-> read as UTF-8 directly.
//
// Scanned/image-only PDFs contain no text layer, so extraction returns an empty
// string; callers surface that as a "could not read" error rather than saving a
// blank CV. Nothing here touches disk — multer hands the parser a memory buffer.
// -----------------------------------------------------------------------------

import { PDFParse } from 'pdf-parse';

const PDF_NAME = /\.pdf$/i;
const TEXT_NAME = /\.(txt|md|markdown)$/i;

export function isPdfUpload({ filename = '', mimeType = '' } = {}) {
  return mimeType === 'application/pdf' || PDF_NAME.test(filename);
}

export function isTextUpload({ filename = '', mimeType = '' } = {}) {
  return (
    mimeType.startsWith('text/') ||
    mimeType === 'application/octet-stream' ||
    TEXT_NAME.test(filename)
  );
}

export async function extractCvText(buffer, { filename = '', mimeType = '' } = {}) {
  const type = (mimeType || '').toLowerCase();
  const isPdf = isPdfUpload({ filename, mimeType }) || type === 'application/x-pdf';
  if (isPdf) {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result?.text ?? '';
    } finally {
      // PDFParse keeps WASM/worker handles alive; release them promptly.
      await parser.destroy().catch(() => {});
    }
  }

  // Everything else is treated as a UTF-8 text file.
  return buffer.toString('utf8');
}
