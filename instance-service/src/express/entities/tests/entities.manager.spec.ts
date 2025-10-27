import config from '../../../config';
import { IMongoEntityTemplate } from '../../../externalServices/templates/interfaces/entityTemplates';
import { getMockAdapterTemplateManager } from '../../../externalServices/tests/axios.mock';
import { mockEntityTemplatesRoutes, mockRulesRoutes } from '../../../externalServices/tests/externalServices.mock';
import Neo4jClient from '../../../utils/neo4j';
import RelationshipManager from '../../relationships/manager';
import { IEntity } from '../interface';
import EntityManager from '../manager';

const { neo4j } = config;

const defaultTemplateId = '111111111111111111111111';
const defaultRelationshipTemplateId = '222222222222222222222222';
const defaultProperties = { testProp: 'testProp' };
const relationshipTemplate = {
    _id: defaultRelationshipTemplateId,
    name: 'rel',
    displayName: 'rel',
    sourceEntityId: defaultTemplateId,
    destinationEntityId: defaultTemplateId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

const entityTemplate: IMongoEntityTemplate = {
    _id: defaultTemplateId,
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

describe('Entity manager', () => {
    const mockTemplateManager = getMockAdapterTemplateManager();

    beforeAll(async () => {
        await Neo4jClient.initialize(neo4j.url, neo4j.auth, neo4j.database);

        mockEntityTemplatesRoutes(mockTemplateManager, [entityTemplate]);
        mockRulesRoutes(mockTemplateManager, [], [defaultTemplateId]);
    });

    afterAll(async () => {
        await Neo4jClient.close();
    });

    afterEach(async () => {
        await EntityManager.deleteByTemplateId(defaultTemplateId);
        await Neo4jClient.writeTransaction(`MATCH ()-[r: \`${defaultRelationshipTemplateId}\`]-() DELETE r `, () => {});
    });

    describe('Create entity', () => {
        it('Should create new entity', async () => {
            const res = (await EntityManager.createEntity(defaultProperties, entityTemplate, [], neo4j.mockUserId)).createdEntity;

            expect(res).toBeDefined();
            expect(res.templateId).toBe(defaultTemplateId);
            expect(res.properties).toEqual(expect.objectContaining(defaultProperties));
        });
    });

    describe('Update entity', () => {
        let id: string;

        const unknownId = 'unknown_id';
        const newProperties = {
            testProp: 'newTestProp',
        };

        beforeEach(async () => {
            const { properties } = (await EntityManager.createEntity(defaultProperties, entityTemplate, [], neo4j.mockUserId)).createdEntity;

            id = properties._id;
        });

        it('Should update an entity', async () => {
            const res = await EntityManager.updateEntityById(id, newProperties, entityTemplate, [], neo4j.mockUserId).updatedEntity;

            expect(res).toBeDefined();
            expect(res.templateId).toBe(defaultTemplateId);
            expect(res.properties).toEqual(expect.objectContaining(newProperties));
        });

        it('Should fail to update an entity', async () => {
            await expect(() => EntityManager.updateEntityById(unknownId, newProperties, entityTemplate, [], neo4j.mockUserId)).rejects.toThrowError(
                `[NEO4J] entity "${unknownId}" not found`,
            );
        });

        it('Should fail to update an entity (disabled status) + unknown id', async () => {
            await expect(() => EntityManager.updateStatusById(unknownId, true, [], neo4j.mockUserId)).rejects.toThrowError(
                `[NEO4J] entity "${unknownId}" not found`,
            );
        });

        it('Should fail to update an entity (disabled status)', async () => {
            await EntityManager.updateStatusById(id, true, [], neo4j.mockUserId);

            await expect(() => EntityManager.updateEntityById(id, newProperties, entityTemplate, [], neo4j.mockUserId)).rejects.toThrowError(
                `[NEO4J] cannot update disabled entity.`,
            );
        });
    });

    describe('Get entity by id', () => {
        let id: string;

        beforeEach(async () => {
            const { properties } = (await EntityManager.createEntity(defaultProperties, entityTemplate, [], neo4j.mockUserId)).createdEntity;

            id = properties._id;
        });

        it('Should get an entity by id', async () => {
            const res = await EntityManager.getEntityById(id);

            expect(res).toBeDefined();
            expect(res.templateId).toBe(defaultTemplateId);
            expect(res.properties).toEqual(expect.objectContaining(defaultProperties));
        });

        it('Should fail to get an entity', async () => {
            const unknownId = 'unknown_id';

            await expect(() => EntityManager.getEntityById(unknownId)).rejects.toThrowError(`[NEO4J] entity "${unknownId}" not found`);
        });
    });

    describe('Get entity by id (expanded mode)', () => {
        let firstEntity: IEntity;
        let id: string;
        const mapTemplate = new Map<string, IMongoEntityTemplate>();
        mapTemplate.set(defaultTemplateId, entityTemplate);

        beforeEach(async () => {
            firstEntity = (await EntityManager.createEntity(defaultProperties, entityTemplate, [], neo4j.mockUserId)).createdEntity;

            id = firstEntity.properties._id;
        });

        it('Should get an entity by id (expanded mode - without connections)', async () => {
            const res = await EntityManager.getExpandedGraphById(
                id,
                { disabled: false, templateIds: [defaultTemplateId], expandedParams: { [id]: 1 }, filters: {} },
                mapTemplate,
                neo4j.mockUserId,
            );

            expect(res.entity.templateId).toBe(defaultTemplateId);
            expect(res.entity.properties).toEqual(expect.objectContaining(defaultProperties));
            expect(res.connections.length).toStrictEqual(0);
        });

        it('Should fail to get an entity (expanded mode - without connections)', async () => {
            const unknownId = 'unknown_id';

            await expect(() =>
                EntityManager.getExpandedGraphById(
                    unknownId,
                    { disabled: false, templateIds: [defaultTemplateId], expandedParams: { [unknownId]: 1 }, filters: {} },
                    mapTemplate,
                    neo4j.mockUserId,
                ),
            ).rejects.toThrowError(`[NEO4J] entity "${unknownId}" not found`);
        });

        describe('With one connection', () => {
            const secondEntityProperties = { testProp: 'secondTestProp' };

            beforeEach(async () => {
                // Create second entity
                const secondEntity = (await EntityManager.createEntity(secondEntityProperties, entityTemplate, [], neo4j.mockUserId)).createdEntity;

                // Create relationship between two entities
                await RelationshipManager.createRelationshipByEntityIds(
                    {
                        templateId: defaultRelationshipTemplateId,
                        properties: defaultProperties,
                        sourceEntityId: id,
                        destinationEntityId: secondEntity.properties._id,
                    },
                    relationshipTemplate,
                    [],
                    neo4j.mockUserId,
                );
            });

            it('Should get an entity by id (without connections)', async () => {
                const res = await EntityManager.getExpandedGraphById(
                    id,
                    { disabled: true, templateIds: [defaultTemplateId], expandedParams: { [id]: 1 }, filters: {} },
                    mapTemplate,
                    neo4j.mockUserId,
                );

                expect(res.entity.templateId).toBe(defaultTemplateId);
                expect(res.entity.properties).toEqual(expect.objectContaining(defaultProperties));
                expect(res.connections.length).toStrictEqual(0);
            });

            it('Get entity and its connections', async () => {
                const res = await EntityManager.getExpandedGraphById(
                    id,
                    { disabled: false, templateIds: [defaultTemplateId], expandedParams: { [id]: 1 }, filters: {} },
                    mapTemplate,
                    neo4j.mockUserId,
                );

                expect(res).toBeDefined();
                expect(res.entity.templateId).toBe(defaultTemplateId);
                expect(res.entity.properties).toEqual(expect.objectContaining(defaultProperties));

                expect(res.connections[0]).toBeDefined();

                expect(res.connections[0].sourceEntity.templateId).toBe(defaultTemplateId);
                expect(res.connections[0].sourceEntity.properties).toEqual(expect.objectContaining(defaultProperties));

                expect(res.connections[0].relationship.templateId).toBe(defaultRelationshipTemplateId);
                expect(res.connections[0].relationship.properties).toEqual(expect.objectContaining(defaultProperties));

                expect(res.connections[0].destinationEntity.templateId).toBe(defaultTemplateId);
                expect(res.connections[0].destinationEntity.properties).toEqual(expect.objectContaining(secondEntityProperties));
            });
        });

        describe('With two connections', () => {
            const secondEntityProperties = { testProp: 'testPropTwo' };
            const thirdEntityProperties = { testProp: 'testPropThree' };

            beforeEach(async () => {
                // Create second entity
                const secondEntity = (await EntityManager.createEntity(secondEntityProperties, entityTemplate, [], neo4j.mockUserId)).createdEntity;

                // Create relationship between two entities
                await RelationshipManager.createRelationshipByEntityIds(
                    {
                        templateId: defaultRelationshipTemplateId,
                        properties: defaultProperties,
                        sourceEntityId: id,
                        destinationEntityId: secondEntity.properties._id,
                    },
                    relationshipTemplate,
                    [],
                    neo4j.mockUserId,
                );

                // Create third entity
                const thirdEntity = (await EntityManager.createEntity(thirdEntityProperties, entityTemplate, [], neo4j.mockUserId)).createdEntity;

                // Create relationship between two entities
                await RelationshipManager.createRelationshipByEntityIds(
                    {
                        templateId: defaultRelationshipTemplateId,
                        properties: defaultProperties,
                        sourceEntityId: secondEntity.properties._id,
                        destinationEntityId: thirdEntity.properties._id,
                    },
                    relationshipTemplate,
                    [],
                    neo4j.mockUserId,
                );
            });

            it('Get entity and its connections', async () => {
                const res = await EntityManager.getExpandedGraphById(
                    id,
                    { disabled: false, templateIds: [defaultTemplateId], expandedParams: { [id]: 2 }, filters: {} },
                    mapTemplate,
                    neo4j.mockUserId,
                );

                expect(res).toBeDefined();
                expect(res.entity.templateId).toBe(defaultTemplateId);
                expect(res.entity.properties).toEqual(expect.objectContaining(defaultProperties));

                expect(res.connections[0]).toBeDefined();

                expect(res.connections[0].sourceEntity.templateId).toBe(defaultTemplateId);
                expect(res.connections[0].sourceEntity.properties).toEqual(expect.objectContaining(defaultProperties));

                expect(res.connections[0].relationship.templateId).toBe(defaultRelationshipTemplateId);
                expect(res.connections[0].relationship.properties).toEqual(expect.objectContaining(defaultProperties));

                expect(res.connections[0].destinationEntity.templateId).toBe(defaultTemplateId);
                expect(res.connections[0].destinationEntity.properties).toEqual(expect.objectContaining(secondEntityProperties));

                expect(res.connections[1].sourceEntity.templateId).toBe(defaultTemplateId);
                expect(res.connections[1].sourceEntity.properties).toEqual(expect.objectContaining(secondEntityProperties));

                expect(res.connections[1].relationship.templateId).toBe(defaultRelationshipTemplateId);
                expect(res.connections[1].relationship.properties).toEqual(expect.objectContaining(defaultProperties));

                expect(res.connections[1].destinationEntity.templateId).toBe(defaultTemplateId);
                expect(res.connections[1].destinationEntity.properties).toEqual(expect.objectContaining(thirdEntityProperties));
            });
        });
    });

    describe('Delete an entity', () => {
        let firstEntity: IEntity;
        let id: string;

        beforeEach(async () => {
            firstEntity = (await EntityManager.createEntity(defaultProperties, entityTemplate, [], neo4j.mockUserId)).createdEntity;

            id = firstEntity.properties._id;
        });

        it('Delete an entity (deleteAllRelationships=false)', async () => {
            const res = await EntityManager.deleteEntityById(id, false);

            expect(res).toStrictEqual(id);
        });

        describe('With connections to entity', () => {
            beforeEach(async () => {
                // Create second entity
                const secondEntityProperties = { testProp: 'testProp' };

                const secondEntity = (await EntityManager.createEntity(secondEntityProperties, entityTemplate, [], neo4j.mockUserId)).createdEntity;

                // Create relationship between two entities
                await RelationshipManager.createRelationshipByEntityIds(
                    {
                        templateId: defaultRelationshipTemplateId,
                        properties: defaultProperties,
                        sourceEntityId: id,
                        destinationEntityId: secondEntity.properties._id,
                    },
                    relationshipTemplate,
                    [],
                    neo4j.mockUserId,
                );
            });

            it('Delete an entity (deleteAllRelationships=false - but has connections)', async () => {
                await expect(() => EntityManager.deleteEntityById(id, false)).rejects.toThrowError(
                    `[NEO4J] entity "${id}" has existing relationships. Delete them first.`,
                );
            });

            it('Delete an entity (deleteAllRelationships=true)', async () => {
                const res = await EntityManager.deleteEntityById(id, true);

                expect(res).toStrictEqual(id);
            });
        });
    });
});
