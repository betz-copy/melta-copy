/* eslint-disable class-methods-use-this */
import { Transaction } from 'neo4j-driver';
import config from '../config';
import { TemplateManagerService } from '../externalServices/entityTemplateManager';
import { IEntityTemplate } from '../externalServices/entityTemplateManager/interfaces';
import DefaultManagerNeo4j from '../utils/neo4j/manager';
import logger from '../utils/logger/logsLogger';

const {
    neo4j: { globalSearchIndex, templateSearchIndexPrefix, stringPropertySuffix, indexPropertiesLimit },
} = config;

export default class Manager extends DefaultManagerNeo4j {
    private templateManagerService: TemplateManagerService;

    constructor(workspaceId: string) {
        super(workspaceId);
        this.templateManagerService = new TemplateManagerService(workspaceId);
    }

    private async createIndex(indexName: string, labels: string[], properties: string[], transaction: Transaction) {
        const createFullTextIndexCommand = `
        CREATE FULLTEXT INDEX \`${indexName}\` FOR (n:\`${labels.join('`|`')}\`)
        ON EACH [${properties.map((prop) => `n.\`${prop}\``).join(', ')}]
        OPTIONS { indexConfig: { \`fulltext.analyzer\`: 'unicode_whitespace' } }`;

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

        return transaction.run(createFullTextIndexCommand);
    }

    private async dropIndex(indexName: string, transaction: Transaction) {
        return transaction.run(`DROP INDEX \`${indexName}\` IF EXISTS`);
    }

    private async dropIndexTransaction(indexName: string) {
        await this.neo4jClient
            .performComplexTransaction('writeTransaction', async (transaction) => {
                await this.dropIndex(indexName, transaction);
            })
            .catch((error) => {
                logger.error(`Failed to drop index for ${indexName}`, { error });
            });
    }

    private async upsertSearchIndex(primaryIndexName: string, labels: string[], properties: string[]) {
        await this.neo4jClient
            .performComplexTransaction('writeTransaction', async (transaction) => {
                await this.dropIndex(primaryIndexName, transaction);
                await this.createIndex(primaryIndexName, labels, properties, transaction);
            })
            .catch((error) => {
                logger.error(`Failed to create primary index for ${primaryIndexName}`, { error });
            });
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

    private async getRelationshipReferencesPropertiesIndex(template: IEntityTemplate) {
        const relationshipReferencesProperties: string[] = [];

        await Promise.all(
            Object.entries(template.properties.properties).map(async ([key, value]) => {
                if (value.format === 'relationshipReference') {
                    const relatedTemplate = await this.templateManagerService.getEntityTemplateById(value.relationshipReference!.relatedTemplateId);
                    this.getTemplatePropertiesIndex(relatedTemplate).forEach((innerProperty) =>
                        relationshipReferencesProperties.push(
                            `${key}.properties.${innerProperty}${config.neo4j.relationshipReferencePropertySuffix}`,
                        ),
                    );
                }
            }),
        );

        return relationshipReferencesProperties;
    }

    async upsertGlobalSearchIndex() {
        const templates = await this.templateManagerService.searchEntityTemplates();

        const templateIds = templates.map((template) => template._id);
        const allTemplatesProperties = new Set<string>();

        templates.forEach((template) => {
            this.getTemplatePropertiesIndex(template).forEach((property) => allTemplatesProperties.add(property));
        });

        await Promise.all(
            templates.map(async (template) => {
                const relationshipReferencesProperties = await this.getRelationshipReferencesPropertiesIndex(template);
                relationshipReferencesProperties.forEach((property) => allTemplatesProperties.add(property));
            }),
        );

        // https://github.com/neo4j/neo4j/issues/12288
        // The above issue explains that neo4j doesn't like it when you have 2 indexes with identical props and labels.
        // It occurs when have 0 indexes in a workspace because we try to create global search index and an index for the templateId.
        // Here we only create the global search index if we already have more then one template.
        // But the global search actually works without the global search index initialized.
        if (templates.length > 1) {
            const propertiesArray = Array.from(allTemplatesProperties);
            if (propertiesArray.length >= indexPropertiesLimit) {
                const propertiesChunks: string[][] = [];
                for (let i = 0; i < propertiesArray.length; i += indexPropertiesLimit) {
                    propertiesChunks.push(propertiesArray.slice(i, i + indexPropertiesLimit));
                }
                await Promise.all(
                    propertiesChunks.map(async (properties, index) => {
                        await this.upsertSearchIndex(`${globalSearchIndex}_${index + 1}`, templateIds, properties);
                    }),
                );
            } else {
                await this.upsertSearchIndex(`${globalSearchIndex}_1`, templateIds, Array.from(allTemplatesProperties));
            }
        }
    }

    async upsertChangedTemplateSearchIndex(changedTemplateId: string) {
        const changedTemplate = await this.templateManagerService.getEntityTemplateById(changedTemplateId);
        const relationshipReferencesProperties = await this.getRelationshipReferencesPropertiesIndex(changedTemplate);
        const allProperties = [...relationshipReferencesProperties, ...this.getTemplatePropertiesIndex(changedTemplate)];

        await this.upsertSearchIndex(`${templateSearchIndexPrefix}${changedTemplateId}`, [changedTemplateId], allProperties);
    }

    async deleteTemplateSearchIndex(templateId: string) {
        await this.dropIndexTransaction(`${templateSearchIndexPrefix}${templateId}`);
    }
}
