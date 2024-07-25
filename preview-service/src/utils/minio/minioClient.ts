import * as minio from 'minio';
import { Readable, Stream } from 'stream';
import { config } from '../../config';
import logger from '../logger/logsLogger';

const { url: endPoint, port, accessKey, secretKey, useSSL } = config.minio;

export class MinIOClient {
    private minioClient: minio.Client;

    private bucketName: string;

    constructor(bucketName: string) {
        this.bucketName = bucketName;

        this.minioClient = new minio.Client({
            endPoint,
            port,
            useSSL,
            accessKey,
            secretKey,
        });
    }

    private async wrapDBNotExistsError(func: () => Promise<Stream>) {
        try {
            return func();
        } catch (err: any) {
            // Check if the error is caused by non-existing bucket
            if (err.code !== 'NoSuchBucket') throw err;

            // Create the bucket if it doesn't exist
            if (!(await this.minioClient.bucketExists(this.bucketName))) {
                await this.minioClient.makeBucket(this.bucketName, '');
                logger.info(`Bucket with name "${this.bucketName}" created successfully`);
            }

            // Retry
            return func();
        }
    }

    downloadFileStream(filePath: string): Promise<Stream> {
        return this.wrapDBNotExistsError(this.minioClient.getObject.bind(this, this.bucketName, filePath));
    }

    uploadFileStream(filePath: Readable, objectName: string, metaData = {}): Promise<Stream> {
        return this.wrapDBNotExistsError(this.minioClient.putObject.bind(this, this.bucketName, objectName, filePath, metaData));
    }

    statFile(filePath: string): Promise<Stream> {
        return this.wrapDBNotExistsError(this.minioClient.statObject.bind(this, this.bucketName, filePath));
    }
}
