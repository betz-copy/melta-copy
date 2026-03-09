// import axios from 'axios';
// import 'elastic-apm-node/start';
// import { logger } from '@packages/utils';
// import menash from 'menashmq';
// import mongoose from 'mongoose';
// import config from './config';
// import Server from './express/server';

// const { mongo, service, rabbit } = config;

// const initializeMongo = async () => {
//     logger.info('Connecting to Mongo...');

//     await mongoose.connect(mongo.url, mongo.connectionOptions);

//     logger.info('Mongo connection established');
// };

// const initializeRabbit = async () => {
//     logger.info('Connecting to Rabbit...');

//     await menash.connect(rabbit.url, rabbit.retryOptions);

//     logger.info('Rabbit connected');

//     await menash.declareQueue(rabbit.updateSearchIndexQueueName);

//     logger.info('Rabbit initialized');
// };

// const main = async () => {
//     await initializeMongo();

//     axios.defaults.maxBodyLength = service.maxRequestSize;
//     axios.defaults.maxContentLength = service.maxRequestSize;

//     await initializeRabbit();

//     const server = new Server(service.port);

//     await server.start();

//     logger.info(`Server started on port: ${service.port}`);
// };

// main().catch((error) => logger.error('Main error: ', { error }));
