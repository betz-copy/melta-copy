import { BucketItem, BucketItemStat, Client, CopyConditions } from 'minio';
import { Readable, Stream } from 'stream';
import * as http from 'http';
import { config } from '../../config';

const { url: endPoint, port, accessKey, secretKey, useSSL, transportAgent } = config.minio;

export class MinIOClient {
    private static minioClient: Client;

    private static isInitialized: boolean = false;

    private bucketName: string;

    constructor(bucketName: string) {
        this.bucketName = bucketName;
        if (!MinIOClient.isInitialized) MinIOClient.initialize();
    }

    static initialize() {
        MinIOClient.minioClient = new Client({
            endPoint,
            port,
            useSSL,
            accessKey,
            secretKey,
            transportAgent: new http.Agent(transportAgent),
        });

        MinIOClient.isInitialized = true;
    }

    private async wrapDBNotExistsError(func: () => Promise<any>) {
        try {
            return await func();
        } catch (err: any) {
            // Check if the error is caused by non-existing bucket
            if (err.code !== 'NoSuchBucket') throw err;

            // Create the bucket if it doesn't exist
            if (!(await MinIOClient.minioClient.bucketExists(this.bucketName))) {
                await MinIOClient.minioClient.makeBucket(this.bucketName, '');
                console.log(`Bucket with name "${this.bucketName}" created successfully`);
            }

            // Retry
            return func();
        }
    }

    downloadFileStream(filePath: string): Promise<Stream> {
        return this.wrapDBNotExistsError(MinIOClient.minioClient.getObject.bind(this, this.bucketName, filePath));
    }

    statFile(filePath: string): Promise<BucketItemStat> {
        return this.wrapDBNotExistsError(MinIOClient.minioClient.statObject.bind(this, this.bucketName, filePath));
    }

    getFilesList(recursive = false, prefix = '', startAfter = '') {
        this.wrapDBNotExistsError(() => {
            return new Promise((resolve, reject) => {
                const files: BucketItem[] = [];
                const stream = MinIOClient.minioClient.listObjectsV2(this.bucketName, prefix, recursive, startAfter);

                stream.on('data', (file) => files.push(file));
                stream.on('error', (err) => reject(err));
                stream.on('end', () => resolve(files));
            });
        });
    }

    removeFile(filePath: string) {
        return this.wrapDBNotExistsError(MinIOClient.minioClient.removeObject.bind(this, this.bucketName, filePath));
    }

    copyFile(sourceFilePath: string, destinationFilePath: string) {
        return this.wrapDBNotExistsError(
            MinIOClient.minioClient.copyObject.bind(
                this,
                this.bucketName,
                destinationFilePath,
                `${this.bucketName}/${sourceFilePath}`,
                new CopyConditions(),
            ),
        );
    }

    removeFiles(filesNamesArray: string[]) {
        return this.wrapDBNotExistsError(MinIOClient.minioClient.removeObjects.bind(this, this.bucketName, filesNamesArray));
    }

    getDownloadLink(filePath: string, expirationTime = 24 * 60 * 60) {
        return this.wrapDBNotExistsError(MinIOClient.minioClient.presignedUrl.bind(this, 'GET', this.bucketName, filePath, expirationTime));
    }

    uploadFile(sourceFilePath: string, destinationFilePath: string, metaData = {}) {
        return this.wrapDBNotExistsError(
            MinIOClient.minioClient.fPutObject.bind(this, this.bucketName, destinationFilePath, sourceFilePath, metaData),
        );
    }

    uploadFileStream(fileStream: string | Readable | Buffer, destinationFilePath: string, metaData = {}) {
        return this.wrapDBNotExistsError(MinIOClient.minioClient.putObject.bind(this, this.bucketName, destinationFilePath, fileStream, metaData));
    }
}
