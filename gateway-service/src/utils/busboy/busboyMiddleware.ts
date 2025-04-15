/* eslint-disable consistent-return */
import { Request, Response, NextFunction } from 'express';
import Busboy from 'busboy';
import { PassThrough } from 'stream';
import ReadableStreamClone from 'readable-stream-clone';
import { UploadedFile } from './interface';

export const busboyMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.is('multipart/form-data')) return next();

    try {
        const busboy = Busboy({ headers: req.headers, defCharset: 'utf8' });
        const fields: Record<string, unknown> = {};
        const allFiles: UploadedFile[] = [];

        let singleFileField: UploadedFile | null = null;

        busboy.on('file', (fieldname, file, { encoding, filename, mimeType }) => {
            const copiedStream = new ReadableStreamClone(file);
            const passthrough = new PassThrough();
            file.pipe(passthrough);

            const validFileName = Buffer.from(filename, 'binary').toString('utf8');
            let size = 0;

            file.on('data', (data) => {
                size += data.length;
            });

            file.on('end', () => {
                const fileData: UploadedFile = {
                    fieldname,
                    originalname: validFileName,
                    encoding,
                    mimetype: mimeType,
                    stream: copiedStream,
                    size,
                };

                allFiles.push(fileData);

                if (fieldname === 'file') {
                    singleFileField = fileData;
                }
            });
        });

        busboy.on('field', (fieldname, val) => {
            fields[fieldname] = val;
        });

        busboy.on('finish', () => {
            req.body = fields;

            if (singleFileField) {
                req.file = singleFileField;
            }

            if (allFiles.length) {
                req.files = allFiles;
            }

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
