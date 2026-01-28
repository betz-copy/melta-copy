import { Request, Response } from 'express';
import SemanticManager from './manager';

class SemanticController {
    static async summarize(req: Request, res: Response) {
        const files = req.files as Express.Multer.File[];
        const maxLength = req.body?.maxLength ? parseInt(req.body.maxLength, 10) : 50;

        const result = await SemanticManager.summarizeFiles(files, maxLength);
        res.json(result);
    }
}

export default SemanticController;
