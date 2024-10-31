import { MinIOClient } from './minioClient';

export default abstract class DefaultManagerMinio {
    public minioClient: MinIOClient;

    constructor(protected bucketName: string) {
        console.log({ bucketName });

        this.minioClient = new MinIOClient(bucketName);
    }
}
