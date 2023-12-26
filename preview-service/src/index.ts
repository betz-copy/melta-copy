import { Server } from './express/server';
import { config } from './config';
import { minioClient } from './utils/minio/minioClient';

const main = async () => {
    const { uri: endPoint, port, accessKey, secretKey, bucketName, useSSL } = config.minio;
    await minioClient.initialize(endPoint, port, accessKey, secretKey, bucketName, useSSL);

    console.log(`Preview connection established!`);

    const { port: serverPort } = config.service;
    const server = new Server(serverPort);

    await server.start();

    console.log(`Server started on port: ${serverPort}`);
};

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
