import http from 'http';
import { Client } from 'minio';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import config from '../../config';
import { streamToBuffer } from '../fs';
import logger from '../logger/logsLogger';
import readExcelData from '../excel';
import { extractPptxText } from '../pptx';
import { FileTypes } from '../types';

const { url: endPoint, port, accessKey, secretKey, useSSL, transportAgent } = config.minio;

export class MinIOClient {
    private minioClient: Client;

    constructor(private bucketName: string) {
        this.minioClient = new Client({
            endPoint,
            port,
            useSSL,
            accessKey,
            secretKey,
            transportAgent: new http.Agent(transportAgent),
        });
    }

    private async wrapDBNotExistsError<T>(func: () => Promise<T>) {
        try {
            return func();
        } catch (err: any) {
            // Check if the error is caused by non-existing bucket
            if (err.code !== 'NoSuchBucket') throw err;

            // Create the bucket if it doesn't exist
            if (!(await this.bucketExists())) {
                await this.makeBucket();
                logger.info(`Bucket with name "${this.bucketName}" created successfully`);
            }

            // Retry
            return func();
        }
    }

    bucketExists() {
        return this.minioClient.bucketExists(this.bucketName);
    }

    makeBucket() {
        return this.minioClient.makeBucket(this.bucketName, '');
    }

    private downloadFileStream(filePath: string) {
        return this.wrapDBNotExistsError(() => this.minioClient.getObject(this.bucketName, filePath));
    }

    async readFile(filePath: string): Promise<string | undefined> {
        const fileStream = await this.downloadFileStream(filePath);
        const fileExtension = filePath.split('.').pop();

        switch (fileExtension) {
            case FileTypes.PDF: {
                const buffer = await streamToBuffer(fileStream);
                return (await pdf(buffer)).text;
            }
            case FileTypes.TXT: {
                const buffer = await streamToBuffer(fileStream);
                return buffer.toString();
            }
            case FileTypes.DOC:
            case FileTypes.DOCX: {
                const buffer = await streamToBuffer(fileStream);
                return (await mammoth.extractRawText({ buffer })).value;
            }
            case FileTypes.XLSX:
            case FileTypes.CSV: {
                return readExcelData(fileStream, fileExtension);
            }
            case FileTypes.PPTX: {
                const buffer = await streamToBuffer(fileStream);
                return extractPptxText(buffer);
            }
            default:
                return undefined;
        }
    }
}
