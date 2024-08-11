import { MinIOClient } from './minioClient';

export default abstract class DefaultManagerMinio {
    public minioClient: MinIOClient;

    constructor(protected workspaceId: string) {
        this.minioClient = new MinIOClient(workspaceId);
    }
}
