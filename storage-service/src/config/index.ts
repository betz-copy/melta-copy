import 'dotenv/config';
import * as env from 'env-var';

export const config = {
    multer: {
        fileKeyName: 'file',
        filesKeyName: 'files',
    },
    service: {
        port: env.get('PORT').default(8000).asPortNumber(),
        dbHeaderName: env.get('DB_HEADER_NAME').default('dbName').asString(),
        maxFileSize: env.get('MAX_FILE_BYTE_SIZE').required().asInt(),
        maxRequestSize: env.get('MAX_REQUEST_BYTE_SIZE').required().asInt(),
    },
    minio: {
        url: env.get('MINIO_ENDPOINT').default('localhost').asString(),
        port: env.get('MINIO_PORT').default(9000).asPortNumber(),
        accessKey: env.get('MINIO_ACCESS_KEY').default('minioadmin').asString(),
        secretKey: env.get('MINIO_SECRET_KEY').default('minioadmin').asString(),
        bucketName: env.get('MINIO_BUCKET_NAME').default('bucket').asString(),
        useSSL: false,
        transportAgent: {
            timeout: env.get('TRANSPORT_AGENT_TIMEOUT').default(60000).asIntPositive(),
            maxSockets: env.get('TRANSPORT_AGENT_MAX_SOCKETS').default(1000).asIntPositive(),
            keepAlive: env.get('TRANSPORT_AGENT_KEEP_ALIVE').default(1).asBool(),
            keepAliveMsecs: env.get('TRANSPORT_AGENT_KEEP_ALIVE_MSECS').default(1000).asIntPositive(),
        },
    },
};
