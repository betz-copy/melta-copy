import { PassThrough } from 'node:stream';
import { UploadedFile } from '@microservices/shared';
import Busboy from 'busboy';
import { NextFunction, Request, Response } from 'express';
import ReadableStreamClone from 'readable-stream-clone';
import config from '../../config';

const busboyMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.is('multipart/form-data')) {
        next();
        return;
    }

    try {
        const busboy = Busboy({ headers: req.headers, defCharset: 'utf8' });
        const fields: Record<string, unknown> = {};
        const allFiles: UploadedFile[] = [];

        let singleFileField: UploadedFile | null = null;

        busboy.on('file', (fieldname, file, { encoding, filename, mimeType }) => {
            const copiedStream = new ReadableStreamClone(file);
            const passthrough = new PassThrough({
                highWaterMark: config.service.highWaterMark,
            });

            const validFileName = Buffer.from(filename, 'binary').toString('utf8');
            let size = 0;

            file.on('data', (data) => {
                size += data.length;
                const canContinue = passthrough.write(data);
                if (!canContinue) {
                    file.pause();
                }
            });

            passthrough.on('drain', () => {
                file.resume();
            });

            file.on('end', () => {
                passthrough.end();

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

            file.on('error', (err) => {
                passthrough.destroy(err);
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

export default busboyMiddleware;
