import 'elastic-apm-node/start';
import menash from 'menashmq';
import axios from 'axios';
// eslint-disable-next-line import/no-extraneous-dependencies
import * as k8s from '@kubernetes/client-node';
import { v4 as uuid } from 'uuid';
import Server from './express/server';
import config from './config';
import { checkForDateNotifications } from './utils/notifications/dateNotificationsCheck';
import logger from './utils/logger/logsLogger';

const { service, rabbit } = config;

const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
const configMapName = 'leader-election-config';
const namespace = 'default';

const checkAndAcquireLeadership = async () => {
    try {
        const configMap = await k8sApi.readNamespacedConfigMap(configMapName, namespace);
        const currentLeader = configMap.body.data?.leader;

        if (!currentLeader || currentLeader === '') {
            await k8sApi.patchNamespacedConfigMap(
                configMapName,
                namespace,
                {
                    data: { leader: uuid() },
                },
                undefined,
                undefined,
                undefined,
                undefined,
            );
            return true;
        }

        return false;
    } catch (error) {
        logger.error('Error checking or acquiring leadership:', error);
        return false;
    }
};

const initializeRabbit = async () => {
    logger.info('Connecting to Rabbit...');

    await menash.connect(rabbit.url, rabbit.retryOptions);

    logger.info('Rabbit connected');

    await menash.declareQueue(rabbit.notificationQueue);

    await menash.declareQueue(rabbit.mailNotificationQueue);

    logger.info('Rabbit initialized');
};

const main = async () => {
    await initializeRabbit();

    if (await checkAndAcquireLeadership()) await checkForDateNotifications();
    else logger.info('Not the leader. Skipping scheduled job.');

    axios.defaults.maxBodyLength = service.maxRequestSize;
    axios.defaults.maxContentLength = service.maxRequestSize;

    const server = new Server(service.port);

    await server.start();

    logger.info(`Server started on port: ${service.port}`);
};

main().catch((error) => logger.error('Main error: ', { error }));

const renewLeadership = async () => {
    // Periodically check and renew leadership
    setInterval(async () => {
        if (await checkAndAcquireLeadership()) {
            logger.info('Leadership renewed.');
        }
    }, 60000); // Check every minute
};

main()
    .then(() => renewLeadership())
    .catch((error) => logger.error('Main error: ', { error }));
