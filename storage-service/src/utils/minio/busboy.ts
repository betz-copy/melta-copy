// middleware/busboyMiddleware.ts

import { PassThrough } from 'node:stream';
import { UploadedFile } from '@microservices/shared';
import Busboy from 'busboy';
import { NextFunction, Request, Response } from 'express';
import config from '../../config';

const busboyMiddleware = (req: Request, _res: Response, next: NextFunction) => {
    if (!req.headers['content-type']?.startsWith('multipart/form-data')) return next();

    const busboy = Busboy({ headers: req.headers, defCharset: 'utf8' });
    const files: UploadedFile[] = [];
    const fields: Record<string, unknown> = {};

    busboy.on('file', (fieldname, file, { filename, encoding, mimeType }) => {
        const passthrough = new PassThrough({
            highWaterMark: config.service.highWaterMark,
        });
        let size = 0;
        const validFileName = Buffer.from(filename, 'binary').toString('utf8');

        file.on('data', (chunk) => {
            size += chunk.length;
            passthrough.write(chunk);
        });

        file.on('end', () => {
            passthrough.end();

            files.push({
                fieldname,
                originalname: validFileName,
                encoding,
                mimetype: mimeType,
                size,
                stream: passthrough,
            });
        });

        file.on('error', (err) => {
            passthrough.destroy(err);
        });
    });

    busboy.on('field', (fieldname, value) => {
        fields[fieldname] = value;
    });

    busboy.on('finish', () => {
        req.body = fields;
        if (files.length) {
            req.files = files;
        }
        next();
    });

    busboy.on('error', (err) => {
        next(err);
    });

    req.pipe(busboy);
};

export default busboyMiddleware;
