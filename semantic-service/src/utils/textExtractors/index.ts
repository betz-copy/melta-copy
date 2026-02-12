import { FileTypes } from '@packages/semantic-search';
import extractDocText from './doc';
import extractDocxText from './docx';
import readExcelData from './excel';
import extractPdfText from './pdf';
import { extractPptxText } from './pptx';

/**
 * Extracts text content from a file buffer based on file type.
 * @param buffer - The file content as a Buffer
 * @param fileType - The file type from FileTypes enum
 * @returns The extracted text content, or undefined if file type is not supported
 */
export const extractTextFromFile = async (buffer: Buffer, fileType: FileTypes): Promise<string> => {
    switch (fileType) {
        case FileTypes.PDF:
            return extractPdfText(buffer);
        case FileTypes.TXT:
            return buffer.toString();
        case FileTypes.DOCX:
            return extractDocxText(buffer);
        case FileTypes.DOC:
            return extractDocText(buffer);
        case FileTypes.XLSX:
        case FileTypes.CSV:
            return readExcelData(buffer, fileType);
        case FileTypes.PPTX:
            return extractPptxText(buffer);
        default:
            return '';
    }
};
