import * as minio from 'minio';
import * as http from 'http';
import { Readable } from 'stream';
import logger from '../logger';

export class MinIOClient {
    minioClient: minio.Client;

    bucketName: string;

    async initialize(
        endPoint: string,
        port: number,
        accessKey: string,
        secretKey: string,
        transportAgent: { timeout: number; maxSockets: number; keepAlive: boolean; keepAliveMsecs: number },
        bucketName = 'defaultbucket',
        useSSL = false,
    ) {
        this.minioClient = new minio.Client({ endPoint, port, useSSL, accessKey, secretKey, transportAgent: new http.Agent(transportAgent) });
        this.bucketName = bucketName;

        if (!(await this.minioClient.bucketExists(this.bucketName))) {
            await this.minioClient.makeBucket(this.bucketName, '');
            logger.info(`Bucket with name "${this.bucketName}" created successfully`);
        }
    }

    getFilesList(recursive = false, prefix = '', startAfter = '') {
        return new Promise((resolve, reject) => {
            const files: minio.BucketItem[] = [];
            const stream = this.minioClient.listObjectsV2(this.bucketName, prefix, recursive, startAfter);

            stream.on('data', (file) => files.push(file));
            stream.on('error', (err) => reject(err));
            stream.on('end', () => resolve(files));
        });
    }

    removeFile(filePath: string) {
        return this.minioClient.removeObject(this.bucketName, filePath);
    }

    copyFile(sourceFilePath: string, destinationFilePath: string) {
        return this.minioClient.copyObject(this.bucketName, destinationFilePath, `${this.bucketName}/${sourceFilePath}`, new minio.CopyConditions());
    }

    removeFiles(filesNamesArray: string[]) {
        return this.minioClient.removeObjects(this.bucketName, filesNamesArray);
    }

    getDownloadLink(filePath: string, expirationTime = 24 * 60 * 60) {
        return this.minioClient.presignedUrl('GET', this.bucketName, filePath, expirationTime);
    }

    uploadFile(sourceFilePath: string, destinationFilePath: string, metaData = {}) {
        return this.minioClient.fPutObject(this.bucketName, destinationFilePath, sourceFilePath, metaData);
    }

    uploadFileStream(fileStream: string | Readable | Buffer, destinationFilePath: string, metaData = {}) {
        return this.minioClient.putObject(this.bucketName, destinationFilePath, fileStream, metaData);
    }

    downloadFileStream(filePath: string) {
        return this.minioClient.getObject(this.bucketName, filePath);
    }

    statFile(filePath: string) {
        return this.minioClient.statObject(this.bucketName, filePath);
    }
}

const minioClient = new MinIOClient();
export { minioClient };
