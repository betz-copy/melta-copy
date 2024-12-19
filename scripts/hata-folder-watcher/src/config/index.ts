import * as env from 'env-var';
import './dotenv';

const config = {
    remoteFolder: {
        isFtp: env.get('REMOTE_FOLDER_IS_FTP').default('true').asBool(),
        path: env.get('REMOTE_FOLDER_PATH').required().asString(),
        ftp: {
            host: env.get('INCOMING_FTP_HOST').default('localhost').asString(),
            port: env.get('INCOMING_FTP_PORT').default(21).asInt(),
            user: env.get('INCOMING_FTP_USER').default('ftpuser').asString(),
            password: env.get('INCOMING_FTP_PASSWORD').default('1212').asString(),
            secure: env.get('INCOMING_FTP_SECURE').default('false').asBool(),
        },
    },
    template: {
        iconFileId: env.get('TEMPLATE_ICON_FILE_ID').required().asString(),
    },
    instance: {
        localDownloadFilePath: env.get('INSTANCE_LOCAL_FILE_FILE').default('./files').asString(),
    },
    interval: {
        watchInterval: env.get('INCOMING_WATCH_INTERVAL').default('1000').asIntPositive(),
        minFileAge: env.get('SHARED_FOLDER_MIN_FILE_AGE').default('2000').asIntPositive(),
    },
    melta: {
        baseURL: env.get('MELTA_BASE_URL').required().asString(),
        jwt: env.get('MELTA_JWT').required().asString(),
        templatesApi: env.get('MELTA_TEMPLATES_API').default('/api/templates').asString(),
        instancesApi: env.get('MELTA_INSTANCES_API').default('/api/instances').asString(),
        timeout: env.get('MELTA_TIMEOUT').default(60000).asInt(),
        batch: {
            batchDelay: env.get('MELTA_BATCH_DELAY').default(60000).asInt(),
            batchSize: env.get('MELTA_BATCH_SIZE').default(10).asInt(),
        },
    },
};

export default config;
