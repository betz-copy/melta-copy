import * as express from 'express';
import { FilesManager } from './manager';

export class FilesController {
    static async getFilePreview(req: express.Request, res: express.Response) {
        const { fileId } = req.params;
        const contentType = req.query.contentType as string;

        const resultStream = await FilesManager.getFilePreview(fileId, contentType);

        res.setHeader('Content-Type', 'application/pdf');

        resultStream.pipe(res);
    }
}
