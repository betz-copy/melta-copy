import * as express from 'express';
import { getFileName } from '../../utils/generatePath';
import { FilesManager } from './manager';
import * as archiver from 'archiver';
import logger from '../../utils/logger';

export class FilesController {
    static async downloadFile(req: express.Request, res: express.Response) {
        const { path } = req.params;
        const stream = await FilesManager.downloadFile(path.toString());
        const fileStats = await FilesManager.fileStat(path.toString());

        res.setHeader('Content-Type', fileStats.metaData['content-type']);
        res.setHeader('Content-Disposition', `attachment; filename=${getFileName(path)}`);

        stream.pipe(res);
    }

    static async downloadZip(req: express.Request, res: express.Response) {
        try {
            const { path } = req.params;
            const fileIds = path.split('?');
            const filesData = await FilesManager.getFilesData(fileIds);

            const archive = archiver('zip', {
                zlib: { level: 9 },
            });

            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', `attachment; filename="filesZip${Date.now()}.zip"`);

            archive.pipe(res);

            for (let i = 0; i < fileIds.length; i++) {
                const fileId = fileIds[i];
                const fileData = filesData[i];
                const fileName = fileId.toString().slice(32);
                archive.append(fileData, { name: fileName });
            }

            archive.finalize();
        } catch (error) {
            logger.error('Error downloading zip:', error);
            res.status(500).send('Internal Server Error');
        }
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

    static async duplicateFile(req: express.Request, res: express.Response) {
        const { path } = req.params;
        res.json(await FilesManager.duplicateFile(path));
    }

    static async duplicateFiles(req: express.Request, res: express.Response) {
        const { paths } = req.body;

        res.json(await FilesManager.duplicateFiles(paths));
    }

    static async fileStat(req: express.Request, res: express.Response) {
        const { path } = req.params;
        res.json(await FilesManager.fileStat(path));
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
