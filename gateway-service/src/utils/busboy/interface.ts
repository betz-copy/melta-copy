import { Readable } from 'stream';

export interface UploadedFile {
    path: string;
    fieldName: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    stream: string | Readable | Buffer;
}
