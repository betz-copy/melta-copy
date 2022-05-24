import { callbackify } from 'util';
import { Request } from 'express';
import * as uuid from 'uuid';
import * as Multer from 'multer';
import { MinIOClient, minioClient } from './minioClient';

const generatePath = () => {
    return uuid.v4();
};
class MinioStorage {
    private client: MinIOClient;

    constructor(client: MinIOClient) {
        this.client = client;
    }

    async handleFile(_req: Request, file: Express.Multer.File) {
        let path = generatePath();
        path = path.split('-').join('') + file.originalname;

        await this.client.uploadFileStream(file.stream, path);
        return { ...(await this.client.statFile(path)), path };
    }

    public _handleFile = callbackify((req: Request, file: Express.Multer.File) => this.handleFile(req, file));

    async removeFile(_req: Request, file: Express.Multer.File) {
        await this.client.removeFile(file.path);
    }

    public _removeFile = callbackify((req: Request, file: Express.Multer.File) => this.removeFile(req, file));
}

export const UploadToMinio = (fileKeyName: string) => {
    return Multer({ storage: new MinioStorage(minioClient) }).single(fileKeyName);
};

export const UploadBulkToMinio = (filesKeyName: string) => {
    return Multer({ storage: new MinioStorage(minioClient) }).array(filesKeyName);
};
