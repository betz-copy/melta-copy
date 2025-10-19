import { logger } from '@microservices/shared';
import textract from 'textract';

const extractTextFromDoc = async (buffer: Buffer, mimeType: string = 'application/msword'): Promise<string> => {
    return new Promise((resolve, reject) => {
        textract.fromBufferWithMime(mimeType, buffer, (error, text) => {
            if (error) {
                logger.error('Error extracting text from doc', { error });

                return reject(error);
            }

            logger.info('Extracted text from doc', { text });

            return resolve(text);
        });
    });
};

export default extractTextFromDoc;
