import config from '../../config';
import MinIOClient from './minioClient';

const { useDevBucket, devBucketPrefix } = config.minio;

export default abstract class DefaultManagerMinio {
    public minioClient: MinIOClient;

    constructor(protected workspaceId: string) {
        const fixedBucketName = `${useDevBucket ? devBucketPrefix : ''}${workspaceId}`;
        this.minioClient = new MinIOClient(fixedBucketName);
    }
}
