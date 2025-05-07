/* eslint-disable consistent-return */
// middleware/busboyMiddleware.ts
import Busboy from 'busboy';
import { Request, Response, NextFunction } from 'express';
import { PassThrough } from 'stream';
import { UploadedFile } from '../../express/files/interface';

export const busboyMiddleware = (req: Request, _res: Response, next: NextFunction) => {
    if (!req.headers['content-type']?.startsWith('multipart/form-data')) return next();

    console.log('🟢 [BUSBOY] Entered middleware');

    const busboy = Busboy({ headers: req.headers });
    const files: UploadedFile[] = [];
    const fields: Record<string, unknown> = {};

    busboy.on('file', (fieldname, file, { filename, encoding, mimeType }) => {
        console.log('📦 [BUSBOY] Received file', filename);

        const passthrough = new PassThrough();
        const chunks: Buffer[] = [];
        let size = 0;

        file.on('data', (chunk) => {
            chunks.push(chunk);
            size += chunk.length;
        });

        file.on('end', () => {
            console.log(`✅ [BUSBOY] Stream ended for ${filename}, total size: ${size} bytes`);
            passthrough.end(Buffer.concat(chunks));
        });

        files.push({
            fieldname,
            originalname: filename,
            encoding,
            mimetype: mimeType,
            size,
            stream: passthrough,
        });
    });

    busboy.on('field', (fieldname, value) => {
        console.log(`📝 [BUSBOY] Received field: ${fieldname} = ${value}`);
        fields[fieldname] = value;
    });

    busboy.on('finish', () => {
        console.log('✅ [BUSBOY] Busboy finished parsing form');
        req.body = fields;
        (req as any).files = files;
        next();
    });

    req.pipe(busboy);
    console.log('🔄 [BUSBOY] Starting to pipe request to Busboy');
};
