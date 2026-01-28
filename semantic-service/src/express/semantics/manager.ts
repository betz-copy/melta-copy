import { logger } from '@microservices/shared';
import path from 'path';
import config from '../../config';
import { extractTextFromDoc } from '../../utils/doc-extractor';
import { evaluateSummary, generateSummary, refineSummary, validateLanguage } from '../../utils/openai-client';
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
                    logger.warn(`Unsupported file type: ${ext}, skipping file: ${filename}`);
                    continue;
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

            if (config.summarization.enableEvaluation) {
                logger.info('Starting AI Evaluation pipeline (Iterative)...');

                let iteration = 0;
                let needsRefinement = true;
                const maxIterations = config.summarization.maxRefinementIterations;

                while (iteration < maxIterations && needsRefinement) {
                    iteration++;
                    logger.info(`Evaluation/Refinement Iteration ${iteration}/${maxIterations}`);

                    const [evaluation, validation] = await Promise.all([evaluateSummary(validText, summary), validateLanguage(summary)]);

                    const grades = evaluation.grades;
                    const averageGrade = (grades.accuracy + grades.completeness + grades.clarity) / 3;
                    const hasLowGrades = grades.accuracy < 3 || grades.completeness < 3 || grades.clarity < 3;
                    const hasHallucinations = evaluation.hallucinations.length > 0;

                    logger.info(
                        `Iteration ${iteration} - Grades: Acc=${grades.accuracy}, Comp=${grades.completeness}, Clar=${grades.clarity}. Avg=${averageGrade.toFixed(1)}`,
                    );
                    logger.info(`Iteration ${iteration} - Hallucinations: ${evaluation.hallucinations.length}`);
                    logger.info(`Iteration ${iteration} - Validation: Valid: ${validation.isValid}`);

                    if (averageGrade < 4 || hasLowGrades || hasHallucinations || !validation.isValid) {
                        logger.info(`Iteration ${iteration} - Refining summary based on feedback...`);
                        summary = await refineSummary(validText, summary, evaluation, validation);
                        logger.info(`Iteration ${iteration} - Refinement completed.`);
                        needsRefinement = true;
                    } else {
                        logger.info(`Iteration ${iteration} - Summary passed evaluation and validation.`);
                        needsRefinement = false;
                    }

                    if (iteration >= maxIterations && needsRefinement) {
                        logger.warn(`Max iterations (${maxIterations}) reached. Stopping refinement despite remaining issues.`);
                    }
                }
            }
        } else {
            logger.warn('No valid text to summarize.');
        }

        return {
            summary,
        };
    }
}

export default SemanticManager;
