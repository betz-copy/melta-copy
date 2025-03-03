import { Readable } from 'stream';

export interface UploadedFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    stream: Readable;
    destination?: string;
    buffer?: Buffer;
}
