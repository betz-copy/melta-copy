import * as libreoffice from 'libreoffice-convert';
import { Readable } from 'stream';
import { promisify } from 'util';
import { menash } from 'menashmq';
import { streamToBuffer } from '../../utils/fs';
import { minioClient } from '../../utils/minio/minioClient';
import { config } from '../../config';
import { ServiceError } from '../error';
import { StatusCodes } from 'http-status-codes';

const { rabbit, document } = config;

const libreConvert = promisify(libreoffice.convert);
export class FilesManager {
    static async getFilePreview(filePath: string, contentType: string) {
        const pdfFileName =
            contentType !== 'document' ? filePath : `${document.previewPrefix}${filePath.replace(/\.[^/.]+$/, '')}${document.previewFileType}`;
        try {
            const fileStream = await minioClient.downloadFileStream(pdfFileName);
            const fileBuffer = await streamToBuffer(fileStream);
            return Readable.from(fileBuffer);
        } catch (error: any) {
            if (error.code === 'NoSuchKey') {
                await menash.send(rabbit.previewQueue, filePath);
                throw new ServiceError(StatusCodes.NOT_FOUND, 'File Not Found');
            }
            throw error;
        }
    }

    static async createFilePreview(filePath: string) {
        const fileStream = await minioClient.downloadFileStream(filePath);
        const fileBuffer = await streamToBuffer(fileStream);
        const convertedBuffer = await libreConvert(fileBuffer, document.previewFileType, undefined);
        return Readable.from(convertedBuffer);
    }

    static async uploadFileToMinio(fileStream: Readable, newFileName: string) {
        await minioClient.uploadFileStream(fileStream, newFileName, {});
    }

    static async uploadFilePreview(originalFileName: string) {
        const pdfFileName = `${document.previewPrefix}${originalFileName.replace(/\.[^/.]+$/, '')}${document.previewFileType}`;
        const previewBuffer = await this.createFilePreview(originalFileName);
        const res = await this.uploadFileToMinio(previewBuffer as Readable, pdfFileName);
        return res;
    }
}
