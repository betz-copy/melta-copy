import { Readable } from 'stream';

export interface UploadedFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    stream: string | Readable | Buffer;
    destination?: string;
    buffer?: Buffer;
}
