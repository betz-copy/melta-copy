import * as express from 'express';
import { FilesManager } from './manager';

export class FilesController {
    static async downloadFile(req: express.Request, res: express.Response) {
        const { path } = req.params;
        const stream = await FilesManager.downloadFile(path.toString());

        const fileStats = await FilesManager.fileStat(path.toString());
        res.setHeader('Content-Type', fileStats.metaData['content-type']);

        stream.pipe(res);
    }

    static async uploadFile(req: express.Request, res: express.Response) {
        res.json(FilesManager.uploadFile(req.file));
    }

    static async uploadFiles(req: express.Request, res: express.Response) {
        res.json(FilesManager.uploadFiles(req.files as Express.Multer.File[]));
    }

    static async listFiles(_req: express.Request, res: express.Response) {
        res.json(await FilesManager.listFiles());
    }

    static async fileStat(req: express.Request, res: express.Response) {
        const { path } = req.params;
        res.json(await FilesManager.fileStat(path.toString()));
    }

    static async deleteFile(req: express.Request, res: express.Response) {
        const { path } = req.params;
        res.json(await FilesManager.deleteFile(path));
    }

    static async deleteFiles(req: express.Request, res: express.Response) {
        const { paths } = req.body;
        res.json(await FilesManager.deleteFiles(paths));
    }
}
