import { NextFunction, Request, Response } from 'express';
import * as Multer from 'multer';
import { callbackify } from 'util';
import { config } from '../../config';
import { ServiceError } from '../../express/error';
import { generatePath } from '../generatePath';
import DefaultManagerMinio from './manager';

const { fileKeyName, filesKeyName } = config.multer;

export class MinioStorage extends DefaultManagerMinio {
    async handleFile(req: Request, file: Express.Multer.File) {
        const { isUserProfileUpload } = req.body;
        let path: string;
        console.log(req.body, { isUserProfileUpload });

        if (isUserProfileUpload) {
            const { userId } = req.body;
            path = `users-profile/${userId}_profile.${file.mimetype.split('/')[1]}`;

            await this.globalBucketClient.uploadFileStream(file.stream, path, file.size, { 'content-type': file.mimetype });
        } else {
            path = generatePath(file.originalname);
            await this.minioClient.uploadFileStream(file.stream, path, file.size, { 'content-type': file.mimetype });
        }

        return { ...(await this.minioClient.statFile(path)), path };
    }

    public _handleFile = callbackify((req: Request, file: Express.Multer.File) => this.handleFile(req, file));

    async removeFile(_req: Request, file: Express.Multer.File) {
        await this.minioClient.removeFile(file.path);
    }

    public _removeFile = callbackify((req: Request, file: Express.Multer.File) => this.removeFile(req, file));
}
export class MinioMulter {
    private static async wrapMulterMiddleware(req: Request) {
        const workspaceId = req.headers[config.service.workspaceIdHeaderName];
        if (typeof workspaceId !== 'string') return null;

        const storage = new MinioStorage(workspaceId);

        if (!(await storage.minioClient.bucketExists())) await storage.minioClient.makeBucket();

        if (!(await storage.globalBucketClient.bucketExists())) await storage.globalBucketClient.makeBucket();

        return storage;
    }

    static async uploadBulkToMinio(req: Request, res: Response, next: NextFunction) {
        const storage = await MinioMulter.wrapMulterMiddleware(req);

        if (!storage) return next(new ServiceError(400, 'Invalid workspace id in header'));

        Multer({ storage, limits: { fileSize: config.service.maxFileSize } }).array(filesKeyName)(req, res, next);
    }

    static async uploadToMinio(req: Request, res: Response, next: NextFunction) {
        const storage = await MinioMulter.wrapMulterMiddleware(req);
        console.log('happy');

        if (!storage) return next(new ServiceError(400, 'Invalid workspace id in header'));

        Multer({ storage, limits: { fileSize: config.service.maxFileSize } }).single(fileKeyName)(req, res, next);
    }
}
