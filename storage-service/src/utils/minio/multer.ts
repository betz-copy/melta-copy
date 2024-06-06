import { Request, Response } from 'express';
import * as Multer from 'multer';
import { callbackify } from 'util';
import { config } from '../../config';
import DefaultController from '../express/controller';
import { generatePath } from '../generatePath';
import DefaultManagerMinio from './manager';

const { fileKeyName, filesKeyName } = config.multer;

class MinioStorage extends DefaultManagerMinio {
    async handleFile(_req: Request, file: Express.Multer.File) {
        const path = generatePath(file.originalname);

        await this.minioClient.uploadFileStream(file.stream, path, { 'content-type': file.mimetype });
        return { ...(await this.minioClient.statFile(path)), path };
    }

    public _handleFile = callbackify((req: Request, file: Express.Multer.File) => this.handleFile(req, file));

    async removeFile(_req: Request, file: Express.Multer.File) {
        await this.minioClient.removeFile(file.path);
    }

    public _removeFile = callbackify((req: Request, file: Express.Multer.File) => this.removeFile(req, file));
}

export class MinioMulter extends DefaultController<MinioStorage> {
    constructor(dbName: string) {
        super(new MinioStorage(dbName));
    }

    uploadToMinio(_req: Request, _res: Response) {
        return Multer({ storage: this.manager, limits: { fileSize: config.service.maxFileSize } }).single(fileKeyName);
    }

    uploadBulkToMinio(_req: Request, _res: Response) {
        return Multer({ storage: this.manager, limits: { fileSize: config.service.maxFileSize } }).array(filesKeyName);
    }
}
