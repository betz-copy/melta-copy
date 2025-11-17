import { IMongoEntityTemplate } from '@microservices/shared';
import { Driver } from 'neo4j-driver';
import path from 'path';
import { getTemplatesWithFiles } from './clients/mongo/repository';
import { listFilesInDB } from './clients/neo4j';
import { sendToQueue } from './clients/rabbit/manager';
import config from './config';
import { WorkspaceService, WorkspaceTypes } from './services/workspace';
import { initializeMongo } from './utils/mongo';
import { initializeNeo } from './utils/neo4j';
import { initializeRabbit } from './utils/rabbitmq';

const {
    rabbit,
    service: { supportedFileExtensions },
} = config;

let messageCount = 0;

// This is a service that reads all entities who have a file in them in Neo4j and sends them to the RabbitMQ queue in order for the semantic search to work.
// Should probably delete after.

const getFileProperties = (templateWithFiles: IMongoEntityTemplate[]) => {
    return templateWithFiles.reduce<Record<string, string[]>>((acc, template) => {
        Object.entries(template.properties.properties).forEach(([key, value]) => {
            if (value.format === 'fileId' || value.items?.format === 'fileId') {
                if (acc[template._id]) {
                    acc[template._id].push(key);
                } else {
                    acc[template._id] = [key];
                }
            }
        });

        return acc;
    }, {});
};

const waitXSeconds = async () => {
    console.log(`Begin waiting ${rabbit.asyncMsgWait / 1000} seconds`);
    await new Promise<void>((res) => setTimeout(() => res(), rabbit.asyncMsgWait));
    console.log(`Finished waiting ${rabbit.asyncMsgWait / 1000} seconds`);
};

const sendFilesToRabbit = async (driver: Driver, workspaceId: string, templateId: string, fileProperties: string[]) => {
    const filesInDb = await listFilesInDB(driver, workspaceId, templateId, fileProperties);
    let promises: Promise<void>[] = [];

    for (const { _id, files } of filesInDb) {
        const minioFileIds = files.flat().filter((file) => !!file && supportedFileExtensions.includes(path.extname(file)));
        console.log(`Files found in Neo ${JSON.stringify(minioFileIds)}`);

        if (!minioFileIds?.length) continue;

        const rabbitMessage = {
            minioFileIds,
            templateId,
            entityId: _id,
        };
        console.log(`Sending to rabbit: ${JSON.stringify(rabbitMessage)}`);

        if (messageCount !== 0 && messageCount % rabbit.asyncMsgAmount === 0) {
            await Promise.all(promises);
            await waitXSeconds();
            promises = [];
        }

        promises.push(sendToQueue(rabbit.insertQueue, rabbitMessage, workspaceId));
        messageCount++;
    }
};

const extractFromWorkspace = async (driver: Driver, workspaceId: string) => {
    console.log(`Extracting from workspace ${workspaceId}`);

    const templatesWithFiles = await getTemplatesWithFiles(workspaceId);

    console.log(`Found ${templatesWithFiles.length} templates with files`);

    const templateFileProperties = getFileProperties(templatesWithFiles as IMongoEntityTemplate[]);

    console.log(`File properties of templates: ${JSON.stringify(templateFileProperties)}`);

    for (const [index, [templateId, fileProperty]] of Object.entries(templateFileProperties).entries()) {
        console.log(`Starting template: ${templateId} (${index} / ${Object.keys(templateFileProperties).length}) in workspace`);
        await sendFilesToRabbit(driver, workspaceId, templateId, fileProperty);
    }
};

const main = async () => {
    const [driver] = await Promise.all([initializeNeo(), initializeRabbit(), initializeMongo()]);

    const workspaceIds = await WorkspaceService.getWorkspaceIds(WorkspaceTypes.mlt);

    for (const workspaceId of workspaceIds) {
        await extractFromWorkspace(driver, workspaceId);
    }
};

main()
    .catch(console.error)
    .then(() => console.log('DONE!'));
