import * as express from 'express';
import { FilesManager } from './manager';

export class FilesController {
    static async downloadFile(req: express.Request, res: express.Response) {
        const { path } = req.params;
        const stream = await FilesManager.downloadFile(path.toString());
        stream.pipe(res);
    }

    static async uploadFile(req: express.Request, res: express.Response) {
        res.json(await FilesManager.uploadFile(req.file));
    }

    static async listFiles(_req: express.Request, res: express.Response) {
        res.json(await FilesManager.listFiles());
    }

    static async fileStat(req: express.Request, res: express.Response) {
        const { path } = req.params;
        res.json(await FilesManager.fileStat(path.toString()));
    }

    static async deleteFile(req: express.Request, res: express.Response){        
        const { path } = req.params;
        res.json(await FilesManager.deleteFile(path));

    }
}
