import { Readable } from 'stream';

export interface UploadedFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    path: string;
    stream: string | Readable | Buffer;
    destination?: string;
    buffer?: Buffer;
}
