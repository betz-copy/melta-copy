import * as libreoffice from 'libreoffice-convert';
import { Readable } from 'stream';
import { promisify } from 'util';
import DefaultManager from '../../utils/express/manager';
import { streamToBuffer } from '../../utils/fs';

const libreConvert = promisify(libreoffice.convert);

export class FilesManager extends DefaultManager {
    async createFilePreview(filePath: string, needsConversion: boolean) {
        const fileStream = await this.minioClient.downloadFileStream(filePath);
        if (!needsConversion) return fileStream;

        const fileBuffer = await streamToBuffer(fileStream);
        return Readable.from(await libreConvert(fileBuffer, '.pdf', undefined));
    }
}
