import { Request, Response } from 'express';
import { File } from 'multer';
import SemanticManager from './manager';

class SemanticController {
    static async summarize(req: Request, res: Response) {
        const files = req.files as File[];
        const maxLength = req.body?.maxLength ? parseInt(req.body.maxLength, 10) : 50;

        const result = await SemanticManager.summarizeFiles(files, maxLength);
        res.json({ summary: result });
    }
}

export default SemanticController;
