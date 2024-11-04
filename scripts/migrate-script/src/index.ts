import { sendToQueue } from './clients/rabbit/manager';

import { listDatabases, listFilesInDB } from './clients/neo4j';
import config from './config';
import { initializeRabbit } from './utils/rabbitmq';
import { initializeMongo } from './utils/mongo';
import { initModelPerWorkspace } from './clients/mongo/model';
import { initializeNeo } from './utils/neo4j';

const { rabbit, neo4j } = config;

// This is a service that reads all entities who have a file in them in Neo4j and sends them to the RabbitMQ queue in order for the semantic search to work.
// Should probably delete after.

const extractFromNeo4jByTemplate = async (workspaceId: string, templateId: string) => {};

const extractFromWorkspace = async (workspaceId: string) => {
    const workspaceModel = initModelPerWorkspace(workspaceId);
    console.log(`Extracting from workspace ${workspaceId}`);

    const templatesWithFiles = await workspaceModel.find({
        $or: [
            { 'properties.properties': { $elemMatch: { format: 'fileId' } } },
            { 'properties.properties': { $elemMatch: { 'items.format': 'fileId' } } },
        ],
    });
    console.log(`Found ${templatesWithFiles.length} templates with files`);
};

const main = async () => {
    await initializeRabbit();
    await initializeMongo();

    const driver = await initializeNeo();
    const session = driver.session();

    const databases = await listDatabases(session);

    await Promise.allSettled(
        databases.map(async (database) => {
            // TODO: add logs
            const files = await listFilesInDB(driver, database.name);
            const workspaceId = database.name.replace(neo4j.workspaceNamePrefix, '');

            return files.map((file) => {
                return sendToQueue(
                    rabbit.insertQueue,
                    {
                        minioFileIds: file.fileId,
                        templateId: file.templateId[0],
                        entityId: file.id,
                    },
                    workspaceId,
                );
            });
        }),
    );
};

main().catch(console.error);
