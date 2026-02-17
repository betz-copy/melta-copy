import { Request, Response } from 'express';
import config from '../../config';
import SemanticManager from './manager';

const { defaultLength } = config.summarization;

class SemanticController {
    static async summarize(req: Request, res: Response) {
        const files = req.files as Express.Multer.File[];
        const maxLength = req.body?.maxLength ? Number(req.body.maxLength) : defaultLength;

        const result = await SemanticManager.summarizeFiles(files, maxLength);
        res.json({ summary: result });
    }
}

export default SemanticController;
