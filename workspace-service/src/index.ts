/* eslint-disable no-console */
import * as mongoose from 'mongoose';
import { config } from './config';
import { Server } from './express/server';
import { WorkspaceTypes } from './express/workspaces/interface';
import { WorkspacesModel } from './express/workspaces/model';

const { mongo, service } = config;

const handleRootDocument = async () => {
    console.log('Checking if root document exists...');

    if (await WorkspacesModel.findOne({})) {
        console.log('Root document exists, skipping...');
        return;
    }

    console.log('Root document does not exist, creating...');
    await WorkspacesModel.create({ name: '', path: '/', type: WorkspaceTypes.dir, colors: { primary: '#1E2775' } });
    console.log('Root document created');
};

const initializeMongo = async () => {
    console.log('Connecting to Mongo...');

    await mongoose.connect(mongo.url);

    console.log('Mongo connection established');

    await handleRootDocument();
};

const main = async () => {
    await initializeMongo();

    const server = new Server(service.port);

    await server.start();

    console.log(`Server started on port: ${service.port}`);
};

main().catch(console.error);
