import * as env from 'env-var';
import './dotenv';

const config = {
    service: {
        workspaceIdHeaderName: env.get('WORKSPACE_ID_HEADER_NAME').default('workspace-id').asString(),
        serviceName: env.get('SERVICE_NAME').default('shared-service').asString(),
        environment: env.get('ENVIRONMENT').default('dev').required().asString(),
        version: env.get('SERVICE_VERSION').default('1.0.0').asString(),
        port: env.get('PORT').default('3000').asPortNumber(),
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
        useDevBucket: env.get('USE_DEV_BUCKETS').default('false').asBool(),
        devBucketPrefix: env.get('DEV_BUCKET_PREFIX').default('dev-').asString(),
    },
    logs: {
        format: env.get('LOGGING_DATE_FORMAT').default('YYYY-MM-DD HH:mm:ss').asString(),
        enableFile: env.get('ENABLE_FILE_LOGGING').default('false').asBool(),
        enableRotateFile: env.get('ENABLE_ROTATE_FILE_LOGGING').default('true').asBool(),
        label: env.get('LOG_LABEL').default('global-search').asString(),
        extraDefault: {
            serviceName: env.get('LOG_SERVICE_NAME').default('shared-service').asString(),
            environment: env.get('LOG_ENVIRONMENT').default('dev').required().asString(),
        },
        fileSettings: {
            datePattern: env.get('FILE_LOG_DATE_PATTERN').default('YYYY-MM-DD').asString(),
            maxSize: env.get('FILE_LOG_MAX_SIZE').default('3g').asString(),
            maxFiles: env.get('FILE_LOG_MAX_FILES').default(3).asIntPositive(),
            filename: env.get('FILE_LOG_FILENAME').default('log_file.log').asString(),
            dirname: env.get('FILE_LOG_DIRNAME').default('./logs').asString(),
        },
        fileRotateSettings: {
            datePattern: env.get('ROTATE_FILE_LOG_DATE_PATTERN').default('YYYY-MM-DD').asString(),
            maxSize: env.get('ROTATE_FILE_LOG_MAX_SIZE').default('20m').asString(),
            maxFiles: env.get('ROTATE_FILE_LOG_MAX_FILES').default('14d').asString(),
            dirname: env.get('ROTATE_FILE_LOG_DIRNAME').default('./logs').asString(),
        },
    },
    map: {
        srid: env.get('SRID').default(4326).asInt(),
        polygon: {
            polygonPrefix: env.get('POLYGON_PREFIX').default('POLYGON((').asString(),
            polygonSuffix: env.get('POLYGON_SUFFIX').default('))').asString(),
        },
        epsgCode: {
            epsg: env.get('EPSG').default('EPSG').asString(),
            wgs84: env.get('WGS84').default('EPSG:4326').asString(),
            southHemiUTM: env.get('SOUTH_HEMI_UTM').default('327').asString(),
            northHemiUTM: env.get('NORTH_HEMI_UTM').default('326').asString(),
        },
        utm: {
            utmRegex: env
                .get('UTM_REGEX')
                .default('\\b([1-9]|[1-5][0-9]|60)([C-HJ-NP-X])\\s([0-9]+(?:\\.[0-9]+)?)\\s([0-9]+(?:\\.[0-9]+)?)\\b')
                .asRegExp(),

            utmPolygonRegex: env
                .get('UTM_POLYGON_REGEX')
                .default('\\b([1-9]|[1-5][0-9]|60)([C-HJ-NP-X])\\s([0-9]+(?:\\.[0-9]+)?)\\s([0-9]+(?:\\.[0-9]+)?)\\b')
                .asRegExp('g'),

            minZone: env.get('MIN_ZONE').default(1).asInt(),
            maxZone: env.get('MAX_ZONE').default(60).asInt(),
            minEasting: env.get('MIN_EASTING').default(160000).asInt(),
            maxEasting: env.get('MAX_EASTING').default(834000).asInt(),
            minNorthing: env.get('MIN_NORTHING').default(0).asInt(),
            maxNorthing: env.get('MAX_NORTHING').default(10000000).asInt(),
        },
        wgs84: { maxLongitude: env.get('MAX_LONGITUDE').default(180).asInt(), maxLatitude: env.get('MAX_LATITUDE').default(90).asInt() },
    },
};

export default config;
