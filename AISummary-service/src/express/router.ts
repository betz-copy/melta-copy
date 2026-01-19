import { logger } from '@microservices/shared';
import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import multer from 'multer';
import config from '../config';
import { generateSummary } from '../services/openai-client';
import { extractTextFromPdf, getPdfMetadata } from '../services/pdf-extractor';

const router = Router();

// Configure multer for file uploads (memory storage for processing)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: config.service.maxRequestSize,
    },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
        }
    },
});

// Async handler wrapper to catch errors
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// Main summarization endpoint
router.post(
    '/summarize',
    upload.array('files', 10),
    asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
        const files = req.files as Express.Multer.File[];

        if (!files || files.length === 0) {
            res.status(400).json({ error: 'No PDF files uploaded. Use form-data with key "files" (multiple allowed).' });
            return;
        }

        logger.info(`Processing ${files.length} PDF(s)`);

        // Extract text from all PDFs
        const extractionPromises = files.map(async (file) => {
            try {
                const text = await extractTextFromPdf(file.buffer);
                const metadata = await getPdfMetadata(file.buffer);
                return {
                    filename: file.originalname,
                    text: text,
                    pages: metadata.numPages,
                    success: true,
                };
            } catch (err) {
                logger.error(`Failed to parse ${file.originalname}:`, { error: err });
                return {
                    filename: file.originalname,
                    text: '',
                    pages: 0,
                    success: false,
                    error: err instanceof Error ? err.message : 'Unknown error',
                };
            }
        });

        const results = await Promise.all(extractionPromises);
        const successful = results.filter((r) => r.success && r.text.length > 0);

        if (successful.length === 0) {
            res.status(400).json({ error: 'Could not extract text from any of the uploaded files.' });
            return;
        }

        // Combine texts
        let combinedText = '';
        successful.forEach((doc, index) => {
            combinedText += `\n\n--- Document ${index + 1}: ${doc.filename} ---\n`;
            combinedText += doc.text;
        });

        logger.info(`Total extracted characters: ${combinedText.length}`);

        // Generate summary
        const startSummary = Date.now();
        const summary = await generateSummary(combinedText, 50);

        logger.info(`Generated summary in ${Date.now() - startSummary}ms`);

        res.json({
            success: true,
            fileCount: files.length,
            processedFiles: successful.map((f) => f.filename),
            totalPages: successful.reduce((acc, curr) => acc + curr.pages, 0),
            extractedChars: combinedText.length,
            summary: summary,
            model: config.openai.model,
        });
    }),
);

export default router;
