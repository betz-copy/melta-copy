import * as libreoffice from 'libreoffice-convert';
import { Readable } from 'stream';
import { promisify } from 'util';
import { streamToBuffer } from '../../utils/fs';
import DefaultManagerMinio from '../../utils/minio/manager';

const libreConvert = promisify(libreoffice.convert);

export class FilesManager extends DefaultManagerMinio {
    async createFilePreview(filePath: string, needsConversion: boolean) {
        const fileStream = await this.minioClient.downloadFileStream(filePath);
        if (!needsConversion) return fileStream;

        const fileBuffer = await streamToBuffer(fileStream);
        return Readable.from(await libreConvert(fileBuffer, '.pdf', undefined));
    }
}
