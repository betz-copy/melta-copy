import { logger, ServiceError } from '@packages/utils';
import { StatusCodes } from 'http-status-codes';
import mammoth from 'mammoth';

const extractTextFromDocx = async (buffer: Buffer): Promise<string> => {
    try {
        logger.info('Extracting text from docx using mammoth');
        const result = await mammoth.extractRawText({ buffer });
        const text = result.value;
        logger.info('Extracted text from docx', { textLength: text.length });

        // Basic cleaning: normalize whitespace
        const cleanedText = text.replace(/\s+/g, ' ').trim();

        return cleanedText;
    } catch (error) {
        logger.error('Error extracting text from docx', { error });
        throw new ServiceError(
            StatusCodes.BAD_REQUEST,
            `Failed to extract text from DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
    }
};

export default extractTextFromDocx;
