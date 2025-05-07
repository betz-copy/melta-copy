/* eslint-disable consistent-return */
import { Request, Response, NextFunction } from 'express';
import Busboy from 'busboy';
import { PassThrough } from 'stream';
import { ReadableStreamClone } from 'readable-stream-clone';
import { UploadedFile } from './interface';

export const busboyMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
    console.log('🟢 [OG1] Entered busboyMiddleware');

    if (!req.is('multipart/form-data')) {
        console.log('🟡 [OG2] Not multipart/form-data, skipping middleware');
        return next();
    }

    try {
        const busboy = Busboy({ headers: req.headers, defCharset: 'utf8' });
        const fields: Record<string, unknown> = {};
        const allFiles: UploadedFile[] = [];

        let singleFileField: UploadedFile | null = null;

        console.log('🟢 [OG3] Busboy initialized');

        busboy.on('file', (fieldname, file, { encoding, filename, mimeType }) => {
            const copiedStream = new ReadableStreamClone(file);
            const passthrough = new PassThrough();
            file.pipe(passthrough);
            console.log(`📦 [OG4] Received file field: ${fieldname}, filename: ${filename}`);

            const validFileName = Buffer.from(filename, 'binary').toString('utf8');
            console.log(`🟢 [OG5] validFileName: ${validFileName}`);
            let size = 0;

            file.on('data', (data) => {
                size += data.length;
                console.log(`🔄 [OG6] Streaming chunk (${data.length} bytes)`);
            });

            file.on('end', () => {
                console.log(`✅ [OG7] File stream ended for: ${validFileName} (total size: ${size})`);
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
                    console.log('🟢 [OG8] singleFileField set');
                }
            });
        });

        busboy.on('field', (fieldname, val) => {
            console.log(`📝 [OG9] Received field: ${fieldname} = ${val}`);
            fields[fieldname] = val;
        });

        busboy.on('finish', () => {
            console.log('✅ [OG10] Busboy finished parsing');
            req.body = fields;

            if (singleFileField) {
                req.file = singleFileField;
                console.log('🟢 [OG11] req.file populated');
            }

            if (allFiles.length) {
                req.files = allFiles;
                console.log(`🟢 [OG12] req.files populated with ${allFiles.length} file(s)`);
            }

            next();
        });

        busboy.on('error', (err) => {
            console.error('❌ [OG13] Busboy error:', err);
            next(err);
        });

        console.log('🟢 [OG14] Piping request to busboy');
        req.pipe(busboy);
    } catch (err) {
        console.error('❌ [OG15] Middleware exception:', err);
        next(err);
    }
};
