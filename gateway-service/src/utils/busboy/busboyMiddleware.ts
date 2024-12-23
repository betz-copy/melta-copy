import Busboy from 'busboy';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { Request, Response, NextFunction } from 'express';
import { UploadedFile } from './interface';

// eslint-disable-next-line consistent-return
export const busboyMiddleware = (req: Request, _res: Response, next: NextFunction) => {
    if (!req.headers['content-type'] || !req.headers['content-type'].startsWith('multipart/form-data')) {
        return next(new Error('Content-Type must be multipart/form-data'));
    }

    const busboy = Busboy({ headers: req.headers });
    const uploadedFiles: UploadedFile[] = [];
    const fields: { [key: string]: any } = {};

    let fileWritesInProgress = 0;
    let busboyFinished = false;

    busboy.on('file', (fieldname, file, { encoding, filename, mimeType: mimetype }) => {
        if (filename) {
            const tempFilePath = path.join(os.tmpdir(), `upload-${Date.now()}-${Math.random().toString(36).substring(7)}`);
            const writeStream = fs.createWriteStream(tempFilePath);
            let fileSize = 0;

            file.on('data', (data) => {
                fileSize += data.length;
            });

            fileWritesInProgress++;

            file.pipe(writeStream);

            writeStream.on('close', () => {
                const readableStream = fs.createReadStream(tempFilePath);
                uploadedFiles.push({
                    fieldname,
                    originalname: filename,
                    encoding,
                    mimetype,
                    path: tempFilePath,
                    size: fileSize,
                    stream: readableStream,
                });

                console.log(`File processed: ${filename}, Size: ${fileSize} bytes`);

                fileWritesInProgress--;

                if (fileWritesInProgress === 0 && busboyFinished) {
                    req.body = { ...req.body, ...fields, files: uploadedFiles };
                    console.log('All files uploaded:', uploadedFiles);
                    next();
                }
            });

            writeStream.on('error', (err) => {
                console.error('Write Stream Error:', err);
                return next(err);
            });
        } else {
            file.resume();
        }
    });

    busboy.on('field', (fieldName, value) => {
        fields[fieldName] = value;
        console.log(`Field [${fieldName}]: value: ${value}`);
    });

    busboy.on('finish', () => {
        busboyFinished = true;
        console.log('Busboy finished processing');
        if (fileWritesInProgress === 0) {
            req.body = { ...req.body, ...fields, files: uploadedFiles };
            console.log('All files uploaded (finish event):', uploadedFiles);
            next();
        }
    });

    busboy.on('error', (err) => {
        console.error('Busboy Error:', err);
        next(err);
    });

    req.pipe(busboy);
};
