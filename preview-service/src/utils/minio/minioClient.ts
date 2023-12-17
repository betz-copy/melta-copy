import * as minio from 'minio';

export class MinIOClient {
    minioClient: minio.Client;

    bucketName: string;

    async initialize(endPoint: string, port: number, accessKey: string, secretKey: string, bucketName = 'defaultbucket', useSSL = false) {
        this.minioClient = new minio.Client({
            endPoint,
            port,
            useSSL,
            accessKey,
            secretKey,
        });
        this.bucketName = bucketName;

        if (!(await this.minioClient.bucketExists(this.bucketName))) {
            await this.minioClient.makeBucket(this.bucketName, '');
            console.log(`Bucket with name "${this.bucketName}" created successfully`);
        }
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
