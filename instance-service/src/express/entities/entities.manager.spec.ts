import config from '../../config';
import Neo4jClient from '../../utils/neo4j';

import EntityManager from './manager';
import RelationshipManager from '../relationships/manager';
import { IEntity } from './interface';

const { neo4j } = config;

const defaultTemplateId = '111111111111111111111111';
const defaultRelationshipTemplateId = '222222222222222222222222';
const defaultProperties = { testProp: 'testProp' };
const defaultEntity = {
    templateId: defaultTemplateId,
    properties: defaultProperties,
};
const relationshipTemplate = {
    _id: defaultRelationshipTemplateId,
    name: 'rel',
    displayName: 'rel',
    sourceEntityId: defaultTemplateId,
    destinationEntityId: defaultTemplateId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

describe('Entity manager', () => {
    beforeAll(async () => {
        await Neo4jClient.initialize(neo4j.url, neo4j.auth, neo4j.database);
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
            const res = await EntityManager.createEntity(defaultEntity);

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
            const { properties } = await EntityManager.createEntity({ templateId: defaultTemplateId, properties: defaultProperties });

            id = properties._id;
        });

        it('Should update an entity', async () => {
            const res = await EntityManager.updateEntityById(id, newProperties);

            expect(res).toBeDefined();
            expect(res.templateId).toBe(defaultTemplateId);
            expect(res.properties).toEqual(expect.objectContaining(newProperties));
        });

        it('Should fail to update an entity', async () => {
            await expect(() => EntityManager.updateEntityById(unknownId, newProperties)).rejects.toThrowError(
                `[NEO4J] entity "${unknownId}" not found`,
            );
        });

        it('Should fail to update an entity (disabled status) + unknown id', async () => {
            await expect(() => EntityManager.updateStatusById(unknownId, true)).rejects.toThrowError(`[NEO4J] entity "${unknownId}" not found`);
        });

        it('Should fail to update an entity (disabled status)', async () => {
            await EntityManager.updateStatusById(id, true);

            await expect(() => EntityManager.updateEntityById(id, newProperties)).rejects.toThrowError(`[NEO4J] cannot update disabled entity.`);
        });
    });

    describe('Get entity by id', () => {
        let id: string;

        beforeEach(async () => {
            const { properties } = await EntityManager.createEntity(defaultEntity);

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

        beforeEach(async () => {
            firstEntity = await EntityManager.createEntity(defaultEntity);

            id = firstEntity.properties._id;
        });

        it('Should get an entity by id (expanded mode - without connections)', async () => {
            const res = await EntityManager.getExpandedEntityById(id, false, [defaultTemplateId], 1);

            expect(res.entity.templateId).toBe(defaultTemplateId);
            expect(res.entity.properties).toEqual(expect.objectContaining(defaultProperties));
            expect(res.connections.length).toStrictEqual(0);
        });

        it('Should fail to get an entity (expanded mode - without connections)', async () => {
            const unknownId = 'unknown_id';

            await expect(() => EntityManager.getExpandedEntityById(unknownId, false, [defaultTemplateId], 1)).rejects.toThrowError(
                `[NEO4J] entity "${unknownId}" not found`,
            );
        });

        describe('With one connection', () => {
            const secondEntityProperties = { testProp: 'secondTestProp' };

            beforeEach(async () => {
                // Create second entity
                const secondEntity = await EntityManager.createEntity({ templateId: defaultTemplateId, properties: secondEntityProperties });

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
                );
            });

            it('Should get an entity by id (without connections)', async () => {
                const res = await EntityManager.getExpandedEntityById(id, true, [defaultTemplateId], 1);

                expect(res.entity.templateId).toBe(defaultTemplateId);
                expect(res.entity.properties).toEqual(expect.objectContaining(defaultProperties));
                expect(res.connections.length).toStrictEqual(0);
            });

            it('Get entity and its connections', async () => {
                const res = await EntityManager.getExpandedEntityById(id, false, [defaultTemplateId], 1);

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
                const secondEntity = await EntityManager.createEntity({ templateId: defaultTemplateId, properties: secondEntityProperties });

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
                );

                // Create third entity
                const thirdEntity = await EntityManager.createEntity({ templateId: defaultTemplateId, properties: thirdEntityProperties });

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
                );
            });

            it('Get entity and its connections', async () => {
                const res = await EntityManager.getExpandedEntityById(id, false, [defaultTemplateId], 2);

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
            firstEntity = await EntityManager.createEntity(defaultEntity);

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

                const secondEntity = await EntityManager.createEntity({ templateId: defaultTemplateId, properties: secondEntityProperties });

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
