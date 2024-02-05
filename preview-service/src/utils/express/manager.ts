import { MinIOClient } from '../minio/minioClient';

export default abstract class DefaultManager {
    public minioClient: MinIOClient;

    constructor(dbName: string) {
        this.minioClient = new MinIOClient(dbName);
    }
}
