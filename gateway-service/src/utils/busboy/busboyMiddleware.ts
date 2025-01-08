import { Request, Response, NextFunction } from 'express';
import Busboy from 'busboy';
import { Readable } from 'stream';
import ReadableStreamClone from 'readable-stream-clone';
import { UploadedFile } from './interface';
// import config from '../../config';

// const {
//     service: { uploadsFolderPath },
// } = config;

export const busboyMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.is('multipart/form-data')) {
        return next();
    }

    const busboy = Busboy({ headers: req.headers });
    const fields: Record<string, unknown> = {};
    const files: UploadedFile[] = [];

    busboy.on('file', (fieldname: string, file: Readable, { encoding, filename, mimeType }) => {
        const copiedFileStream = new ReadableStreamClone(file);

        let fileSize = 0;

        file.on('data', (data) => {
            fileSize += data.length;
        }).on('close', () => {
            const fileData: UploadedFile = {
                fieldname,
                originalname: filename,
                encoding,
                mimetype: mimeType,
                stream: copiedFileStream,
                size: fileSize,
            };
            files.push(fileData);
        });
    });

    busboy.on('field', (fieldname: string, val: string) => {
        fields[fieldname] = val;
    });

    busboy.on('finish', () => {
        req.body = fields;

        if (files?.length > 1) req.files = files;
        else {
            req.files = files;
            req.file = files?.[0];
        }

        next();
    });

    busboy.on('error', (err: Error) => {
        next(err);
    });

    req.pipe(busboy);

    return undefined;
};
