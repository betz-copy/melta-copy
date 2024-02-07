import * as express from 'express';
import DefaultController from '../../utils/express/controller';
import { getFileName } from '../../utils/generatePath';
import { FilesManager } from './manager';

export default class FilesController extends DefaultController<FilesManager> {
    constructor(dbName: string) {
        super(new FilesManager(dbName));
    }

    async downloadFile(req: express.Request, res: express.Response) {
        const { path } = req.params;
        const stream = await this.manager.downloadFile(path.toString());
        const fileStats = await this.manager.fileStat(path.toString());

        res.setHeader('Content-Type', fileStats.metaData['content-type']);
        res.setHeader('Content-Disposition', `attachment; filename=${getFileName(path)}`);

        stream.pipe(res);
    }

    async uploadFile(req: express.Request, res: express.Response) {
        res.json(this.manager.uploadFile(req.file));
    }

    async uploadFiles(req: express.Request, res: express.Response) {
        res.json(this.manager.uploadFiles(req.files as Express.Multer.File[]));
    }

    async listFiles(_req: express.Request, res: express.Response) {
        res.json(await this.manager.listFiles());
    }

    async duplicateFile(req: express.Request, res: express.Response) {
        const { path } = req.params;
        res.json(await this.manager.duplicateFile(path));
    }

    async duplicateFiles(req: express.Request, res: express.Response) {
        const { paths } = req.body;

        res.json(await this.manager.duplicateFiles(paths));
    }

    async fileStat(req: express.Request, res: express.Response) {
        const { path } = req.params;
        res.json(await this.manager.fileStat(path));
    }

    async deleteFile(req: express.Request, res: express.Response) {
        const { path } = req.params;
        res.json(await this.manager.deleteFile(path));
    }

    async deleteFiles(req: express.Request, res: express.Response) {
        const { paths } = req.body;
        res.json(await this.manager.deleteFiles(paths));
    }
}
