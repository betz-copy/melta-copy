import config from '../config';
import Neo4jClient from '../utils/neo4j';
import RedisClient from '../utils/redis';
import getEntityTemplates from './templates';

const { neo4j } = config;

const createIndex = async (indexName: string, labels: string[], properties: string[]) => {
    const createFullTextIndexCommand = `
    CREATE FULLTEXT INDEX \`${indexName}\`
    FOR
    (n:${labels.map((label) => `\`${label}\``).join('|')})
    ON EACH
    [${properties.map((property) => `n.${property}`).join(', ')}]`;

    await Neo4jClient.writeTransaction(createFullTextIndexCommand);
};

const dropIndex = (indexName: string) => {
    return Neo4jClient.writeTransaction(`DROP INDEX \`${indexName}\``);
};

const updateIndexWithTemplates = async (labels: string[], properties: string[]) => {
    const redisClient = RedisClient.getClient();
    const latestIndex = await redisClient.get('latestIndex');

    const [primarySearchIndex, secondarySearchIndex] = neo4j.globalSearchIndexes;

    if (!latestIndex) {
        await createIndex(primarySearchIndex, labels, properties);
        await redisClient.set('latestIndex', primarySearchIndex);

        return;
    }

    if (latestIndex === primarySearchIndex) {
        await createIndex(secondarySearchIndex, labels, properties);
        await redisClient.set('latestIndex', secondarySearchIndex);
        await dropIndex(primarySearchIndex);

        return;
    }

    await createIndex(primarySearchIndex, labels, properties);
    await redisClient.set('latestIndex', primarySearchIndex);
    await dropIndex(secondarySearchIndex);
};

const fetchTemplatesAndCreateIndex = async () => {
    const templates = await getEntityTemplates();

    const templateIds = templates.map((template) => template._id);
    const templateProperties = templates.flatMap((template) => Object.keys(template.properties.properties));
    const properties = [...new Set(templateProperties)];

    await updateIndexWithTemplates(templateIds, properties);
};

export default fetchTemplatesAndCreateIndex;
