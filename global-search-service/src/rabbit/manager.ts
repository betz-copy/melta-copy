/* eslint-disable class-methods-use-this */
import config from '../config';
import { EntityTemplateManagerService } from '../externalServices/entityTemplateManager';
import { IEntityTemplate } from '../externalServices/entityTemplateManager/interfaces';
import DefaultManagerNeo4j from '../utils/neo4j/manager';
import RedisClient from '../utils/redis';

const {
    neo4j: {
        globalSearchIndexes: [primaryGlobalSearchIndex, secondaryGlobalSearchIndex],
        templateSearchIndexPrefixes: [primaryTemplateSearchIndexPrefix, secondaryTemplateSearchIndexPrefix],
        stringPropertySuffix,
    },
    redis: { globalSearchKeyName, templateSearchKeyNamePrefix },
} = config;

export default class Manager extends DefaultManagerNeo4j {
    private entityTemplateManagerService: EntityTemplateManagerService;

    private redisClient: RedisClient;

    constructor(dbName: string) {
        super(dbName);
        this.entityTemplateManagerService = new EntityTemplateManagerService(dbName);
        this.redisClient = new RedisClient(dbName);
    }

    private async createIndex(indexName: string, labels: string[], properties: string[]) {
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

        await this.neo4jClient.writeTransaction(createFullTextIndexCommand);
    }

    private async dropIndex(indexName: string) {
        return this.neo4jClient.writeTransaction(`CALL db.index.fulltext.drop('${indexName}')`);
    }

    private async upsertSearchIndex(
        redisKeyName: string,
        primaryIndexName: string,
        secondaryIndexName: string,
        labels: string[],
        properties: string[],
    ) {
        const latestIndex = await this.redisClient.get(redisKeyName);

        if (!latestIndex) {
            await this.createIndex(primaryIndexName, labels, properties);
            await this.redisClient.set(redisKeyName, primaryIndexName);

            return;
        }

        if (latestIndex === primaryIndexName) {
            await this.createIndex(secondaryIndexName, labels, properties);
            await this.redisClient.set(redisKeyName, secondaryIndexName);
            await this.dropIndex(primaryIndexName);

            return;
        }

        await this.createIndex(primaryIndexName, labels, properties);
        await this.redisClient.set(redisKeyName, primaryIndexName);
        await this.dropIndex(secondaryIndexName);
    }

    private getTemplatePropertiesIndex(template: IEntityTemplate) {
        const templateProperties = Object.entries(template.properties.properties).map(([key, value]) => {
            const { type, format } = value;

            if (type !== 'string' || format === 'date' || format === 'date-time') {
                return `${key}${stringPropertySuffix}`;
            }

            return key;
        });
        return templateProperties;
    }

    public async upsertGlobalSearchIndex() {
        const templates = await this.entityTemplateManagerService.searchEntityTemplates();

        const templateIds = templates.map((template) => template._id);
        const allTemplatesProperties = new Set<string>();

        templates.forEach((template) => {
            this.getTemplatePropertiesIndex(template).forEach((property) => allTemplatesProperties.add(property));
        });

        await this.upsertSearchIndex(
            globalSearchKeyName,
            primaryGlobalSearchIndex,
            secondaryGlobalSearchIndex,
            templateIds,
            Array.from(allTemplatesProperties),
        );
    }

    public async upsertChangedTemplateSearchIndex(changedTemplateId: string) {
        const changedTemplate = await this.entityTemplateManagerService.getEntityTemplateById(changedTemplateId);

        await this.upsertSearchIndex(
            `${templateSearchKeyNamePrefix}${changedTemplateId}`,
            `${primaryTemplateSearchIndexPrefix}${changedTemplateId}`,
            `${secondaryTemplateSearchIndexPrefix}${changedTemplateId}`,
            [changedTemplateId],
            this.getTemplatePropertiesIndex(changedTemplate),
        );
    }

    public async deleteTemplateSearchIndex(templateId: string) {
        const redisKeyName = `${templateSearchKeyNamePrefix}${templateId}`;

        const latestIndex = await this.redisClient.get(redisKeyName);

        if (!latestIndex) {
            throw new Error(`expected key of template by name "${redisKeyName}" to be found to delete search index`);
        }

        await this.dropIndex(latestIndex);
        await this.redisClient.del(redisKeyName);
    }
}
