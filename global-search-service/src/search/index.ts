import config from '../config';
import Neo4jClient from '../utils/neo4j';
import RedisClient from '../utils/redis';
import getEntityTemplates from './templates';

const { neo4j, redis } = config;

const createIndex = async (indexName: string, labels: string[], properties: string[]) => {
    const createFullTextIndexCommand = `
    CALL db.index.fulltext.createNodeIndex(
        '${indexName}',
        ['${labels.join("','")}'],
        ['${properties.join("','")}']
    )`;

    await Neo4jClient.writeTransaction(createFullTextIndexCommand);
};

const dropIndex = (indexName: string) => {
    return Neo4jClient.writeTransaction(`CALL db.index.fulltext.drop('${indexName}')`);
};

const updateIndexWithTemplates = async (labels: string[], properties: string[]) => {
    const redisClient = RedisClient.getClient();
    const latestIndex = await redisClient.get(redis.globalSearchKeyName);

    const [primarySearchIndex, secondarySearchIndex] = neo4j.globalSearchIndexes;

    if (!latestIndex) {
        await createIndex(primarySearchIndex, labels, properties);
        await redisClient.set(redis.globalSearchKeyName, primarySearchIndex);

        return;
    }

    if (latestIndex === primarySearchIndex) {
        await createIndex(secondarySearchIndex, labels, properties);
        await redisClient.set(redis.globalSearchKeyName, secondarySearchIndex);
        await dropIndex(primarySearchIndex);

        return;
    }

    await createIndex(primarySearchIndex, labels, properties);
    await redisClient.set(redis.globalSearchKeyName, primarySearchIndex);
    await dropIndex(secondarySearchIndex);
};

const fetchTemplatesAndCreateIndex = async () => {
    const templates = await getEntityTemplates();

    const templateIds = templates.map((template) => template._id);
    const templateProperties = new Set<string>();

    templates.forEach((template) => {
        Object.entries(template.properties.properties).forEach(([key, value]) => {
            const { type, format } = value;

            if (type !== 'string' || format === 'date' || format === 'date-time') {
                templateProperties.add(`${key}${neo4j.stringPropertySuffix}`);

                return;
            }

            templateProperties.add(key);
        });
    });

    await updateIndexWithTemplates(templateIds, Array.from(templateProperties));
};

export default fetchTemplatesAndCreateIndex;
