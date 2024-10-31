import * as http from 'http';
import { BucketItem, Client, CopyConditions } from 'minio';
import { Readable } from 'stream';
import { config } from '../../config';
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
        console.log('eeeee', this.bucketName);
    }

    private async wrapDBNotExistsError<T>(func: () => Promise<T>) {
        try {
            return func();
        } catch (err: any) {
            if (!(await this.bucketExists())) {
                console.log('1');

                await this.makeBucket().catch((error) => {
                    throw error;
                });
                console.log('2');

                logger.info(`Bucket with name "${this.bucketName}" created successfully`);
            }

            return func();
        }
    }

    bucketExists() {
        console.log('checkkkkk');

        return this.minioClient.bucketExists(this.bucketName);
    }

    makeBucket() {
        console.log('createeee');

        return this.minioClient.makeBucket(this.bucketName, '');
    }

    downloadFileStream(filePath: string) {
        return this.wrapDBNotExistsError(() => this.minioClient.getObject(this.bucketName, filePath));
    }

    statFile(filePath: string) {
        return this.wrapDBNotExistsError(() => this.minioClient.statObject(this.bucketName, filePath));
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
        console.log('hereeee????');

        return this.wrapDBNotExistsError(() => this.minioClient.fPutObject(this.bucketName, destinationFilePath, sourceFilePath, metaData));
    }

    uploadFileStream(fileStream: string | Readable | Buffer, destinationFilePath: string, size: number, metaData = {}) {
        console.log('or herrrerererere');

        return this.wrapDBNotExistsError(() => this.minioClient.putObject(this.bucketName, destinationFilePath, fileStream, size, metaData));
    }
}
