import { ServiceError } from '@microservices/shared';
import * as archiver from 'archiver';
import express from 'express';
import { StatusCodes } from 'http-status-codes';
import DefaultController from '../../utils/express/controller';
import { getFileName } from '../../utils/generatePath';
import FilesManager from './manager';

export default class FilesController extends DefaultController<FilesManager> {
    constructor(workspaceId: string) {
        super(new FilesManager(workspaceId));
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
            const fileIds = path.split(',');
            const filesData = await this.manager.getFilesData(fileIds);

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
            throw new ServiceError(undefined, 'Internal Server Error', { error });
        }
    }

    async uploadFile(req: express.Request, res: express.Response) {
        res.json(await this.manager.uploadFile(req.file ?? req.files![0]));
    }

    async uploadFiles(req: express.Request, res: express.Response) {
        res.json(await this.manager.uploadFiles(req.files ?? (req.file ? [req.file] : req.file)));
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

export const workspaceIdInHeader = async (req: express.Request, res: express.Response) => {
    const { workspaceId } = req.params;

    try {
        const filesController = new FilesController(workspaceId);

        if (req.originalUrl.includes('zip')) await filesController.downloadZip(req, res);
        else await filesController.downloadFile(req, res);
    } catch (error) {
        throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, 'Error in workspaceIdInHeader', error as Record<string, any>);
    }
};
