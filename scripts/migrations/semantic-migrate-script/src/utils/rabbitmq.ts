import { menash } from 'menashmq';

import config from '../config';

const {
    rabbit,
    service: { workspaceIdHeaderName },
} = config;

export const initializeRabbit = async () => {
    console.log('Connecting to Rabbit...');

    await menash.connect(rabbit.url, rabbit.retryOptions);

    console.log('Rabbit connected');

    await menash.declareQueue(rabbit.insertQueue);

    console.log('Rabbit initialized');
};

export const indexFiles = async (templateId: string, entityId: string, minioFileIds: string[], workspaceId: string) => {
    const fileData = { templateId, entityId, minioFileIds };
    await menash.send(rabbit.insertQueue, fileData, { headers: { [workspaceIdHeaderName]: workspaceId } }).catch((err) => {
        console.error('Failed at indexing file', err);
    });
};
