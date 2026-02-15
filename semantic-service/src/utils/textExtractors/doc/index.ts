import { FileMimeType } from '@packages/semantic-search';
import { logger } from '@packages/utils';
import textract from 'textract';

const extractTextFromDoc = async (buffer: Buffer): Promise<string> => {
    return new Promise((resolve, reject) => {
        textract.fromBufferWithMime(FileMimeType.DOC, buffer, (error, text) => {
            if (error) {
                logger.error('Error extracting text from doc', { error });

                return reject(error);
            }

            return resolve(text);
        });
    });
};

export default extractTextFromDoc;
