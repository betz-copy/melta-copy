import { ServiceError } from '@packages/utils';
import { StatusCodes } from 'http-status-codes';
import pdf from 'pdf-parse';

/**
 * Extracts text content from a PDF buffer.
 * @param buffer - The PDF file as a Buffer
 * @returns The extracted text content
 */
const extractTextFromPdf = async (buffer: Buffer): Promise<string> => {
    try {
        const data = await pdf(buffer);

        // Basic cleaning: normalize whitespace
        const cleanedText = data.text.replace(/\s+/g, ' ').trim();

        return cleanedText;
    } catch (error) {
        throw new ServiceError(StatusCodes.BAD_REQUEST, `Failed to extract text from PDF: ${error}`);
    }
};

export default extractTextFromPdf;
