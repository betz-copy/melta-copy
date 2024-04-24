import { MinIOClient } from './minioClient';

export default abstract class DefaultManagerMinio {
    public minioClient: MinIOClient;

    constructor(dbName: string) {
        this.minioClient = new MinIOClient(dbName);
    }
}
