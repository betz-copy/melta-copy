import * as http from 'node:http';
import { FileTypes } from '@packages/semantic-search';
import { logger, ServiceError } from '@packages/utils';
import { StatusCodes } from 'http-status-codes';
import { Client } from 'minio';
import config from '../../config';
import { streamToBuffer } from '../fs';
import { extractTextFromFile } from '../textExtractors';

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
            // biome-ignore lint/suspicious/noExplicitAny: error is any
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

    async readFile(filePath: string): Promise<string> {
        const fileStream = await this.downloadFileStream(filePath);
        const fileExtension = filePath.split('.').pop() as FileTypes | undefined;

        if (!fileExtension) throw new ServiceError(StatusCodes.NOT_FOUND, 'File extension not found');

        const buffer = await streamToBuffer(fileStream);
        return extractTextFromFile(buffer, fileExtension);
    }
}

export default MinIOClient;
