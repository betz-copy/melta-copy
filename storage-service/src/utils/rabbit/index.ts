import menash from 'menashmq';

import { config } from '../../config';

import { handleDeleteFileRequests } from '../../express/files/consumer';

const {
    deleteExchangeName,
    deleteQueueName,
    deleteWithoutDelayQueueName,
    deleteWithoutDelayExchangeName,
    deleteDelay,
    deleteDelayDeadLetterRoutingKey,
    uri,
    retryOptions,
} = config.rabbit;

export const initializeRabbit = async () => {
    await menash.connect(uri, retryOptions);
    await menash.declareTopology({
        queues: [
            {
                name: deleteQueueName,
                options: {
                    durable: true,
                    messageTtl: deleteDelay,
                    deadLetterExchange: deleteWithoutDelayExchangeName,
                    deadLetterRoutingKey: deleteDelayDeadLetterRoutingKey,
                },
            },
            { name: deleteWithoutDelayQueueName },
        ],
        consumers: [{ queueName: deleteWithoutDelayQueueName, onMessage: handleDeleteFileRequests }],
        exchanges: [
            { name: deleteExchangeName, type: 'fanout' },
            { name: deleteWithoutDelayExchangeName, type: 'direct' },
        ],
        bindings: [
            { source: deleteExchangeName, destination: deleteQueueName },
            { source: deleteWithoutDelayExchangeName, destination: deleteWithoutDelayQueueName, pattern: deleteDelayDeadLetterRoutingKey },
        ],
    });
};
