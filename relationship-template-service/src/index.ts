/* eslint-disable no-console */
import mongoose from 'mongoose';
import Server from './express/server';
import config from './config';

const { mongo, service } = config;

const initializeMongo = async () => {
    console.log('Connecting to Mongo...');

    await mongoose.connect(mongo.url, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true });

    console.log('Mongo connection established');
};

const main = async () => {
    await initializeMongo();

    const server = new Server(service.port);

    await server.start();

    console.log(`Server started on port: ${service.port}`);
};

main().catch((err) => console.error(err));
