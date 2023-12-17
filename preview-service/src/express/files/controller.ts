import * as express from 'express';
import { finished } from 'stream/promises';
import { FilesManager } from './manager';

export class FilesController {
    static async createFilePreview(req: express.Request, res: express.Response) {
        const { fileId, needsConversion } = req.params;

        const resultStream = await FilesManager.createFilePreview(fileId, Boolean(needsConversion));

        res.attachment();

        resultStream.pipe(res);

        await finished(res);
    }
}
