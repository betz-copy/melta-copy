import * as http from 'http';
import { BucketItem, BucketItemStat, Client, CopyConditions } from 'minio';
import { Readable, Stream } from 'stream';
import { config } from '../../config';
import logger from '../logger/logsLogger';

const { url: endPoint, port, accessKey, secretKey, useSSL ,transportAgent } = config.minio;

export class MinIOClient {
    private minioClient: Client;

    private bucketName: string;

    constructor(bucketName: string) {
        this.bucketName = bucketName;

        this.minioClient = new Client({
            endPoint,
            port,
            useSSL,
            accessKey,
            secretKey,
            transportAgent: new http.Agent(transportAgent),
        });
    }

    private async wrapDBNotExistsError(func: () => Promise<any>) {
        try {
            return await func();
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

    statFile(filePath: string): Promise<BucketItemStat> {
        return this.wrapDBNotExistsError(this.minioClient.statObject.bind(this, this.bucketName, filePath));
    }

    getFilesList(recursive = false, prefix = '', startAfter = '') {
        this.wrapDBNotExistsError(() => {
            return new Promise((resolve, reject) => {
                const files: BucketItem[] = [];
                const stream = this.minioClient.listObjectsV2(this.bucketName, prefix, recursive, startAfter);

                stream.on('data', (file) => files.push(file));
                stream.on('error', (err) => reject(err));
                stream.on('end', () => resolve(files));
            });
        });
    }

    removeFile(filePath: string) {
        return this.wrapDBNotExistsError(this.minioClient.removeObject.bind(this, this.bucketName, filePath));
    }

    copyFile(sourceFilePath: string, destinationFilePath: string) {
        return this.wrapDBNotExistsError(
            this.minioClient.copyObject.bind(
                this,
                this.bucketName,
                destinationFilePath,
                `${this.bucketName}/${sourceFilePath}`,
                new CopyConditions(),
            ),
        );
    }

    removeFiles(filesNamesArray: string[]) {
        return this.wrapDBNotExistsError(this.minioClient.removeObjects.bind(this, this.bucketName, filesNamesArray));
    }

    getDownloadLink(filePath: string, expirationTime = 24 * 60 * 60) {
        return this.wrapDBNotExistsError(this.minioClient.presignedUrl.bind(this, 'GET', this.bucketName, filePath, expirationTime));
    }

    uploadFile(sourceFilePath: string, destinationFilePath: string, metaData = {}) {
        return this.wrapDBNotExistsError(
            this.minioClient.fPutObject.bind(this, this.bucketName, destinationFilePath, sourceFilePath, metaData),
        );
    }

    uploadFileStream(fileStream: string | Readable | Buffer, destinationFilePath: string, metaData = {}) {
        return this.wrapDBNotExistsError(this.minioClient.putObject.bind(this, this.bucketName, destinationFilePath, fileStream, metaData));
    }
}
