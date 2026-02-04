import { IEntityTemplate, IMongoEntityTemplate, logger } from '@microservices/shared';
import { QueryResult, Transaction } from 'neo4j-driver';
import config from '../config';
import TemplateManagerService from '../externalServices/entityTemplateManager';
import DefaultManagerNeo4j from '../utils/neo4j/manager';

const {
    neo4j: {
        globalSearchIndexPrefix,
        templateSearchIndexPrefix,
        stringPropertySuffix,
        indexPropertiesLimit,
        booleanPropertySuffix,
        filePropertySuffix,
        booleanHeYesValue,
        booleanHeNoValue,
        dummyTemplateId,
    },
    fileIdLength,
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
                logger.error(`Failed to create primary index for ${primaryIndexName}`, {
                    error,
                });
            });
    }

    private getTemplatePropertiesIndex(template: IEntityTemplate) {
        const templateProperties = Object.entries(template.properties.properties).map(([key, value]) => {
            const { type, format, items } = value;

            if (type === 'boolean') {
                return `${key}${booleanPropertySuffix}`;
            }

            if (format === 'fileId' || items?.format === 'fileId') {
                return `${key}${filePropertySuffix}`;
            }

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
                    this.getTemplatePropertiesIndex(relatedTemplate).forEach((innerProperty) => {
                        relationshipReferencesProperties.push(
                            `${key}.properties.${innerProperty}${config.neo4j.relationshipReferencePropertySuffix}`,
                        );
                    });
                }
            }),
        );

        return relationshipReferencesProperties;
    }

    private getUserPropertiesIndex(template: IEntityTemplate) {
        const userProperties: string[] = [];

        Object.entries(template.properties.properties).map(async ([key, value]) => {
            if (value.format === 'user') {
                userProperties.push(
                    ...config.neo4j.userOriginalAndSuffixFieldsMap.map(
                        (userField) => `${key}${userField.suffixFieldName}${config.neo4j.userFieldPropertySuffix}`,
                    ),
                );
            }
            if (value.items?.format === 'user') {
                userProperties.push(
                    ...config.neo4j.usersArrayOriginalAndSuffixFieldsMap.map(
                        (userField) => `${key}${userField.suffixFieldName}${config.neo4j.usersFieldsPropertySuffix}`,
                    ),
                );
            }
        });

        return userProperties;
    }

    async upsertGlobalSearchIndex() {
        const templates = await this.templateManagerService.searchEntityTemplates();

        const templateIds = templates.map((template) => template._id);
        const allTemplatesProperties = new Set<string>();

        templates.forEach((template) => {
            this.getTemplatePropertiesIndex(template).forEach((property) => {
                allTemplatesProperties.add(property);
            });
        });

        await Promise.all(
            templates.map(async (template) => {
                const relationshipReferencesProperties = await this.getRelationshipReferencesPropertiesIndex(template);
                const userProperties = this.getUserPropertiesIndex(template);
                [...relationshipReferencesProperties, ...userProperties].forEach((property) => {
                    allTemplatesProperties.add(property);
                });
            }),
        );

        const propertiesArray = Array.from(allTemplatesProperties);
        if (propertiesArray.length >= indexPropertiesLimit) {
            const propertiesChunks: string[][] = [];
            for (let i = 0; i < propertiesArray.length; i += indexPropertiesLimit) {
                propertiesChunks.push(propertiesArray.slice(i, i + indexPropertiesLimit));
            }
            await Promise.all(
                propertiesChunks.map(async (properties, index) => {
                    await this.upsertSearchIndex(`${globalSearchIndexPrefix}_${index + 1}`, templateIds, properties);
                }),
            );
        } else {
            // https://github.com/neo4j/neo4j/issues/12288
            // The above issue explains that neo4j doesn't like it when you have 2 indexes with identical props and labels.
            // It occurs when have 0 indexes in a workspace because we try to create global search index and an index for the templateId.
            // So we insert a dummy property Id in order for it work
            const shouldAddDummyProperty = templateIds.length <= 1;
            await this.upsertSearchIndex(
                globalSearchIndexPrefix,
                [...templateIds, ...(shouldAddDummyProperty ? [dummyTemplateId] : [])],
                Array.from(allTemplatesProperties),
            );
        }
    }

    async upsertChangedTemplateSearchIndex(changedTemplateId: string) {
        const changedTemplate = await this.templateManagerService.getEntityTemplateById(changedTemplateId);
        const relationshipReferencesProperties = await this.getRelationshipReferencesPropertiesIndex(changedTemplate);
        const userProperties = this.getUserPropertiesIndex(changedTemplate);

        const allProperties = [...relationshipReferencesProperties, ...userProperties, ...this.getTemplatePropertiesIndex(changedTemplate)];

        await this.upsertSearchIndex(`${templateSearchIndexPrefix}${changedTemplateId}`, [changedTemplateId], allProperties);
    }

    async deleteTemplateSearchIndex(templateId: string) {
        await this.dropIndexTransaction(`${templateSearchIndexPrefix}${templateId}`);
    }

    async createAllIndexes() {
        console.log('INFO: Start creating all indexes of templates');
        const templates = await this.templateManagerService.searchEntityTemplates();
        await Promise.all(
            templates.map(async (template) => {
                const templateProperties = this.getTemplatePropertiesIndex(template);
                const relationshipReferencesProperties = await this.getRelationshipReferencesPropertiesIndex(template);
                const allProperties = [...relationshipReferencesProperties, ...templateProperties];

                await this.upsertSearchIndex(`${templateSearchIndexPrefix}${template._id}`, [template._id], allProperties);
            }),
        );
        console.log('INFO: Finished creating all indexes of templates');

        console.log('INFO: Start creating global search index');
        await this.upsertGlobalSearchIndex();
        console.log('INFO: Finished creating global search index');
    }

    async deleteAllIndexes() {
        console.log('INFO: Start deleting all indexes of templates');
        const templates = await this.templateManagerService.searchEntityTemplates();
        await Promise.all(
            templates.map(async (template) => {
                await this.dropIndexTransaction(`${templateSearchIndexPrefix}${template._id}`);
            }),
        );
        console.log('INFO: Finished deleting all indexes of templates');

        console.log('INFO: Start deleting global search index');
        await this.dropIndexTransaction(globalSearchIndexPrefix);
        console.log('INFO: Finished deleting global search index');
    }

    isBooleanPropsExists(propertyNames: string[]) {
        return propertyNames.map((prop) => `((n.${prop} = true OR n.${prop} = false) AND n.${prop}${booleanPropertySuffix} IS NULL)`).join(' OR ');
    }

    createFixedBooleanProps(propertyNames: string[]) {
        return propertyNames
            .map(
                (prop) =>
                    `n.${prop}${booleanPropertySuffix} = CASE n.${prop} WHEN true THEN '${booleanHeYesValue}' WHEN false THEN '${booleanHeNoValue}' END`,
            )
            .join(', ');
    }

    isFilePropsExists(propertyNames: string[]) {
        return propertyNames.map((prop) => `(n.${prop} IS NOT NULL AND n.${prop}${filePropertySuffix} IS NULL)`).join(' OR ');
    }

    createFixedFileProps(propertyNames: string[]) {
        return propertyNames.map((prop) => `n.${prop}${filePropertySuffix} = substring(n.${prop}, ${fileIdLength})`).join(', ');
    }

    createFixedFilesArrayProps(propertyNames: string[]) {
        return propertyNames.map((prop) => `n.${prop}${filePropertySuffix} = [x IN n.${prop} | substring(x, ${fileIdLength})]`).join(', ');
    }

    // Update all boolean and file properties of a template script
    async updateTemplateNonStringProps(template: IMongoEntityTemplate) {
        try {
            console.log('INFO: Start updating non-string properties of template: ', template._id);
            const booleanProperties: string[] = [];
            const fileProperties: string[] = [];
            const arrayFileProperties: string[] = [];

            Object.entries(template.properties.properties).forEach(([key, value]) => {
                if (value.type === 'boolean') booleanProperties.push(key);
                if (value.format === 'fileId') fileProperties.push(key);
                if (value.items?.format === 'fileId') arrayFileProperties.push(key);
            });

            const addFixedBooleanPropsQuery = `
                MATCH (n:\`${template._id}\`)
                WHERE ${this.isBooleanPropsExists(booleanProperties)}
                SET
                ${this.createFixedBooleanProps(booleanProperties)}
                RETURN count(n) AS nodesUpdated
            `;
            const addFixedFilePropsQuery = `
                MATCH (n:\`${template._id}\`)
                WHERE ${this.isFilePropsExists(fileProperties)} 
                SET
                ${this.createFixedFileProps(fileProperties)}
                RETURN count(n) AS nodesUpdated
            `;
            const addFixedArrayFilePropsQuery = `
                MATCH (n:\`${template._id}\`)
                WHERE ${this.isFilePropsExists(arrayFileProperties)}
                SET
                ${this.createFixedFilesArrayProps(arrayFileProperties)}
                RETURN count(n) AS nodesUpdated
            `;

            const { updateBooleanRes, updateFileRes, updateArrayFileRes } = await this.neo4jClient.performComplexTransaction(
                'writeTransaction',
                async (transaction) => {
                    let updateBooleanPropsRes: QueryResult | undefined;
                    let updateFilePropsRes: QueryResult | undefined;
                    let updateArrayFilePropsRes: QueryResult | undefined;

                    if (booleanProperties.length > 0) {
                        console.log('INFO: Running addFixedBooleanProps query: ', addFixedBooleanPropsQuery);
                        updateBooleanPropsRes = await transaction.run(addFixedBooleanPropsQuery);
                    }
                    if (fileProperties.length > 0) {
                        console.log('INFO: Running addFixedFileProps query: ', addFixedFilePropsQuery);
                        updateFilePropsRes = await transaction.run(addFixedFilePropsQuery);
                    }
                    if (arrayFileProperties.length > 0) {
                        console.log('INFO: Running addFixedArrayFileProps query: ', addFixedArrayFilePropsQuery);
                        updateArrayFilePropsRes = await transaction.run(addFixedArrayFilePropsQuery);
                    }

                    return {
                        updateBooleanRes: updateBooleanPropsRes,
                        updateFileRes: updateFilePropsRes,
                        updateArrayFileRes: updateArrayFilePropsRes,
                    };
                },
            );

            const nodesUpdatedBoolean = updateBooleanRes?.records[0]?.get('nodesUpdated');
            console.log('INFO: Finished updating boolean properties of template: ', template._id, ' nodes updated: ', nodesUpdatedBoolean);
            const nodesUpdatedFile = updateFileRes?.records[0]?.get('nodesUpdated');
            console.log('INFO: Finished updating file properties of template: ', template._id, ' nodes updated: ', nodesUpdatedFile);
            const nodesUpdatedArrayFile = updateArrayFileRes?.records[0]?.get('nodesUpdated');
            console.log('INFO: Finished updating array file properties of template: ', template._id, ' nodes updated: ', nodesUpdatedArrayFile);
        } catch (error) {
            console.log('ERROR: Failed to update non-string properties of template: ', template._id, ' error: ', error);
        }
    }

    async updateAllNonStringProps() {
        console.log('INFO: Start updating all non-string properties of templates');
        const templates = await this.templateManagerService.searchEntityTemplates();

        await Promise.all(templates.map((template) => this.updateTemplateNonStringProps(template)));
        console.log('INFO: Finished updating all non-string properties of templates');
    }
}
