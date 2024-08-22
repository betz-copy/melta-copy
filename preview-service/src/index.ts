import 'elastic-apm-node/start';
import menash from 'menashmq';
import { Server } from './express/server';
import { config } from './config';
import { minioClient } from './utils/minio/minioClient';
import logger from './utils/logger/logsLogger';
import PreviewConsumer from './rabbit/consumer';

const { rabbit } = config;


const initializeRabbitReceiver = async () => {
    logger.info('Connecting to Rabbit for receiving messages...');

    await menash.connect(rabbit.url, rabbit.retryOptions);

    logger.info('Rabbit connected for receiving messages');

    await menash.declareTopology({
        queues: [{ name: rabbit.previewQueue, options: { durable: true, prefetch: 1 } }], // num of unack messages fetched at a time
        consumers: [{ queueName: rabbit.previewQueue, onMessage: PreviewConsumer.createPreviewQueueReq, options: { noAck: false } }], // ack message only after processed
    });

    logger.info('Consumer initialized for receiving messages');
};

const main = async () => {
    await initializeRabbitReceiver();

    const { url: endPoint, port, accessKey, secretKey, bucketName, useSSL } = config.minio;
    await minioClient.initialize(endPoint, port, accessKey, secretKey, bucketName, useSSL);

    logger.info(`Preview connection established!`);

    const { port: serverPort } = config.service;
    const server = new Server(serverPort);

    await server.start();

    logger.info(`Server started on port: ${serverPort}`);
};

main().catch((error) => {
    logger.error('Main error: ', { error });
    process.exit(1);
});
