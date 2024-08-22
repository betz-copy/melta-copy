import * as archiver from 'archiver';
import * as express from 'express';
import DefaultController from '../../utils/express/controller';
import { getFileName } from '../../utils/generatePath';
import logger from '../../utils/logger/logsLogger';
import { FilesManager } from './manager';

export default class FilesController extends DefaultController<FilesManager> {
    constructor(dbName: string) {
        super(new FilesManager(dbName));
    }

    async downloadFile(req: express.Request, res: express.Response) {
        const { path } = req.params;
        const [stream, fileStats] = await Promise.all([this.manager.downloadFile(path.toString()), this.manager.fileStat(path.toString())]);

        res.setHeader('Content-Type', fileStats.metaData['content-type']);
        res.setHeader('Content-Disposition', `attachment; filename=${getFileName(path)}`);

        stream.pipe(res);
    }

    async downloadZip(req: express.Request, res: express.Response) {
        try {
            const { path } = req.params;
            const fileIds = path.split('?');
            const filesData = await this.manager.getFilesData(fileIds);

            const archive = archiver('zip', {
                zlib: { level: 9 },
            });

            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', `attachment; filename="filesZip${Date.now()}.zip"`);

            archive.pipe(res);

            // eslint-disable-next-line no-plusplus
            for (let i = 0; i < fileIds.length; i++) {
                const fileId = fileIds[i];
                const fileData = filesData[i];
                const fileName = fileId.toString().slice(32);
                archive.append(fileData, { name: fileName });
            }

            archive.finalize();
        } catch (error) {
            logger.error('Error downloading zip:', { error });
            res.status(500).send('Internal Server Error');
        }
    }

    async uploadFile(req: express.Request, res: express.Response) {
        res.json(this.manager.uploadFile(req.file));
    }

    async uploadFiles(req: express.Request, res: express.Response) {
        res.json(await this.manager.uploadFiles(req.files as Express.Multer.File[]));
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
