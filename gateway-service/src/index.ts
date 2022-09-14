/* eslint-disable no-console */
import menash from 'menashmq';
import Server from './express/server';
import config from './config';

const { service, rabbit } = config;

const initializeRabbit = async () => {
    console.log('Connecting to Rabbit...');

    await menash.connect(rabbit.uri, rabbit.retryOptions);

    console.log('Rabbit connected');

    await menash.declareQueue(rabbit.notificationQueue);

    console.log('Rabbit initialized');
};

const main = async () => {
    await initializeRabbit();

    const server = new Server(service.port);

    await server.start();

    console.log(`Server started on port: ${service.port}`);
};

main().catch((err) => console.error(err));
