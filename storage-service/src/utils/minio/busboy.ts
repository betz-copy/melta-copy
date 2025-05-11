/* eslint-disable consistent-return */
// middleware/busboyMiddleware.ts
import Busboy from 'busboy';
import { Request, Response, NextFunction } from 'express';
import { PassThrough } from 'stream';
import { UploadedFile } from '../../express/files/interface';

export const busboyMiddleware = (req: Request, _res: Response, next: NextFunction) => {
    if (!req.headers['content-type']?.startsWith('multipart/form-data')) return next();

    console.log('🟢 [BUSBOY] Entered middleware');

    const busboy = Busboy({ headers: req.headers, defCharset: 'utf8' });
    const files: UploadedFile[] = [];
    const fields: Record<string, unknown> = {};

    busboy.on('file', (fieldname, file, { filename, encoding, mimeType }) => {
        console.log('📦 [BUSBOY] Received file', filename);

        const passthrough = new PassThrough({
            highWaterMark: 600 * 1024 * 1024, // 500MB buffer size
        });
        let size = 0;

        // Handle file stream events
        file.on('data', (chunk) => {
            size += chunk.length;
            passthrough.write(chunk);
        });

        file.on('end', () => {
            console.log(`✅ [BUSBOY] Stream ended for ${filename}, total size: ${size} bytes`);
            passthrough.end();

            files.push({
                fieldname,
                originalname: filename,
                encoding,
                mimetype: mimeType,
                size,
                stream: passthrough,
            });
        });

        file.on('error', (err) => {
            console.error(`❌ [BUSBOY] Error processing file ${filename}:`, err);
            passthrough.destroy(err);
        });
    });

    busboy.on('field', (fieldname, value) => {
        console.log(`📝 [BUSBOY] Received field: ${fieldname} = ${value}`);
        fields[fieldname] = value;
    });

    busboy.on('finish', () => {
        console.log('✅ [BUSBOY] Busboy finished parsing form');
        req.body = fields;
        if (files.length) {
            console.log('🟢 [BUSBOY] Files processed:', files.length);
            req.files = files;
            console.log(`🟢 [BUSBOY] req.files populated with ${files.length} file(s)`);
        }
        next();
    });

    busboy.on('error', (err) => {
        console.error('❌ [BUSBOY] Error parsing form:', err);
        next(err);
    });

    console.log('🟢 [BUSBOY] Busboy initialized');
    console.log('🟢 [BUSBOY] req.files', req.files);

    req.pipe(busboy);
    console.log('🔄 [BUSBOY] Starting to pipe request to Busboy');
};
