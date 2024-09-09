import * as libreoffice from 'libreoffice-convert';
import { Readable } from 'stream';
import { promisify } from 'util';
import { menash } from 'menashmq';
import { streamToBuffer } from '../../utils/fs';
import { config } from '../../config';
import { ServiceError } from '../error';
import DefaultManagerMinio from '../../utils/minio/manager';

const {
    rabbit,
    document,
    service: { workspaceIdHeaderName },
} = config;

const libreConvert = promisify(libreoffice.convert);
export class FilesManager extends DefaultManagerMinio {
    async getFilePreview(filePath: string, contentType: string) {
        const pdfFileName =
            contentType !== 'document' ? filePath : `${document.previewPrefix}${filePath.replace(/\.[^/.]+$/, '')}${document.previewFileType}`;
        try {
            const fileStream = await this.minioClient.downloadFileStream(pdfFileName);
            const fileBuffer = await streamToBuffer(fileStream);
            return Readable.from(fileBuffer);
        } catch (error: any) {
            if (error.code === 'NoSuchKey') {
                await menash.send(rabbit.previewQueue, filePath, { headers: { [workspaceIdHeaderName]: this.workspaceId } });
                throw new ServiceError(404, 'File Not Found');
            }
            throw error;
        }
    }

    async createFilePreview(filePath: string) {
        const fileStream = await this.minioClient.downloadFileStream(filePath);
        const fileBuffer = await streamToBuffer(fileStream);
        const convertedBuffer = await libreConvert(fileBuffer, document.previewFileType, undefined);
        return Readable.from(convertedBuffer);
    }

    async uploadFileToMinio(fileStream: Readable, newFileName: string) {
        await this.minioClient.uploadFileStream(fileStream, newFileName, {});
    }

    async uploadFilePreview(originalFileName: string) {
        const pdfFileName = `${document.previewPrefix}${originalFileName.replace(/\.[^/.]+$/, '')}${document.previewFileType}`;
        const previewBuffer = await this.createFilePreview(originalFileName);
        const res = await this.uploadFileToMinio(previewBuffer as Readable, pdfFileName);
        return res;
    }
}
