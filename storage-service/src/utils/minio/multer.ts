import { callbackify } from 'util';
import { Request } from 'express';
import Multer from 'multer';
import { MinIOClient, minioClient } from './minioClient';
import { generatePath } from '../generatePath';
import { config } from '../../config';

class MinioStorage {
    private client: MinIOClient;

    constructor(client: MinIOClient) {
        this.client = client;
    }

    async handleFile(_req: Request, file: Express.Multer.File) {
        const path = generatePath(file.originalname);

        await this.client.uploadFileStream(file.stream, path, { 'content-type': file.mimetype });
        return { ...(await this.client.statFile(path)), path };
    }

    public _handleFile = callbackify((req: Request, file: Express.Multer.File) => this.handleFile(req, file));

    async removeFile(_req: Request, file: Express.Multer.File) {
        await this.client.removeFile(file.path);
    }

    public _removeFile = callbackify((req: Request, file: Express.Multer.File) => this.removeFile(req, file));
}

export const UploadToMinio = (fileKeyName: string) => {
    return Multer({ storage: new MinioStorage(minioClient), limits: { fileSize: config.service.maxFileSize } }).single(fileKeyName);
};

export const UploadBulkToMinio = (filesKeyName: string) => {
    return Multer({ storage: new MinioStorage(minioClient), limits: { fileSize: config.service.maxFileSize } }).array(filesKeyName);
};
