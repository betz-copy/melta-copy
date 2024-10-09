import { MinIOClient } from './minioClient';
// import { config } from '../../config/index';

// const { usersGlobalBucketName } = config.minio;
export default abstract class DefaultManagerMinio {
    public minioClient: MinIOClient;

    // public usersGlobalBucketClient: MinIOClient;

    constructor(protected workspaceId: string) {
        this.minioClient = new MinIOClient(workspaceId);

        // this.usersGlobalBucketClient = new MinIOClient(usersGlobalBucketName);
    }
}
