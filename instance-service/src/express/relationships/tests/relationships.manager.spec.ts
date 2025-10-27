import config from '../../../config';
import { IMongoEntityTemplate } from '../../../externalServices/templates/interfaces/entityTemplates';
import { getMockAdapterTemplateManager } from '../../../externalServices/tests/axios.mock';
import { mockRelationshipTemplatesRoutes, mockRulesRoutes } from '../../../externalServices/tests/externalServices.mock';
import Neo4jClient from '../../../utils/neo4j';
import { IEntity } from '../../entities/interface';
import EntityManager from '../../entities/manager';
import { IRelationship } from '../interfaces';
import RelationshipManager from '../manager';

const { neo4j } = config;

const unknownId = '555555555555555555555555';
const defaultRelationshipTemplateId = '444444444444444444444444';
const defaultEntityTemplateId = '333333333333333333333333';
const defaultProperties = { testProp: 'testProp' };
const relationshipTemplate = {
    _id: defaultRelationshipTemplateId,
    name: 'rel',
    displayName: 'rel',
    sourceEntityId: defaultEntityTemplateId,
    destinationEntityId: defaultEntityTemplateId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

const entityTemplate: IMongoEntityTemplate = {
    _id: defaultEntityTemplateId,
    propertiesOrder: ['testProp'],
    propertiesTypeOrder: ['properties', 'attachmentProperties'],
    propertiesPreview: ['testProp'],
    name: 'template',
    displayName: 'template',
    category: '999999999999999999999999',
    properties: {
        type: 'object',
        properties: {
            testProp: { type: 'string', title: 'testProp' },
        },
        hide: [],
    },
    disabled: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

describe('Relationship manager', () => {
    const mockTemplateManager = getMockAdapterTemplateManager();

    let firstEntity: IEntity;
    let entityId: string;

    let secondEntity: IEntity;
    let secondEntityId: string;

    let relationshipInstance: IRelationship;
    let relId: string;

    beforeAll(async () => {
        await Neo4jClient.initialize(neo4j.url, neo4j.auth, neo4j.database);

        mockRulesRoutes(mockTemplateManager, [], [defaultEntityTemplateId]);
        mockRelationshipTemplatesRoutes(mockTemplateManager, [relationshipTemplate]);
    });

    afterAll(async () => {
        await Neo4jClient.close();
    });

    afterEach(async () => {
        await EntityManager.deleteByTemplateId(defaultEntityTemplateId);
        await Neo4jClient.writeTransaction(`MATCH ()-[r: \`${defaultRelationshipTemplateId}\`]-() DELETE r `, () => {});
    });

    beforeEach(async () => {
        firstEntity = (await EntityManager.createEntity(defaultProperties, entityTemplate, [], neo4j.mockUserId)).createdEntity;

        entityId = firstEntity.properties._id;

        // Create second entities
        secondEntity = (await EntityManager.createEntity(defaultProperties, entityTemplate, [], neo4j.mockUserId)).createdEntity;

        secondEntityId = secondEntity.properties._id;

        // Create relationship between two entities
        relationshipInstance = await RelationshipManager.createRelationshipByEntityIds(
            {
                templateId: defaultRelationshipTemplateId,
                properties: defaultProperties,
                sourceEntityId: entityId,
                destinationEntityId: secondEntityId,
            },
            relationshipTemplate,
            [],
            neo4j.mockUserId,
        );

        relId = relationshipInstance.properties._id;
    });

    describe('Get relationship', () => {
        it('Should get a new relationship', async () => {
            const relationship = await RelationshipManager.getRelationshipById(relId);

            expect(relationship).toEqual(expect.objectContaining(relationshipInstance));
        });

        it('Should fail to get an existing relationship', async () => {
            await expect(() => RelationshipManager.getRelationshipById(unknownId)).rejects.toThrowError(
                `[NEO4J] relationship "${unknownId}" not found`,
            );
        });
    });

    describe('Create relationship', () => {
        it('Should fail to create a new relationship because already exists', async () => {
            await expect(() =>
                RelationshipManager.createRelationshipByEntityIds(
                    {
                        templateId: defaultRelationshipTemplateId,
                        sourceEntityId: entityId,
                        destinationEntityId: secondEntityId,
                        properties: defaultProperties,
                    },
                    relationshipTemplate,
                    [],
                    neo4j.mockUserId,
                ),
            ).rejects.toThrowError(`[NEO4J] relationship already exists between requested entities.`);
        });
    });

    describe('Get relationship count by templateId', () => {
        it('Should return number of relationships by templateId', async () => {
            const relationshipsCount = await RelationshipManager.getRelationshipsCountByTemplateId(defaultRelationshipTemplateId);

            expect(relationshipsCount).toStrictEqual(1);
        });

        it('Should fail to get an existing relationship', async () => {
            const relationshipsCount = await RelationshipManager.getRelationshipsCountByTemplateId(unknownId);

            expect(relationshipsCount).toStrictEqual(0);
        });
    });

    describe('Update relationship', () => {
        it('Should update an existing relationship', async () => {
            const relationship = await RelationshipManager.updateRelationshipPropertiesById(relId, { testProp: 'newTestProp' });

            expect(relationship.templateId).toStrictEqual(defaultRelationshipTemplateId);
            expect(relationship.properties).toEqual(expect.objectContaining({ testProp: 'newTestProp' }));
            expect(relationship.sourceEntityId).toStrictEqual(entityId);
            expect(relationship.destinationEntityId).toStrictEqual(secondEntityId);
        });

        it('Should fail to update an existing relationship', async () => {
            await expect(() => RelationshipManager.updateRelationshipPropertiesById(unknownId, { testProp: 'newTestProp' })).rejects.toThrowError(
                `[NEO4J] relationship "${unknownId}" not found`,
            );
        });
    });

    describe('Delete relationship', () => {
        it('Should delete an existing relationship', async () => {
            const relationship = await RelationshipManager.deleteRelationshipById(relId, [], neo4j.mockUserId);

            expect(relationship).toEqual(expect.objectContaining(relationshipInstance));
        });

        it('Should fail to delete an existing relationship', async () => {
            await expect(() => RelationshipManager.deleteRelationshipById(unknownId, [], neo4j.mockUserId)).rejects.toThrowError(
                `[NEO4J] relationship "${unknownId}" not found`,
            );
        });
    });

    describe('Relationships connections', () => {
        it('Should get relationships by ids', async () => {
            const connections = await RelationshipManager.getRelationshipsByIds([relId]);

            expect(connections.length).toStrictEqual(1);
            expect(connections[0]).toEqual(expect.objectContaining(relationshipInstance));
        });
    });
});
