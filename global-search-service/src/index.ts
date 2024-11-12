import axios from 'axios';
import 'elastic-apm-node/start';
import menash from 'menashmq';

import config from './config';
import { updateIndexConsumeFunction } from './search/consumer';
import logger from './utils/logger/logsLogger';
import Neo4jClient from './utils/neo4j/neo4j';
import Manager from './search/manager';

const { rabbit, service } = config;

const initializeRabbit = async () => {
    logger.info('Connecting to Rabbit...');

    await menash.connect(rabbit.url, rabbit.retryOptions);

    logger.info('Rabbit connected');

    await menash.declareTopology({
        queues: [{ name: rabbit.queueName, options: { durable: true, prefetch: 1 } }],
        consumers: [{ queueName: rabbit.queueName, onMessage: updateIndexConsumeFunction }],
    });

    logger.info('Rabbit initialized');
};

const updateNonStringPropertiesScript = async (workspaceId: string) => {
    console.log(`INFO: Start running Updating non-string properties script for workspace: ${workspaceId}`);
    const manager = new Manager(workspaceId);

    await manager.updateAllNonStringProps();

    await manager.deleteAllIndexes();
    await manager.createAllIndexes();
    console.log(`INFO: Finished running Updating non-string properties script for workspace: ${workspaceId}`);
};

const main = async () => {
    axios.defaults.maxBodyLength = service.maxRequestSize;
    axios.defaults.maxContentLength = service.maxRequestSize;

    await Neo4jClient.initialize();
    const workspaceId: string = '673312888a067adc333d8e1d';
    await updateNonStringPropertiesScript(workspaceId);

    if (process.env.RUN_SCRIPT) {
        await initializeRabbit();
    }
};

main().catch((error) => logger.error('Main error: ', { error }));
