import 'elastic-apm-node/start';
import menash from 'menashmq';
import { StatusCodes } from 'http-status-codes';
import { config } from './config';
import { Server } from './express/server';
import PreviewConsumer from './rabbit/consumer';
import { ServiceError } from './express/error';
import logger from './utils/logger/logsLogger';

const {
    rabbit,
    service: { port: servicePort },
} = config;

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

    logger.info(`Preview connection established!`);

    const server = new Server(servicePort);

    await server.start();

    logger.info(`Server started on port: ${servicePort}`);
};

main().catch((error) => {
    process.exit(1);
    throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, 'Main error', { error });
});
