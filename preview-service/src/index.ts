import { Server } from './express/server';
import { config } from './config';
import { minioClient } from './utils/minio/minioClient';
import logger from './utils/logger/logsLogger';

const main = async () => {
    const { url: endPoint, port, accessKey, secretKey, bucketName, useSSL } = config.minio;
    await minioClient.initialize(endPoint, port, accessKey, secretKey, bucketName, useSSL);

    logger.info(`Preview connection established!`);

    const { port: serverPort } = config.service;
    const server = new Server(serverPort);

    await server.start();

    logger.info(`Server started on port: ${serverPort}`);
};

main().catch((err) => {
    logger.error(err);
    process.exit(1);
});
