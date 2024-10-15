import * as http from 'http';
import { Client } from 'minio';
import config from '../../config';
import { streamToString } from '../fs';
import logger from '../logger/logsLogger';

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

    async readFile(filePath: string) {
        const fileStream = await this.downloadFileStream(filePath);
        return streamToString(fileStream);
    }
}
