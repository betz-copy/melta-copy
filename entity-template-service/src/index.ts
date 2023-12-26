/* eslint-disable no-console */
import * as mongoose from 'mongoose';
import menash from 'menashmq';
import Server from './express/server';
import config from './config';

const { mongo, service, rabbit } = config;

const initializeMongo = async () => {
    console.log('Connecting to Mongo...');

    await mongoose.connect(mongo.uri, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true });

    console.log('Mongo connection established');
};

const initializeRabbit = async () => {
    console.log('Connecting to Rabbit...');

    await menash.connect(rabbit.uri, rabbit.retryOptions);

    console.log('Rabbit connected');

    await menash.declareQueue(rabbit.updateSearchIndexQueueName);

    console.log('Rabbit initialized');
};

const main = async () => {
    await initializeMongo();

    await initializeRabbit();

    const server = new Server(service.port);

    await server.start();

    console.log(`Server started on port: ${service.port}`);
};

main().catch((err) => console.error(err));
