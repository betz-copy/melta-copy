import { config } from './config';
import { Server } from './express/server';
import { MinIOClient } from './utils/minio';

const main = async () => {
    await MinIOClient.initialize();

    console.log(`Storage connection established!`);

    const { port: serverPort } = config.service;
    const server = new Server(serverPort);

    await server.start();

    console.log(`Server started on port: ${serverPort}`);
};

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
