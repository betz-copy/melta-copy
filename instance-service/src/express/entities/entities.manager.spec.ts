import config from '../../config';
import Neo4jClient from '../../utils/neo4j';

import EntityManager from './manager';
import RelationshipManager from '../relationships/manager';

const { neo4j } = config;

const defaultTemplateId = '2';
const defaultRelationshipTemplateId = 'rel-entity';
const defaultProperties = { testProp: 'testProp' };
const defaultEntity = {
    templateId: defaultTemplateId,
    properties: defaultProperties,
};

describe('Entity manager', () => {
    beforeAll(async () => {
        await Neo4jClient.initialize(neo4j.url, neo4j.auth);
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

        const newProperties = {
            testProp: 'newTestProp',
            disabled: true,
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
            const unknownId = 'unknown_id';

            await expect(() => EntityManager.updateEntityById(unknownId, newProperties)).rejects.toThrowError(
                `[NEO4J] entity "${unknownId}" not found`,
            );
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
        let id: string;

        beforeEach(async () => {
            const { properties } = await EntityManager.createEntity(defaultEntity);

            id = properties._id;
        });

        it('Should get an entity by id (expanded mode - without connections)', async () => {
            const res = await EntityManager.getExpandedEntityById(id);

            expect(res.entity.templateId).toBe(defaultTemplateId);
            expect(res.entity.properties).toEqual(expect.objectContaining(defaultProperties));
            expect(res.connections.length).toStrictEqual(0);
        });

        it('Should fail to get an entity (expanded mode - without connections)', async () => {
            const unknownId = 'unknown_id';

            await expect(() => EntityManager.getExpandedEntityById(unknownId)).rejects.toThrowError(`[NEO4J] entity "${unknownId}" not found`);
        });

        describe('With connections', () => {
            const secondEntityProperties = { testProp: 'testProp' };

            beforeEach(async () => {
                // Create second entities
                const secondEntity = await EntityManager.createEntity({ templateId: defaultTemplateId, properties: secondEntityProperties });

                // Create relationship between two entities
                await RelationshipManager.createRelationshipByEntityIds({
                    templateId: defaultRelationshipTemplateId,
                    properties: defaultProperties,
                    sourceEntityId: id,
                    destinationEntityId: secondEntity.properties._id,
                });
            });

            it('Get entity and its connections', async () => {
                const res = await EntityManager.getExpandedEntityById(id);

                expect(res).toBeDefined();
                expect(res.entity.templateId).toBe(defaultTemplateId);
                expect(res.entity.properties).toEqual(expect.objectContaining(defaultProperties));

                expect(res.connections[0]).toBeDefined();

                expect(res.connections[0].relationship.templateId).toBe(defaultRelationshipTemplateId);
                expect(res.connections[0].relationship.properties).toEqual(expect.objectContaining(defaultProperties));

                expect(res.connections[0].entity.templateId).toBe(defaultTemplateId);
                expect(res.connections[0].entity.properties).toEqual(expect.objectContaining(secondEntityProperties));
            });
        });
    });

    describe('Delete an entity', () => {
        let id: string;

        beforeEach(async () => {
            const { properties } = await EntityManager.createEntity(defaultEntity);

            id = properties._id;
        });

        it('Delete an entity (deleteAllRelationships=false)', async () => {
            const res = await EntityManager.deleteEntityById(id, false);

            expect(res).toStrictEqual(id);
        });

        describe('With connections to entity', () => {
            beforeEach(async () => {
                // Create second entities
                const secondEntityProperties = { testProp: 'testProp' };

                const secondEntity = await EntityManager.createEntity({ templateId: defaultTemplateId, properties: secondEntityProperties });

                // Create relationship between two entities
                await RelationshipManager.createRelationshipByEntityIds({
                    templateId: defaultRelationshipTemplateId,
                    properties: defaultProperties,
                    sourceEntityId: id,
                    destinationEntityId: secondEntity.properties._id,
                });
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
