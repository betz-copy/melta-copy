import config from '../config';
import Neo4jClient from '../utils/neo4j';
import RedisClient from '../utils/redis';
import { EntityTemplateManagerService } from '../externalServices/entityTemplateManager';
import { IEntityTemplate } from '../externalServices/entityTemplateManager/interfaces';

const {
    neo4j: {
        globalSearchIndexes: [primaryGlobalSearchIndex, secondaryGlobalSearchIndex],
        templateSearchIndexPrefixes: [primaryTemplateSearchIndexPrefix, secondaryTemplateSearchIndexPrefix],
        stringPropertySuffix,
    },
    redis: { globalSearchKeyName, templateSearchKeyNamePrefix },
} = config;

const createIndex = async (indexName: string, labels: string[], properties: string[]) => {
    const createFullTextIndexCommand = `
    CALL db.index.fulltext.createNodeIndex(
        '${indexName}',
        ['${labels.join("','")}'],
        ['${properties.join("','")}'],
        { analyzer: 'unicode_whitespace' }
    )`;

    // we chose analyzer "unicode_whitespace" because we want to do searches of `*{search}*`.
    // in fulltext (lucene) query '*' works only on terms, and not phrases.
    // for example in the standard analyzer "foo,bar" is a phrase (with two terms), so searching "*foo,bar*" wont work at all.
    // but with "unicode_whitespace" analyzer, adding '*' at start and end, will always search on terms and not phrases,
    // because in whitespace analyzer "foo,bar" is one term, so '*' will work on it,
    // and searching "*foo bar*" will also work, because it will search "*foo" and "bar*" separately
    // read also this to understand: https://stackoverflow.com/questions/25450308/full-text-search-in-neo4j-with-spaces
    // also it will work better for searching dates (standard analyzer breaks apart the dates)
    // btw, adding custom analyzer to support autocomplete (for example edge-n-gram analyzer) instead of '*' is not possible.
    // because it requires one analyzer for the index task and one analyzer for the search/query task different analyzer see https://github.com/neo4j/neo4j/issues/9787

    await Neo4jClient.writeTransaction(createFullTextIndexCommand);
};

const dropIndex = (indexName: string) => {
    return Neo4jClient.writeTransaction(`CALL db.index.fulltext.drop('${indexName}')`);
};

const upsertSearchIndex = async (
    redisKeyName: string,
    primaryIndexName: string,
    secondaryIndexName: string,
    labels: string[],
    properties: string[],
) => {
    const redisClient = RedisClient.getClient();
    const latestIndex = await redisClient.get(redisKeyName);

    if (!latestIndex) {
        await createIndex(primaryIndexName, labels, properties);
        await redisClient.set(redisKeyName, primaryIndexName);

        return;
    }

    if (latestIndex === primaryIndexName) {
        await createIndex(secondaryIndexName, labels, properties);
        await redisClient.set(redisKeyName, secondaryIndexName);
        await dropIndex(primaryIndexName);

        return;
    }

    await createIndex(primaryIndexName, labels, properties);
    await redisClient.set(redisKeyName, primaryIndexName);
    await dropIndex(secondaryIndexName);
};

const getTemplatePropertiesIndex = (template: IEntityTemplate) => {
    const templateProperties = Object.entries(template.properties.properties).map(([key, value]) => {
        const { type, format } = value;

        if (type !== 'string' || format === 'date' || format === 'date-time') {
            return `${key}${stringPropertySuffix}`;
        }

        return key;
    });
    return templateProperties;
};

export const upsertGlobalSearchIndex = async () => {
    const templates = await EntityTemplateManagerService.searchEntityTemplates();

    const templateIds = templates.map((template) => template._id);
    const allTemplatesProperties = new Set<string>();

    templates.forEach((template) => {
        getTemplatePropertiesIndex(template).forEach((property) => allTemplatesProperties.add(property));
    });

    await upsertSearchIndex(
        globalSearchKeyName,
        primaryGlobalSearchIndex,
        secondaryGlobalSearchIndex,
        templateIds,
        Array.from(allTemplatesProperties),
    );
};

export const upsertChangedTemplateSearchIndex = async (changedTemplateId: string) => {
    const changedTemplate = await EntityTemplateManagerService.getEntityTemplateById(changedTemplateId);

    await upsertSearchIndex(
        `${templateSearchKeyNamePrefix}${changedTemplateId}`,
        `${primaryTemplateSearchIndexPrefix}${changedTemplateId}`,
        `${secondaryTemplateSearchIndexPrefix}${changedTemplateId}`,
        [changedTemplateId],
        getTemplatePropertiesIndex(changedTemplate),
    );
};

export const deleteTemplateSearchIndex = async (templateId: string) => {
    const redisClient = RedisClient.getClient();

    const redisKeyName = `${templateSearchKeyNamePrefix}${templateId}`;

    const latestIndex = await redisClient.get(redisKeyName);

    if (!latestIndex) {
        throw new Error(`expected key of template by name "${redisKeyName}" to be found to delete search index`);
    }

    await dropIndex(latestIndex);
    await redisClient.del(redisKeyName);
};
