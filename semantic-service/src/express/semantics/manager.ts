import { logger } from '@microservices/shared';
import path from 'path';
import { extractTextFromDoc } from '../../utils/doc-extractor';
import { generateSummary } from '../../utils/openai-client';
import { extractTextFromPdf } from '../../utils/pdf-extractor';
import { NoFilesError } from './errors';
import { ISummarizeResult } from './interface';

export class SemanticManager {
    static async summarizeFiles(files: Express.Multer.File[], maxLength: number): Promise<ISummarizeResult> {
        if (!files || files.length === 0) {
            throw new NoFilesError();
        }

        let combinedText = '';

        for (const file of files) {
            const buffer = file.buffer;
            const filename = file.originalname;
            const ext = path.extname(filename).toLowerCase();

            logger.info(`Starting extraction for file: ${filename} (${ext})`);

            try {
                let text = '';

                if (ext === '.pdf') {
                    text = await extractTextFromPdf(buffer);
                } else if (ext === '.doc' || ext === '.docx') {
                    text = await extractTextFromDoc(buffer);
                } else {
                    throw new Error(`Unsupported file type: ${ext}`);
                }

                logger.info(`Extraction successful for file: ${filename}. Text Length: ${text.length}`);
                combinedText += `\n\n--- Document: ${filename} ---\n${text}`;
            } catch (error) {
                logger.error(`Extraction failed for file: ${filename}`, error);
            }
        }

        const validText = combinedText.trim();
        let summary = 'No text extracted from files.';

        if (validText.length > 0) {
            logger.info(`Generating summary for combined text. Length: ${validText.length}, MaxLength: ${maxLength}`);
            summary = await generateSummary(validText, maxLength);
            logger.info('Summary generation completed.');
        } else {
            logger.warn('No valid text to summarize.');
        }

        return {
            summary,
        };
    }
}

export default SemanticManager;
