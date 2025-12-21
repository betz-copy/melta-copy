import { NotFoundError } from '@packages/utils';
import * as libreoffice from 'libreoffice-convert';
import { menash } from 'menashmq';
import { Readable } from 'stream';
import { promisify } from 'util';
import config from '../../config';
import { streamToBuffer } from '../../utils/fs';
import DefaultManagerMinio from '../../utils/minio/manager';

const {
    rabbit,
    document,
    service: { workspaceIdHeaderName },
} = config;

const libreConvert = promisify(libreoffice.convert);
class FilesManager extends DefaultManagerMinio {
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
                throw new NotFoundError('File Not Found');
            }

            throw error;
        }
    }

    async createFilePreview(filePath: string) {
        const fileStream = await this.minioClient.downloadFileStream(filePath);
        const fileBuffer = await streamToBuffer(fileStream);
        const convertedBuffer = await libreConvert(fileBuffer, document.previewFileType, undefined);

        return { previewBuffer: Readable.from(convertedBuffer), fileSize: convertedBuffer.length };
    }

    async uploadFileToMinio(fileStream: Readable, newFileName: string, fileSize: number) {
        await this.minioClient.uploadFileStream(fileStream, newFileName, fileSize, {});
    }

    async uploadFilePreview(originalFileName: string) {
        const pdfFileName = `${document.previewPrefix}${originalFileName.replace(/\.[^/.]+$/, '')}${document.previewFileType}`;
        const { previewBuffer, fileSize } = await this.createFilePreview(originalFileName);
        const res = await this.uploadFileToMinio(previewBuffer as Readable, pdfFileName, fileSize);

        return res;
    }
}

export default FilesManager;
