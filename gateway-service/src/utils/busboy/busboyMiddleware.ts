// busboyMiddleware.ts
import Busboy from 'busboy';
import { Request, Response, NextFunction } from 'express';
import { Readable } from 'stream';
import config from '../../config';
import { UploadedFile } from './interface';

declare global {
    namespace Express {
        interface Request {
            files?: UploadedFile[];
            parsedBody?: Record<string, string | string[]>;
        }
    }
}

export const busboyMiddleware = <T>(fileHandler: (body: Record<string, string | string[]>, file: Readable | undefined) => Promise<T>) => {
    return (req: Request, _res: Response, next: NextFunction) => {
        new Promise<T>((resolve, reject) => {
            req.on('error', (err) => {
                reject(new Error(`Error uploading file: ${err.message}`));
            });

            const { maxFileSize } = config.service;

            const busboy = Busboy({ headers: req.headers, limits: { files: 1, fileSize: maxFileSize } });

            let fileUpload: Promise<any> | undefined;

            const body: Record<string, string | string[]> = {};
            busboy.on('field', (field, val) => {
                if (body[field]) {
                    if (!Array.isArray(body[field])) body[field] = [body[field] as string];
                    (body[field] as string[]).push(val);
                } else {
                    body[field] = val;
                }
            });

            busboy.on('file', (field, file) => {
                if (field === 'file' && !fileUpload) {
                    fileUpload = fileHandler(body, file).catch(reject);
                } else {
                    file.resume();
                }
            });

            busboy.on('error', (err: Error) => {
                reject(new Error(`Error uploading file: ${err.message}`));
            });

            busboy.on('finish', () => {
                if (!fileUpload) {
                    resolve(fileHandler(body, undefined));
                } else {
                    fileUpload.then(resolve).catch(reject);
                }
            });

            req.pipe(busboy);
        })
            .then((result) => {
                req.parsedBody = result as any;
                next();
            })
            .catch((err) => {
                next(err);
            });
    };
};
