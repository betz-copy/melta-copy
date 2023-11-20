import 'dotenv/config';
import * as env from 'env-var';

export const config = {
    service: {
        port: env.get('PORT').default(8000).asPortNumber(),
        maxFileSize: env.get('MAX_FILE_SIZE').default(50000000).asInt(),
    },
    minio: {
        uri: env.get('MINIO_ENDPOINT').default('localhost').asString(),
        port: env.get('MINIO_PORT').default(9000).asPortNumber(),
        accessKey: env.get('MINIO_ACCESS_KEY').default('minioadmin').asString(),
        secretKey: env.get('MINIO_SECRET_KEY').default('minioadmin').asString(),
        bucketName: env.get('MINIO_BUCKET_NAME').default('bucket').asString(),
        useSSL: false,
    },
};
