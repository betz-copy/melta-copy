import { logger } from '@packages/utils';
import * as minio from 'minio';
import { Readable } from 'stream';
import config from '../../config';

const { url: endPoint, port, accessKey, secretKey, useSSL } = config.minio;

class MinIOClient {
    private minioClient: minio.Client;

    constructor(private bucketName: string) {
        this.minioClient = new minio.Client({
            endPoint,
            port,
            useSSL,
            accessKey,
            secretKey,
        });
    }

    private async wrapDBNotExistsError<T>(func: () => Promise<T>) {
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

    downloadFileStream(filePath: string) {
        return this.wrapDBNotExistsError(() => this.minioClient.getObject(this.bucketName, filePath));
    }

    uploadFileStream(fileStream: Readable, destinationPath: string, size: number, meta = {}) {
        return this.minioClient.putObject(this.bucketName, destinationPath, fileStream, size, meta);
    }

    statFile(filePath: string) {
        return this.wrapDBNotExistsError(() => this.minioClient.statObject(this.bucketName, filePath));
    }
}

export default MinIOClient;
