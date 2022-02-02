/* eslint-disable no-console */
import Server from './express/server';
import config from './config';

const { service } = config;

const main = async () => {
    const server = new Server(service.port);

    await server.start();

    console.log(`Server started on port: ${service.port}`);
};

main().catch((err) => console.error(err));
