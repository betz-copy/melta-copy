import { menash } from 'menashmq';
import config from '../../config';
import DeleteFilesConsumer from './consumer';

const { rabbit } = config;

export const declareTopology = async () => {
    const deleteFilesConsumer = new DeleteFilesConsumer();

    await menash.declareTopology({
        queues: [{ name: rabbit.deleteUnusedFilesQueue, options: { durable: true, prefetch: 1 } }],
        consumers: [
            {
                queueName: rabbit.deleteUnusedFilesQueue,
                onMessage: deleteFilesConsumer.createDeleteFilesQueueReq,
                options: { noAck: false },
            },
        ],
    });
};
