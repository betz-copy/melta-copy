import { BucketItemStat, Client } from 'minio';
import { Stream } from 'stream';
import { config } from '../../config';

const { url: endPoint, port, accessKey, secretKey, useSSL } = config.minio;

export class MinIOClient {
    private static minioClient: Client;

    private bucketName: string;

    constructor(bucketName: string) {
        this.bucketName = bucketName;
    }

    static async initialize() {
        MinIOClient.minioClient = new Client({
            endPoint,
            port,
            useSSL,
            accessKey,
            secretKey,
        });
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
}
