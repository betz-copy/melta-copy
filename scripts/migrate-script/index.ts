import { sendToQueue } from "./clients/rabbit/manager";
import { initializeNeo, listDatabases, listFilesInDB } from "./clients/neo4j";
import config from "./config";

const { rabbit, neo4j } = config;

// This is a service that reads all entities who have a file in them in Neo4j and sends them to the RabbitMQ queue in order for the semantic search to work.
// Should probably delete after.
const main = async () => {
    const driver = await initializeNeo();
    const session = driver.session();

    const databases = await listDatabases(session);

    await Promise.allSettled(databases.map(async (database) => {
        // TODO: add logs
        const files = await listFilesInDB(driver, database.name);
        const workspaceId = database.name.replace(neo4j.workspaceNamePrefix, '');

        return files.map((file) => {
            return sendToQueue(rabbit.insertQueue, {
                minioFileIds: file.fileId,
                templateId: file.templateId[0],
                entityId: file.id
            }, workspaceId);
        });
    }));
};

main().catch(console.error);