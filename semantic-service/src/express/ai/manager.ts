import path from 'node:path';
import { FileTypes } from '@packages/semantic-search';
import { logger } from '@packages/utils';
import config from '../../config';
import { NoFilesError } from '../../utils/errors';
import { evaluateSummary, generateSummary, refineSummary, validateLanguage } from '../../utils/openai-client';
import { extractTextFromFile } from '../../utils/textExtractors';

const { enableEvaluation, maxRefinementIterations } = config.summarization;

export class SemanticManager {
    static async readFilesAsText(files: Express.Multer.File[]): Promise<string> {
        if (!files?.length) throw new NoFilesError();

        const results = await Promise.all(
            files.map(async (file) => {
                const buffer = file.buffer;
                const filename = file.originalname;
                const ext = path.extname(filename).toLowerCase();
                const fileType = ext.slice(1) as FileTypes;

                try {
                    const text = await extractTextFromFile(buffer, fileType);

                    if (!text) {
                        logger.warn(`Unsupported file type: ${ext}, skipping file: ${filename}`);
                        return '';
                    }

                    return `\n\n--- Document: ${filename} ---\n${text}`;
                } catch (error) {
                    logger.error(`Extraction failed for file: ${filename}`, error);
                    return '';
                }
            }),
        );

        return results.join('').trim();
    }

    static async summarizeFiles(files: Express.Multer.File[], maxLength: number): Promise<string> {
        const validText = await SemanticManager.readFilesAsText(files);

        logger.info(`Valid text length: ${validText.length}`);

        let summary = 'No text extracted from files.';

        if (validText.length) {
            summary = await generateSummary(validText, maxLength);

            if (enableEvaluation) {
                let iteration = 0;
                let needsRefinement = true;

                while (iteration < maxRefinementIterations && needsRefinement) {
                    iteration++;
                    logger.info(`Evaluation/Refinement Iteration ${iteration}/${maxRefinementIterations}`);

                    const [evaluation, validation] = await Promise.all([evaluateSummary(validText, summary), validateLanguage(summary)]);

                    const grades = evaluation.grades;
                    const averageGrade = (grades.accuracy + grades.completeness + grades.clarity) / 3;
                    const hasLowGrades = grades.accuracy < 3 || grades.completeness < 3 || grades.clarity < 3;
                    const hasHallucinations = evaluation.hallucinations.length > 0;

                    logger.info(
                        `Iteration ${iteration} - Grades: Accuracy=${grades.accuracy}, Completeness=${grades.completeness}, Clarity=${grades.clarity}. Avg=${averageGrade.toFixed(1)}`,
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

                    if (iteration >= maxRefinementIterations && needsRefinement)
                        logger.warn(`Max iterations (${maxRefinementIterations}) reached. Stopping refinement despite remaining issues.`);
                }
            }
        } else logger.warn('No valid text to summarize.');

        return summary;
    }
}

export default SemanticManager;
