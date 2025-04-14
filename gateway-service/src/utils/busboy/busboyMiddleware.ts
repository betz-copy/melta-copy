/* eslint-disable consistent-return */
import { Request, Response, NextFunction } from 'express';
import Busboy from 'busboy';
// import { Readable } from 'stream';
import ReadableStreamClone from 'readable-stream-clone';
import { UploadedFile } from './interface';

export const busboyMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.is('multipart/form-data')) {
        return next();
    }
    try {
        const busboy = Busboy({ headers: req.headers, defCharset: 'utf8' });
        const fields: Record<string, unknown> = {};
        const files: UploadedFile[] = [];

        let iconFile: UploadedFile | null = null;

        busboy.on('file', (fieldname: string, file, { encoding, filename, mimeType }) => {
            const copiedFileStream = new ReadableStreamClone(file);
            const validFileName = Buffer.from(filename, 'binary').toString('utf8');
            let fileSize = 0;

            file.on('data', (data) => {
                fileSize += data.length;
            }).on('close', () => {
                const fileData: UploadedFile = {
                    fieldname,
                    originalname: validFileName,
                    encoding,
                    mimetype: mimeType,
                    stream: copiedFileStream,
                    size: fileSize,
                };

                if (fieldname === 'file') {
                    iconFile = fileData;
                } else if (fieldname === 'files') {
                    files.push(fileData);
                }
            });
        });

        busboy.on('field', (fieldname, val) => {
            fields[fieldname] = val;
        });

        busboy.on('finish', () => {
            req.body = fields;

            if (iconFile) req.file = iconFile;
            if (files.length) req.files = files;

            next();
        });

        busboy.on('error', (err) => {
            next(err);
        });

        req.pipe(busboy);
    } catch (err) {
        next(err);
    }
};
