import * as libreoffice from 'libreoffice-convert';
import { Readable } from 'stream';
import { promisify } from 'util';
import { streamToBuffer } from '../../utils/fs';
import { minioClient } from '../../utils/minio/minioClient';

const libreConvert = promisify(libreoffice.convert);
export class FilesManager {
    static async createFilePreview(filePath: string, needsConversion: boolean) {
        const fileStream = await minioClient.downloadFileStream(filePath);
        if (!needsConversion) return fileStream;

        const fileBuffer = await streamToBuffer(fileStream);
        return Readable.from(await libreConvert(fileBuffer, '.pdf', undefined));
    }
}
