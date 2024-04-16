import * as express from 'express';
import { finished } from 'stream/promises';
import { FileExtensions } from './interface';
import { FilesManager } from './manager';

export class FilesController {
    static async createFilePreview(req: express.Request, res: express.Response) {
        const { fileId, needsConversion } = req.params;
        const { targetExtension } = req.query as { targetExtension: FileExtensions };

        const resultStream = await FilesManager.createFilePreview(fileId, Boolean(needsConversion), targetExtension);

        res.attachment();

        resultStream.pipe(res);

        await finished(res);
    }
}
