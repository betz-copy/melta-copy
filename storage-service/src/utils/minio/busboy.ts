import { Request, Response, NextFunction } from 'express';
import Busboy from 'busboy';
import { Readable } from 'stream';
import ReadableStreamClone from 'readable-stream-clone';
import { UploadedFile } from '../../express/files/interface';

export const busboyMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
    const busboy = Busboy({ headers: req.headers, defCharset: 'utf8' });
    const fields: Record<string, unknown> = {};
    const files: UploadedFile[] = [];

    busboy.on('file', (fieldname: string, file: Readable, { encoding, filename, mimeType }) => {
        let fileSize = 0;
        const copiedFileStream = new ReadableStreamClone(file);
        const validFileName = Buffer.from(filename, 'binary').toString('utf8');

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
            files.push(fileData);
        });
    });

    busboy.on('field', (fieldname: string, val: string) => {
        fields[fieldname] = val;
    });

    busboy.on('finish', () => {
        req.body = fields;

        if (files?.length > 1) req.files = files;
        else req.file = files?.[0];

        next();
    });

    busboy.on('error', (err: Error) => {
        next(err);
    });

    req.pipe(busboy);

    return undefined;
};
