/* eslint-disable no-console */
import 'elastic-apm-node/start';
import * as mongoose from 'mongoose';
import { config } from './config';
import { Server } from './express/server';
import { WorkspaceTypes } from './express/workspaces/interface';
import { WorkspacesModel } from './express/workspaces/model';
import logger from './utils/logger/logsLogger';

const { mongo, service } = config;

const handleRootDocument = async () => {
    logger.info('Checking if root document exists...');

    if (await WorkspacesModel.findOne({})) {
        logger.info('Root document exists, skipping...');
        return;
    }

    logger.info('Root document does not exist, creating...');
    await WorkspacesModel.create({ name: '', displayName: '', path: '/', type: WorkspaceTypes.dir, colors: config.service.rootWorkspaceColors });
    logger.info('Root document created');
};

const initializeMongo = async () => {
    logger.info('Connecting to Mongo...');

    await mongoose.connect(mongo.url);

    logger.info('Mongo connection established');

    await handleRootDocument();
};

const main = async () => {
    await initializeMongo();

    const server = new Server(service.port);

    await server.start();

    logger.info(`Server started on port: ${service.port}`);
};

main().catch((error) => logger.error('main error: ', { error }));
