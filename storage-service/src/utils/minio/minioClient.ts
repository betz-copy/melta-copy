import * as http from 'node:http';
import { Readable } from 'node:stream';
import { logger } from '@packages/utils';
import { BucketItem, Client, CopyConditions } from 'minio';
import config from '../../config';

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
        } catch (err: unknown) {
            if (!(await this.bucketExists())) {
                await this.makeBucket().catch((error) => {
                    throw error;
                });
                logger.info(`Bucket with name "${this.bucketName}" created successfully`, { error: err });
            }

            return func();
        }
    }

    bucketExists() {
        return this.minioClient.bucketExists(this.bucketName);
    }

    makeBucket() {
        return this.minioClient.makeBucket(this.bucketName, '');
    }

    public async ensureBucket(): Promise<void> {
        const exists = await this.bucketExists();
        if (!exists) {
            await this.makeBucket();
            logger.info(`Bucket with name "${this.bucketName}" created successfully`);
        }
    }

    downloadFileStream(filePath: string) {
        return this.wrapDBNotExistsError(() => this.minioClient.getObject(this.bucketName, filePath));
    }

    statFile(filePath: string) {
        return this.wrapDBNotExistsError(() => this.minioClient.statObject(this.bucketName, filePath));
    }

    getFilesList(recursive = false, prefix = '', startAfter = '') {
        return this.wrapDBNotExistsError(() => {
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
        return this.wrapDBNotExistsError(() => this.minioClient.removeObject(this.bucketName, filePath));
    }

    copyFile(sourceFilePath: string, destinationFilePath: string) {
        return this.wrapDBNotExistsError(() =>
            this.minioClient.copyObject(this.bucketName, destinationFilePath, `${this.bucketName}/${sourceFilePath}`, new CopyConditions()),
        );
    }

    removeFiles(filesNamesArray: string[]) {
        return this.wrapDBNotExistsError(() => this.minioClient.removeObjects(this.bucketName, filesNamesArray));
    }

    getDownloadLink(filePath: string, expirationTime = 24 * 60 * 60) {
        return this.wrapDBNotExistsError(() => this.minioClient.presignedUrl('GET', this.bucketName, filePath, expirationTime));
    }

    uploadFile(sourceFilePath: string, destinationFilePath: string, metaData = {}) {
        return this.wrapDBNotExistsError(() => this.minioClient.fPutObject(this.bucketName, destinationFilePath, sourceFilePath, metaData));
    }

    uploadFileStream(fileStream: string | Readable | Buffer, destinationFilePath: string, size?: number, metaData = {}) {
        return this.wrapDBNotExistsError(() => {
            if (typeof fileStream === 'string' || Buffer.isBuffer(fileStream)) {
                if (typeof size !== 'number') {
                    throw new Error('Size must be provided for string or Buffer uploads.');
                }
                return this.minioClient.putObject(this.bucketName, destinationFilePath, fileStream, size, metaData);
            }

            fileStream.on('error', (err) => {
                console.error(`Error in fileStream to ${destinationFilePath}`, err);
            });

            return this.minioClient.putObject(this.bucketName, destinationFilePath, fileStream, size, metaData);
        });
    }
}

export default MinIOClient;
