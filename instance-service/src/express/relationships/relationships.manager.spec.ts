import config from '../../config';
import Neo4jClient from '../../utils/neo4j';

import EntityManager from '../entities/manager';
import RelationshipManager from './manager';

const { neo4j } = config;

const unknownId = 'unkownId';
const defaultRelationshipTemplateId = 'rel';
const defaultEntityTemplateId = '5';
const defaultProperties = { testProp: 'testProp' };
const defaultEntity = {
    templateId: defaultEntityTemplateId,
    properties: defaultProperties,
};

describe('Relationship manager', () => {
    let entityId: string;
    let relId: string;

    beforeAll(async () => {
        await Neo4jClient.initialize(neo4j.url, neo4j.auth);
    });

    afterAll(async () => {
        await Neo4jClient.close();
    });

    afterEach(async () => {
        await EntityManager.deleteByTemplateId(defaultEntityTemplateId);
        await Neo4jClient.writeTransaction(`match ()-[r:  \`${defaultRelationshipTemplateId}\`]-() delete r `, () => {});
    });

    beforeEach(async () => {
        const { properties: entityProperties } = await EntityManager.createEntity(defaultEntity);

        entityId = entityProperties._id;

        // Create second entities
        const secondEntity = await EntityManager.createEntity(defaultEntity);

        // Create relationship between two entities
        const { properties: relProperties } = await RelationshipManager.createRelationshipByEntityIds({
            templateId: defaultRelationshipTemplateId,
            properties: defaultProperties,
            sourceEntityId: entityId,
            destinationEntityId: secondEntity.properties._id,
        });

        relId = relProperties._id;
    });

    describe('Get relationship', () => {
        it('Should get a new relationship', async () => {
            const relationship = await RelationshipManager.getRelationshipById(relId);

            expect(relationship.templateId).toStrictEqual(defaultRelationshipTemplateId);
            expect(relationship.properties).toEqual(expect.objectContaining(defaultProperties));
        });

        it('Should fail to get an existing relationship', async () => {
            await expect(() => RelationshipManager.getRelationshipById(unknownId)).rejects.toThrowError(
                `[NEO4J] relationship "${unknownId}" not found`,
            );
        });
    });

    describe('Update relationship', () => {
        it('Should update an existing relationship', async () => {
            const relationship = await RelationshipManager.updateRelationshipPropertiesById(relId, { testProp: 'newTestProp' });

            expect(relationship.templateId).toStrictEqual(defaultRelationshipTemplateId);
            expect(relationship.properties).toEqual(expect.objectContaining({ testProp: 'newTestProp' }));
        });

        it('Should fail to update an existing relationship', async () => {
            await expect(() => RelationshipManager.updateRelationshipPropertiesById(unknownId, { testProp: 'newTestProp' })).rejects.toThrowError(
                `[NEO4J] relationship "${unknownId}" not found`,
            );
        });
    });

    describe('Delete relationship', () => {
        it('Should delete an existing relationship', async () => {
            await RelationshipManager.deleteRelationshipById(relId);
        });

        it('Should fail to delete an existing relationship', async () => {
            await expect(() => RelationshipManager.deleteRelationshipById(unknownId)).rejects.toThrowError(
                `[NEO4J] relationship "${unknownId}" not found`,
            );
        });
    });
});
