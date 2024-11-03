import * as http from 'http';
import { Client } from 'minio';
import config from '../../config';

const { url: endPoint, port, accessKey, secretKey, useSSL, transportAgent } = config.minio;

export class MinIOClient {
    private minioClient: Client;

    constructor() {
        this.minioClient = new Client({
            endPoint,
            port,
            useSSL,
            accessKey,
            secretKey,
            transportAgent: new http.Agent(transportAgent),
        });
    }

    async readAllBuckets() {
        return this.minioClient.listBuckets();
    }

    async getBucketObjects(bucketName: string) {
        return this.minioClient.listObjects(bucketName);
    }
}
