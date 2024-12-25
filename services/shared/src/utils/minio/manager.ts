import MinIOClient from './minioClient';
import config from '../../config';

const { useDevBucket, devBucketPrefix } = config.minio;

abstract class DefaultManagerMinio {
    public minioClient: MinIOClient;

    constructor(protected workspaceId: string) {
        const fixedBucketName = `${useDevBucket ? devBucketPrefix : ''}${workspaceId}`;
        this.minioClient = new MinIOClient(fixedBucketName);
    }
}

export default DefaultManagerMinio;
