/* eslint-disable class-methods-use-this */
import { QueryResult, Transaction } from 'neo4j-driver';
import config from '../config';
import { TemplateManagerService } from '../externalServices/entityTemplateManager';
import { IEntityTemplate } from '../externalServices/entityTemplateManager/interfaces';
import DefaultManagerNeo4j from '../utils/neo4j/manager';
import logger from '../utils/logger/logsLogger';

const {
    neo4j: { globalSearchIndexes: primaryGlobalSearchIndex, templateSearchIndexPrefixes: primaryTemplateSearchIndexPrefix, stringPropertySuffix },
} = config;

export const runInTransactionAndNormalize = async <T>(
    transaction: Transaction,
    cypherQuery: string,
    normalizeFunction: (queryResult: QueryResult) => T,
    parameters?: Record<string, any>,
): Promise<T> => {
    const result = await transaction.run(cypherQuery, parameters);

    return normalizeFunction(result);
};

export default class Manager extends DefaultManagerNeo4j {
    private templateManagerService: TemplateManagerService;

    constructor(workspaceId: string) {
        super(workspaceId);
        this.templateManagerService = new TemplateManagerService(workspaceId);
    }

    private async createIndex(indexName: string, labels: string[], properties: string[], transaction: Transaction) {
        const createFullTextIndexCommand = `
        CREATE FULLTEXT INDEX \`${indexName}\` FOR (n:\`${labels.join('`|`')}\`)
        ON EACH [${properties.map((prop) => `n.${prop}`).join(', ')}]
        OPTIONS { indexConfig: { \`fulltext.analyzer\`: 'unicode_whitespace' } }`;

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

        await this.upsertSearchIndex(primaryGlobalSearchIndex, templateIds, Array.from(allTemplatesProperties));
    }

    async upsertChangedTemplateSearchIndex(changedTemplateId: string) {
        const changedTemplate = await this.templateManagerService.getEntityTemplateById(changedTemplateId);
        const relationshipReferencesProperties = await this.getRelationshipReferencesPropertiesIndex(changedTemplate);
        const allProperties = [...relationshipReferencesProperties, ...this.getTemplatePropertiesIndex(changedTemplate)];

        await this.upsertSearchIndex(`${primaryTemplateSearchIndexPrefix}${changedTemplateId}`, [changedTemplateId], allProperties);
    }

    async deleteTemplateSearchIndex(templateId: string) {
        await this.dropIndexTransaction(`${primaryTemplateSearchIndexPrefix}${templateId}`);
    }
}
