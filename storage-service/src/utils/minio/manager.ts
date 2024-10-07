import { MinIOClient } from './minioClient';

export default abstract class DefaultManagerMinio {
    public minioClient: MinIOClient;

    public globalBucketClient: MinIOClient;

    constructor(protected workspaceId: string) {
        this.minioClient = new MinIOClient(workspaceId);

        this.globalBucketClient = new MinIOClient('users-profile');
        console.log(this.globalBucketClient);
    }
}
