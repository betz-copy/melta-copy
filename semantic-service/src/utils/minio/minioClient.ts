import http from 'node:http';
import { FileTypes, logger } from '@microservices/shared';
import mammoth from 'mammoth';
import { Client } from 'minio';
import pdf from 'pdf-parse';
import config from '../../config';
import { streamToBuffer } from '../fs';
import extractTextFromDoc from '../textExtractors/doc';
import readExcelData from '../textExtractors/excel';
import { extractPptxText } from '../textExtractors/pptx';

const { url: endPoint, port, accessKey, secretKey, useSSL, transportAgent } = config.minio;

class MinIOClient {
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
            case FileTypes.DOCX: {
                const buffer = await streamToBuffer(fileStream);
                return (await mammoth.extractRawText({ buffer })).value;
            }
            case FileTypes.DOC: {
                const buffer = await streamToBuffer(fileStream);
                return extractTextFromDoc(buffer);
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

export default MinIOClient;
