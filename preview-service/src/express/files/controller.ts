import { Request, Response } from 'express';
import { finished } from 'stream/promises';
import DefaultController from '../../utils/express/controller';
import { FilesManager } from './manager';

export class FilesController extends DefaultController<FilesManager> {
    constructor(dbName: string) {
        super(new FilesManager(dbName));
    }

    async createFilePreview(req: Request, res: Response) {
        const { fileId, needsConversion } = req.params;

        const resultStream = await this.manager.createFilePreview(fileId, Boolean(needsConversion));

        res.attachment();

        resultStream.pipe(res);

        await finished(res);
    }
}
