import { initializeRabbit } from './utils/rabbitmq';
import { initializeMongo } from './utils/mongo';
import { initializeNeo } from './utils/neo4j';
import { WorkspaceService, WorkspaceTypes } from './services/workspace';
import { IMongoEntityTemplate } from './clients/mongo/interface';
import { listFilesInDB } from './clients/neo4j';
import { Driver } from 'neo4j-driver';
import { sendToQueue } from './clients/rabbit/manager';
import config from './config';
import { initModelPerWorkspace } from './clients/mongo/initModelPerWorkspace';

const { rabbit } = config;

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

const extractFromWorkspace = async (driver: Driver, workspaceId: string) => {
    const entityTemplateModel = initModelPerWorkspace(workspaceId);
    console.log(`Extracting from workspace ${workspaceId}`);

    const templatesWithFiles = await entityTemplateModel
        .find({
            $expr: {
                $or: [
                    {
                        $in: [
                            'fileId',
                            {
                                $map: {
                                    input: { $objectToArray: '$properties.properties' },
                                    as: 'entry',
                                    in: '$$entry.v.format',
                                },
                            },
                        ],
                    },
                    {
                        $in: [
                            'fileId',
                            {
                                $map: {
                                    input: { $objectToArray: '$properties.properties' },
                                    as: 'entry',
                                    in: '$$entry.v.items.format',
                                },
                            },
                        ],
                    },
                ],
            },
        })
        .lean()
        .exec();

    console.log(`Found ${templatesWithFiles.length} templates with files`);

    const fileProperties = getFileProperties(templatesWithFiles as IMongoEntityTemplate[]);
    console.log(`File properties of templates: ${JSON.stringify(fileProperties)}`);

    const files = await listFilesInDB(driver, workspaceId, Object.keys(fileProperties)[0], Object.values(fileProperties)[0]);
    console.log({ files });

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
};

const main = async () => {
    const [driver] = await Promise.all([initializeNeo(), initializeRabbit(), initializeMongo()]);

    const workspaceIds = await WorkspaceService.getWorkspaceIds(WorkspaceTypes.mlt);

    const result = await Promise.allSettled(workspaceIds.map((workspaceId) => extractFromWorkspace(driver, workspaceId)));
    console.log(result);
};

main().catch(console.error);
