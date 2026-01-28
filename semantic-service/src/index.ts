import 'elastic-apm-node/start';
import { logger } from '@microservices/shared';
import config from './config';
import Server from './express/server';

const { service, openai } = config;

const main = async () => {
    const server = new Server(service.port);

    await server.start();

    logger.info(`Server started on port: ${service.port}`);
    logger.info(
        `Using model: ${openai.model} | API Key: ${openai.apiKey ? 'configured' : 'NOT configured'} | Multi-file upload enabled (key: "files")`,
    );
};

main().catch((error) => {
    logger.error('Main error: ', { error });
});
