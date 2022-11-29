import { IAGGridRequest } from '../../../utils/agGrid/interfaces';
import Neo4jClient from '../../../utils/neo4j';
import RedisClient from '../../../utils/redis';
import { IEntity } from '../interface';
import EntityManager from '../manager';
import config from '../../../config';
import { IMongoEntityTemplate } from '../../../externalServices/entityTemplateManager';

const { neo4j, redis } = config;

const defaultTemplateId = '1';
const defaultProperties = { testProp: 'testProp' };

const entityTemplate: IMongoEntityTemplate = {
    _id: defaultTemplateId,
    propertiesOrder: ['testProp'],
    propertiesPreview: ['testProp'],
    name: 'template',
    displayName: 'template',
    category: '999999999999999999999999',
    properties: {
        type: 'object',
        properties: {
            testProp: { type: 'string', title: 'testProp' },

            name: { type: 'string', title: 'name' },
            lastName: { type: 'string', title: 'name' },
            age: { type: 'number', title: 'age' },
            salary: { type: 'number', title: 'salary' },

            bDate: { type: 'string', format: 'date', title: 'bDate' },

            doesWork: { type: 'boolean', title: 'doesWork' },

            num: { type: 'number', title: 'num' },
        },
        required: [],
    },
    disabled: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

describe('e2e ag-grid entities tests', () => {
    beforeAll(async () => {
        await Neo4jClient.initialize(neo4j.url, neo4j.auth, neo4j.database);
    });

    afterAll(async () => {
        await Neo4jClient.close();
    });

    afterEach(async () => {
        await EntityManager.deleteByTemplateId(defaultTemplateId);
    });

    describe('Get one entity', () => {
        beforeEach(async () => {
            await EntityManager.createEntity({ templateId: defaultTemplateId, properties: defaultProperties }, entityTemplate);
        });

        it('Get an entity', async () => {
            const agGridRequest = {
                startRow: 0,
                endRow: 0,
                filterModel: {},
                sortModel: [],
            };

            const res = await EntityManager.getEntities(defaultTemplateId, agGridRequest);

            expect(res).toBeDefined();
            expect(res.lastRowIndex).toBe(1);
            expect(res.rows).toHaveLength(1);
            expect(res.rows[0].templateId).toBe(defaultTemplateId);
            expect(res.rows[0].properties).toEqual(
                expect.objectContaining({
                    testProp: 'testProp',
                }),
            );
        });
    });

    describe('Check sorting', () => {
        beforeEach(async () => {
            await EntityManager.createEntity({ templateId: defaultTemplateId, properties: { age: 1, salary: 2 } }, entityTemplate);
            await EntityManager.createEntity({ templateId: defaultTemplateId, properties: { age: 1, salary: 3 } }, entityTemplate);
            await EntityManager.createEntity({ templateId: defaultTemplateId, properties: { age: 2, salary: 3 } }, entityTemplate);
        });

        it('Check single asc sorting', async () => {
            const agGridRequest: IAGGridRequest = {
                startRow: 0,
                endRow: 2,
                filterModel: {},
                sortModel: [{ colId: 'age', sort: 'asc' }],
            };

            const res = await EntityManager.getEntities(defaultTemplateId, agGridRequest);

            expect(res).toBeDefined();
            expect(res.lastRowIndex).toBe(3);
            expect(res.rows).toHaveLength(3);

            expect(res.rows[0].templateId).toBe(defaultTemplateId);
            expect(res.rows[0].properties).toEqual(
                expect.objectContaining({
                    age: 1,
                }),
            );

            expect(res.rows[2].templateId).toBe(defaultTemplateId);
            expect(res.rows[2].properties).toEqual(
                expect.objectContaining({
                    age: 2,
                }),
            );
        });

        it('Check single desc sorting', async () => {
            const agGridRequest: IAGGridRequest = {
                startRow: 0,
                endRow: 2,
                filterModel: {},
                sortModel: [{ colId: 'age', sort: 'desc' }],
            };

            const res = await EntityManager.getEntities(defaultTemplateId, agGridRequest);

            expect(res).toBeDefined();
            expect(res.lastRowIndex).toBe(3);
            expect(res.rows).toHaveLength(3);

            expect(res.rows[0].templateId).toBe(defaultTemplateId);
            expect(res.rows[0].properties).toEqual(
                expect.objectContaining({
                    age: 2,
                }),
            );

            expect(res.rows[2].templateId).toBe(defaultTemplateId);
            expect(res.rows[2].properties).toEqual(
                expect.objectContaining({
                    age: 1,
                }),
            );
        });

        it('Check combined asc and asc sorting', async () => {
            const agGridRequest: IAGGridRequest = {
                startRow: 0,
                endRow: 2,
                filterModel: {},
                sortModel: [
                    { colId: 'age', sort: 'asc' },
                    { colId: 'salary', sort: 'asc' },
                ],
            };

            const res = await EntityManager.getEntities(defaultTemplateId, agGridRequest);

            expect(res).toBeDefined();
            expect(res.lastRowIndex).toBe(3);
            expect(res.rows).toHaveLength(3);

            expect(res.rows[0].templateId).toBe(defaultTemplateId);
            expect(res.rows[0].properties).toEqual(
                expect.objectContaining({
                    age: 1,
                    salary: 2,
                }),
            );

            expect(res.rows[1].templateId).toBe(defaultTemplateId);
            expect(res.rows[1].properties).toEqual(
                expect.objectContaining({
                    age: 1,
                    salary: 3,
                }),
            );

            expect(res.rows[2].templateId).toBe(defaultTemplateId);
            expect(res.rows[2].properties).toEqual(
                expect.objectContaining({
                    age: 2,
                    salary: 3,
                }),
            );
        });

        it('Check combined asc and desc sorting', async () => {
            const agGridRequest: IAGGridRequest = {
                startRow: 0,
                endRow: 2,
                filterModel: {},
                sortModel: [
                    { colId: 'age', sort: 'asc' },
                    { colId: 'salary', sort: 'desc' },
                ],
            };

            const res = await EntityManager.getEntities(defaultTemplateId, agGridRequest);

            expect(res).toBeDefined();
            expect(res.lastRowIndex).toBe(3);
            expect(res.rows).toHaveLength(3);

            expect(res.rows[0].templateId).toBe(defaultTemplateId);
            expect(res.rows[0].properties).toEqual(
                expect.objectContaining({
                    age: 1,
                    salary: 3,
                }),
            );

            expect(res.rows[1].templateId).toBe(defaultTemplateId);
            expect(res.rows[1].properties).toEqual(
                expect.objectContaining({
                    age: 1,
                    salary: 2,
                }),
            );

            expect(res.rows[2].templateId).toBe(defaultTemplateId);
            expect(res.rows[2].properties).toEqual(
                expect.objectContaining({
                    age: 2,
                    salary: 3,
                }),
            );
        });
    });

    describe('Check text filter query', () => {
        const entityWithName: IEntity = { templateId: defaultTemplateId, properties: { name: 'Name' } };
        const entityWithAnotherName: IEntity = { templateId: defaultTemplateId, properties: { name: 'AnotherName' } };
        const entityWithDangerousChars: IEntity = { templateId: defaultTemplateId, properties: { name: 'Dangerous \' " / \\' } };

        beforeEach(async () => {
            await EntityManager.createEntity(entityWithName, entityTemplate);
            await EntityManager.createEntity(entityWithAnotherName, entityTemplate);
            await EntityManager.createEntity(entityWithDangerousChars, entityTemplate);
        });

        it('Equals', async () => {
            const agGridRequest: IAGGridRequest = {
                startRow: 0,
                endRow: 2,
                filterModel: {
                    name: {
                        filterType: 'text',
                        type: 'equals',
                        filter: entityWithName.properties.name,
                    },
                },
                sortModel: [],
            };

            const res = await EntityManager.getEntities(defaultTemplateId, agGridRequest);

            expect(res).toBeDefined();
            expect(res.lastRowIndex).toBe(1);
            expect(res.rows).toHaveLength(1);

            expect(res.rows[0].templateId).toBe(defaultTemplateId);
            expect(res.rows[0].properties).toEqual(
                expect.objectContaining({
                    name: entityWithName.properties.name,
                }),
            );
        });

        it('Equals escape dangerous characters', async () => {
            const agGridRequest: IAGGridRequest = {
                startRow: 0,
                endRow: 2,
                filterModel: {
                    name: {
                        filterType: 'text',
                        type: 'equals',
                        filter: entityWithDangerousChars.properties.name,
                    },
                },
                sortModel: [],
            };

            const res = await EntityManager.getEntities(defaultTemplateId, agGridRequest);

            expect(res).toBeDefined();
            expect(res.lastRowIndex).toBe(1);
            expect(res.rows).toHaveLength(1);

            expect(res.rows[0].templateId).toBe(defaultTemplateId);
            expect(res.rows[0].properties).toEqual(
                expect.objectContaining({
                    name: entityWithDangerousChars.properties.name,
                }),
            );
        });

        it('Equals (no entities found)', async () => {
            const agGridRequest: IAGGridRequest = {
                startRow: 0,
                endRow: 2,
                filterModel: {
                    name: {
                        filterType: 'text',
                        type: 'equals',
                        filter: 'NoName',
                    },
                },
                sortModel: [],
            };

            const res = await EntityManager.getEntities(defaultTemplateId, agGridRequest);

            expect(res).toBeDefined();
            expect(res.lastRowIndex).toBe(0);
            expect(res.rows).toHaveLength(0);
        });

        it('Not equals', async () => {
            const agGridRequest: IAGGridRequest = {
                startRow: 0,
                endRow: 2,
                filterModel: {
                    name: {
                        filterType: 'text',
                        type: 'notEqual',
                        filter: entityWithAnotherName.properties.name,
                    },
                },
                sortModel: [],
            };

            const res = await EntityManager.getEntities(defaultTemplateId, agGridRequest);

            expect(res).toBeDefined();
            expect(res.lastRowIndex).toBe(2);
            expect(res.rows).toHaveLength(2);

            expect(res.rows.map((row: IEntity) => row.properties)).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        name: entityWithName.properties.name,
                    }),
                    expect.objectContaining({
                        name: entityWithDangerousChars.properties.name,
                    }),
                ]),
            );
        });

        it('Contains', async () => {
            const agGridRequest: IAGGridRequest = {
                startRow: 0,
                endRow: 2,
                filterModel: {
                    name: {
                        filterType: 'text',
                        type: 'contains',
                        filter: 'Name',
                    },
                },
                sortModel: [],
            };

            const res = await EntityManager.getEntities(defaultTemplateId, agGridRequest);

            expect(res).toBeDefined();
            expect(res.lastRowIndex).toBe(2);
            expect(res.rows).toHaveLength(2);

            expect(res.rows.map((row: IEntity) => row.properties)).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        name: entityWithName.properties.name,
                    }),
                    expect.objectContaining({
                        name: entityWithAnotherName.properties.name,
                    }),
                ]),
            );
        });

        it('Not contains', async () => {
            const agGridRequest: IAGGridRequest = {
                startRow: 0,
                endRow: 2,
                filterModel: {
                    name: {
                        filterType: 'text',
                        type: 'notContains',
                        filter: 'Another',
                    },
                },
                sortModel: [],
            };

            const res = await EntityManager.getEntities(defaultTemplateId, agGridRequest);

            expect(res).toBeDefined();
            expect(res.lastRowIndex).toBe(2);
            expect(res.rows).toHaveLength(2);

            expect(res.rows.map((row: IEntity) => row.properties)).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        name: entityWithName.properties.name,
                    }),
                    expect.objectContaining({
                        name: entityWithDangerousChars.properties.name,
                    }),
                ]),
            );
        });

        it('Starts with', async () => {
            const agGridRequest: IAGGridRequest = {
                startRow: 0,
                endRow: 2,
                filterModel: {
                    name: {
                        filterType: 'text',
                        type: 'startsWith',
                        filter: 'Another',
                    },
                },
                sortModel: [],
            };

            const res = await EntityManager.getEntities(defaultTemplateId, agGridRequest);

            expect(res).toBeDefined();
            expect(res.lastRowIndex).toBe(1);
            expect(res.rows).toHaveLength(1);

            expect(res.rows[0].templateId).toBe(defaultTemplateId);
            expect(res.rows[0].properties).toEqual(
                expect.objectContaining({
                    name: entityWithAnotherName.properties.name,
                }),
            );
        });

        it('Ends with', async () => {
            const agGridRequest: IAGGridRequest = {
                startRow: 0,
                endRow: 2,
                filterModel: {
                    name: {
                        filterType: 'text',
                        type: 'endsWith',
                        filter: 'Name',
                    },
                },
                sortModel: [],
            };

            const res = await EntityManager.getEntities(defaultTemplateId, agGridRequest);

            expect(res).toBeDefined();
            expect(res.lastRowIndex).toBe(2);
            expect(res.rows).toHaveLength(2);

            expect(res.rows.map((row: IEntity) => row.properties)).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        name: entityWithName.properties.name,
                    }),
                    expect.objectContaining({
                        name: entityWithAnotherName.properties.name,
                    }),
                ]),
            );
        });

        it('Blank', async () => {
            const agGridRequest: IAGGridRequest = {
                startRow: 0,
                endRow: 2,
                filterModel: {
                    name: {
                        filterType: 'text',
                        type: 'blank',
                    },
                },
                sortModel: [],
            };

            const res = await EntityManager.getEntities(defaultTemplateId, agGridRequest);

            expect(res).toBeDefined();
            expect(res.lastRowIndex).toBe(0);
            expect(res.rows).toHaveLength(0);
        });

        it('Not blank', async () => {
            const agGridRequest: IAGGridRequest = {
                startRow: 0,
                endRow: 2,
                filterModel: {
                    name: {
                        filterType: 'text',
                        type: 'notBlank',
                    },
                },
                sortModel: [],
            };

            const res = await EntityManager.getEntities(defaultTemplateId, agGridRequest);

            expect(res).toBeDefined();
            expect(res.lastRowIndex).toBe(3);
            expect(res.rows).toHaveLength(3);

            expect(res.rows.map((row: IEntity) => row.properties)).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        name: entityWithName.properties.name,
                    }),
                    expect.objectContaining({
                        name: entityWithAnotherName.properties.name,
                    }),
                    expect.objectContaining({
                        name: entityWithDangerousChars.properties.name,
                    }),
                ]),
            );
        });

        it('Unknown filter', async () => {
            const agGridRequest = {
                startRow: 0,
                endRow: 2,
                filterModel: {
                    name: {
                        filterType: 'text',
                        type: 'Unknown',
                        filter: 'Unknown',
                    },
                },
                sortModel: [],
            };

            expect(() => EntityManager.getEntities(defaultTemplateId, agGridRequest as IAGGridRequest)).rejects.toThrowError(
                'Invalid supported ag-grid filter type method',
            );
        });
    });

    describe('Check number filter query', () => {
        beforeEach(async () => {
            await EntityManager.createEntity({ templateId: defaultTemplateId, properties: { age: 1 } }, entityTemplate);
            await EntityManager.createEntity({ templateId: defaultTemplateId, properties: { age: 2 } }, entityTemplate);
            await EntityManager.createEntity({ templateId: defaultTemplateId, properties: { age: 3 } }, entityTemplate);
        });

        it('Equals', async () => {
            const agGridRequest: IAGGridRequest = {
                startRow: 0,
                endRow: 1,
                filterModel: {
                    age: {
                        filterType: 'number',
                        type: 'equals',
                        filter: 1,
                    },
                },
                sortModel: [],
            };

            const res = await EntityManager.getEntities(defaultTemplateId, agGridRequest);

            expect(res).toBeDefined();
            expect(res.lastRowIndex).toBe(1);
            expect(res.rows).toHaveLength(1);

            expect(res.rows[0].templateId).toBe(defaultTemplateId);
            expect(res.rows[0].properties).toEqual(
                expect.objectContaining({
                    age: 1,
                }),
            );
        });

        it('Not equals', async () => {
            const agGridRequest: IAGGridRequest = {
                startRow: 0,
                endRow: 1,
                filterModel: {
                    age: {
                        filterType: 'number',
                        type: 'notEqual',
                        filter: 1,
                    },
                },
                sortModel: [],
            };

            const res = await EntityManager.getEntities(defaultTemplateId, agGridRequest);

            expect(res.rows.map((row: IEntity) => row.properties)).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        age: 2,
                    }),
                    expect.objectContaining({
                        age: 3,
                    }),
                ]),
            );
        });

        it('Less than', async () => {
            const agGridRequest: IAGGridRequest = {
                startRow: 0,
                endRow: 1,
                filterModel: {
                    age: {
                        filterType: 'number',
                        type: 'lessThan',
                        filter: 3,
                    },
                },
                sortModel: [],
            };

            const res = await EntityManager.getEntities(defaultTemplateId, agGridRequest);

            expect(res.rows.map((row: IEntity) => row.properties)).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        age: 1,
                    }),
                    expect.objectContaining({
                        age: 2,
                    }),
                ]),
            );
        });

        it('Less than or equal', async () => {
            const agGridRequest: IAGGridRequest = {
                startRow: 0,
                endRow: 1,
                filterModel: {
                    age: {
                        filterType: 'number',
                        type: 'lessThanOrEqual',
                        filter: 2,
                    },
                },
                sortModel: [],
            };

            const res = await EntityManager.getEntities(defaultTemplateId, agGridRequest);

            expect(res.rows.map((row: IEntity) => row.properties)).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        age: 1,
                    }),
                    expect.objectContaining({
                        age: 2,
                    }),
                ]),
            );
        });

        it('Greater than', async () => {
            const agGridRequest: IAGGridRequest = {
                startRow: 0,
                endRow: 1,
                filterModel: {
                    age: {
                        filterType: 'number',
                        type: 'greaterThan',
                        filter: 1,
                    },
                },
                sortModel: [],
            };

            const res = await EntityManager.getEntities(defaultTemplateId, agGridRequest);

            expect(res.rows.map((row: IEntity) => row.properties)).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        age: 2,
                    }),
                    expect.objectContaining({
                        age: 3,
                    }),
                ]),
            );
        });

        it('Greater than or equal', async () => {
            const agGridRequest: IAGGridRequest = {
                startRow: 0,
                endRow: 1,
                filterModel: {
                    age: {
                        filterType: 'number',
                        type: 'greaterThanOrEqual',
                        filter: 2,
                    },
                },
                sortModel: [],
            };

            const res = await EntityManager.getEntities(defaultTemplateId, agGridRequest);

            expect(res.rows.map((row: IEntity) => row.properties)).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        age: 2,
                    }),
                    expect.objectContaining({
                        age: 3,
                    }),
                ]),
            );
        });

        it('In range', async () => {
            const agGridRequest: IAGGridRequest = {
                startRow: 0,
                endRow: 1,
                filterModel: {
                    age: {
                        filterType: 'number',
                        type: 'inRange',
                        filter: 1,
                        filterTo: 2,
                    },
                },
                sortModel: [],
            };

            const res = await EntityManager.getEntities(defaultTemplateId, agGridRequest);

            expect(res.rows.map((row: IEntity) => row.properties)).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        age: 1,
                    }),
                    expect.objectContaining({
                        age: 2,
                    }),
                ]),
            );
        });

        it('Blank', async () => {
            const agGridRequest: IAGGridRequest = {
                startRow: 0,
                endRow: 2,
                filterModel: {
                    age: {
                        filterType: 'number',
                        type: 'blank',
                    },
                },
                sortModel: [],
            };

            const res = await EntityManager.getEntities(defaultTemplateId, agGridRequest);

            expect(res).toBeDefined();
            expect(res.lastRowIndex).toBe(0);
            expect(res.rows).toHaveLength(0);
        });

        it('Not blank', async () => {
            const agGridRequest: IAGGridRequest = {
                startRow: 0,
                endRow: 2,
                filterModel: {
                    age: {
                        filterType: 'number',
                        type: 'notBlank',
                    },
                },
                sortModel: [],
            };

            const res = await EntityManager.getEntities(defaultTemplateId, agGridRequest);

            expect(res).toBeDefined();
            expect(res.lastRowIndex).toBe(3);
            expect(res.rows).toHaveLength(3);

            expect(res.rows.map((row: IEntity) => row.properties)).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        age: 1,
                    }),
                    expect.objectContaining({
                        age: 2,
                    }),
                    expect.objectContaining({
                        age: 3,
                    }),
                ]),
            );
        });

        it('Unknown filter', async () => {
            const agGridRequest = {
                startRow: 0,
                endRow: 1,
                filterModel: {
                    name: {
                        filterType: 'number',
                        type: 'Unknown',
                        filter: 'Unknown',
                    },
                },
                sortModel: [],
            };

            expect(() => EntityManager.getEntities(defaultTemplateId, agGridRequest as IAGGridRequest)).rejects.toThrowError(
                'Invalid supported ag-grid filter type method',
            );
        });
    });

    describe('Check date filter query', () => {
        const firstDate = '2002-05-03';
        const secondDate = '2002-05-04';
        const thirdDate = '2002-05-05';

        beforeEach(async () => {
            await EntityManager.createEntity({ templateId: defaultTemplateId, properties: { bDate: firstDate } }, entityTemplate);
            await EntityManager.createEntity({ templateId: defaultTemplateId, properties: { bDate: secondDate } }, entityTemplate);
            await EntityManager.createEntity({ templateId: defaultTemplateId, properties: { bDate: thirdDate } }, entityTemplate);
        });

        it('Equals', async () => {
            const agGridRequest: IAGGridRequest = {
                startRow: 0,
                endRow: 1,
                filterModel: {
                    bDate: {
                        filterType: 'date',
                        type: 'equals',
                        dateFrom: firstDate,
                        dateTo: null,
                    },
                },
                sortModel: [],
            };

            const res = await EntityManager.getEntities(defaultTemplateId, agGridRequest);

            expect(res).toBeDefined();
            expect(res.lastRowIndex).toBe(1);
            expect(res.rows).toHaveLength(1);

            expect(res.rows[0].templateId).toBe(defaultTemplateId);
            expect(res.rows[0].properties).toEqual(
                expect.objectContaining({
                    bDate: firstDate,
                }),
            );
        });

        it('Not equals', async () => {
            const agGridRequest: IAGGridRequest = {
                startRow: 0,
                endRow: 1,
                filterModel: {
                    bDate: {
                        filterType: 'date',
                        type: 'notEqual',
                        dateFrom: firstDate,
                        dateTo: null,
                    },
                },
                sortModel: [],
            };

            const res = await EntityManager.getEntities(defaultTemplateId, agGridRequest);

            expect(res.rows.map((row: IEntity) => row.properties)).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        bDate: secondDate,
                    }),
                    expect.objectContaining({
                        bDate: thirdDate,
                    }),
                ]),
            );
        });

        it('Less than', async () => {
            const agGridRequest: IAGGridRequest = {
                startRow: 0,
                endRow: 1,
                filterModel: {
                    bDate: {
                        filterType: 'date',
                        type: 'lessThan',
                        dateFrom: thirdDate,
                        dateTo: null,
                    },
                },
                sortModel: [],
            };

            const res = await EntityManager.getEntities(defaultTemplateId, agGridRequest);

            expect(res.rows.map((row: IEntity) => row.properties)).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        bDate: firstDate,
                    }),
                    expect.objectContaining({
                        bDate: secondDate,
                    }),
                ]),
            );
        });

        it('Less than or equal', async () => {
            const agGridRequest: IAGGridRequest = {
                startRow: 0,
                endRow: 1,
                filterModel: {
                    bDate: {
                        filterType: 'date',
                        type: 'lessThanOrEqual',
                        dateFrom: secondDate,
                        dateTo: null,
                    },
                },
                sortModel: [],
            };

            const res = await EntityManager.getEntities(defaultTemplateId, agGridRequest);

            expect(res.rows.map((row: IEntity) => row.properties)).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        bDate: firstDate,
                    }),
                    expect.objectContaining({
                        bDate: secondDate,
                    }),
                ]),
            );
        });

        it('Greater than', async () => {
            const agGridRequest: IAGGridRequest = {
                startRow: 0,
                endRow: 1,
                filterModel: {
                    bDate: {
                        filterType: 'date',
                        type: 'greaterThan',
                        dateFrom: firstDate,
                        dateTo: null,
                    },
                },
                sortModel: [],
            };

            const res = await EntityManager.getEntities(defaultTemplateId, agGridRequest);

            expect(res.rows.map((row: IEntity) => row.properties)).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        bDate: secondDate,
                    }),
                    expect.objectContaining({
                        bDate: thirdDate,
                    }),
                ]),
            );
        });

        it('Greater than or equal', async () => {
            const agGridRequest: IAGGridRequest = {
                startRow: 0,
                endRow: 1,
                filterModel: {
                    bDate: {
                        filterType: 'date',
                        type: 'greaterThanOrEqual',
                        dateFrom: secondDate,
                        dateTo: null,
                    },
                },
                sortModel: [],
            };

            const res = await EntityManager.getEntities(defaultTemplateId, agGridRequest);

            expect(res.rows.map((row: IEntity) => row.properties)).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        bDate: secondDate,
                    }),
                    expect.objectContaining({
                        bDate: thirdDate,
                    }),
                ]),
            );
        });

        it('In range', async () => {
            const agGridRequest: IAGGridRequest = {
                startRow: 0,
                endRow: 1,
                filterModel: {
                    bDate: {
                        filterType: 'date',
                        type: 'inRange',
                        dateFrom: firstDate,
                        dateTo: secondDate,
                    },
                },
                sortModel: [],
            };

            const res = await EntityManager.getEntities(defaultTemplateId, agGridRequest);

            expect(res.rows.map((row: IEntity) => row.properties)).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        bDate: firstDate,
                    }),
                    expect.objectContaining({
                        bDate: secondDate,
                    }),
                ]),
            );
        });

        it('Blank', async () => {
            const agGridRequest: IAGGridRequest = {
                startRow: 0,
                endRow: 2,
                filterModel: {
                    bDate: {
                        filterType: 'date',
                        type: 'blank',
                        dateFrom: null,
                        dateTo: null,
                    },
                },
                sortModel: [],
            };

            const res = await EntityManager.getEntities(defaultTemplateId, agGridRequest);

            expect(res).toBeDefined();
            expect(res.lastRowIndex).toBe(0);
            expect(res.rows).toHaveLength(0);
        });

        it('Not blank', async () => {
            const agGridRequest: IAGGridRequest = {
                startRow: 0,
                endRow: 2,
                filterModel: {
                    bDate: {
                        filterType: 'date',
                        type: 'notBlank',
                        dateFrom: null,
                        dateTo: null,
                    },
                },
                sortModel: [],
            };

            const res = await EntityManager.getEntities(defaultTemplateId, agGridRequest);

            expect(res).toBeDefined();
            expect(res.lastRowIndex).toBe(3);
            expect(res.rows).toHaveLength(3);

            expect(res.rows.map((row: IEntity) => row.properties)).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        bDate: firstDate,
                    }),
                    expect.objectContaining({
                        bDate: secondDate,
                    }),
                    expect.objectContaining({
                        bDate: thirdDate,
                    }),
                ]),
            );
        });

        it('Unknown filter (dateFrom is null)', async () => {
            const agGridRequest = {
                startRow: 0,
                endRow: 1,
                filterModel: {
                    name: {
                        filterType: 'date',
                        type: 'Unknown',
                        dateFrom: null,
                        dateTo: null,
                    },
                },
                sortModel: [],
            };

            expect(() => EntityManager.getEntities(defaultTemplateId, agGridRequest as IAGGridRequest)).rejects.toThrowError(
                'Invalid supported ag-grid filter type method',
            );
        });

        it('Unknown filter', async () => {
            const agGridRequest = {
                startRow: 0,
                endRow: 1,
                filterModel: {
                    name: {
                        filterType: 'date',
                        type: 'Unknown',
                        dateFrom: firstDate,
                        dateTo: null,
                    },
                },
                sortModel: [],
            };

            expect(() => EntityManager.getEntities(defaultTemplateId, agGridRequest as IAGGridRequest)).rejects.toThrowError(
                'Invalid supported ag-grid filter type method',
            );
        });
    });

    describe('Check set', () => {
        beforeEach(async () => {
            await EntityManager.createEntity({ templateId: defaultTemplateId, properties: defaultProperties }, entityTemplate);
            await EntityManager.createEntity({ templateId: defaultTemplateId, properties: { doesWork: true } }, entityTemplate);
        });

        it('Check single sort', async () => {
            const agGridRequest: IAGGridRequest = {
                startRow: 0,
                endRow: 0,
                filterModel: {
                    testProp: {
                        filterType: 'set',
                        values: ['testProp'],
                    },
                },
                sortModel: [],
            };

            const res = await EntityManager.getEntities(defaultTemplateId, agGridRequest);

            expect(res).toBeDefined();
            expect(res.lastRowIndex).toBe(1);
            expect(res.rows).toHaveLength(1);
            expect(res.rows[0].templateId).toBe(defaultTemplateId);
            expect(res.rows[0].properties).toEqual(
                expect.objectContaining({
                    testProp: 'testProp',
                }),
            );
        });

        it('Check single sort (boolean)', async () => {
            const agGridRequest: IAGGridRequest = {
                startRow: 0,
                endRow: 0,
                filterModel: {
                    doesWork: {
                        filterType: 'set',
                        values: ['true'],
                    },
                },
                sortModel: [],
            };

            const res = await EntityManager.getEntities(defaultTemplateId, agGridRequest);

            expect(res).toBeDefined();
            expect(res.lastRowIndex).toBe(1);
            expect(res.rows).toHaveLength(1);
            expect(res.rows[0].templateId).toBe(defaultTemplateId);
            expect(res.rows[0].properties).toEqual(
                expect.objectContaining({
                    doesWork: true,
                }),
            );
        });

        it('Check single sort (null)', async () => {
            const agGridRequest: IAGGridRequest = {
                startRow: 0,
                endRow: 0,
                filterModel: {
                    testProp: {
                        filterType: 'set',
                        values: [null],
                    },
                },
                sortModel: [],
            };

            const res = await EntityManager.getEntities(defaultTemplateId, agGridRequest);

            expect(res).toBeDefined();
            expect(res.lastRowIndex).toBe(1);
            expect(res.rows).toHaveLength(1);
            expect(res.rows[0].templateId).toBe(defaultTemplateId);
            expect(res.rows[0].properties).toEqual(
                expect.objectContaining({
                    doesWork: true,
                }),
            );
        });

        it('Check single sort (should not find)', async () => {
            const agGridRequest: IAGGridRequest = {
                startRow: 0,
                endRow: 0,
                filterModel: {
                    testProp: {
                        filterType: 'set',
                        values: ['notTestProp'],
                    },
                },
                sortModel: [],
            };

            const res = await EntityManager.getEntities(defaultTemplateId, agGridRequest);

            expect(res).toBeDefined();
            expect(res.lastRowIndex).toBe(0);
            expect(res.rows).toHaveLength(0);
        });

        it('Check multiple sort options', async () => {
            const agGridRequest: IAGGridRequest = {
                startRow: 0,
                endRow: 0,
                filterModel: {
                    testProp: {
                        filterType: 'set',
                        values: ['testProp', 'notTestProp'],
                    },
                },
                sortModel: [],
            };

            const res = await EntityManager.getEntities(defaultTemplateId, agGridRequest);

            expect(res).toBeDefined();
            expect(res.lastRowIndex).toBe(1);
            expect(res.rows).toHaveLength(1);
            expect(res.rows[0].templateId).toBe(defaultTemplateId);
            expect(res.rows[0].properties).toEqual(
                expect.objectContaining({
                    testProp: 'testProp',
                }),
            );
        });

        it('Check multiple sort options (with null)', async () => {
            const agGridRequest: IAGGridRequest = {
                startRow: 0,
                endRow: 1,
                filterModel: {
                    testProp: {
                        filterType: 'set',
                        values: ['testProp', null],
                    },
                },
                sortModel: [],
            };

            const res = await EntityManager.getEntities(defaultTemplateId, agGridRequest);

            expect(res).toBeDefined();
            expect(res.lastRowIndex).toBe(2);
            expect(res.rows).toHaveLength(2);

            expect(res.rows.map((row: IEntity) => row.properties)).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        testProp: 'testProp',
                    }),
                    expect.objectContaining({
                        doesWork: true,
                    }),
                ]),
            );
        });
    });

    describe('Filter query edge cases', () => {
        beforeEach(async () => {
            await EntityManager.createEntity({ templateId: defaultTemplateId, properties: defaultProperties }, entityTemplate);
        });

        it('Check invalid filter query', async () => {
            const agGridRequest = {
                startRow: 0,
                endRow: 0,
                filterModel: {
                    testProp: {
                        filterType: 'unknown',
                        values: [],
                    },
                },
                sortModel: [],
            };

            expect(() => EntityManager.getEntities(defaultTemplateId, agGridRequest as IAGGridRequest)).rejects.toThrowError(
                'Invalid supported ag-grid filter type',
            );
        });

        it('Check empty filter query object', async () => {
            const agGridRequest = {
                startRow: 0,
                endRow: 0,
                filterModel: {},
                sortModel: [],
            };

            const res = await EntityManager.getEntities(defaultTemplateId, agGridRequest);

            expect(res).toBeDefined();
            expect(res.lastRowIndex).toBe(1);
            expect(res.rows).toHaveLength(1);

            expect(res.rows[0].templateId).toBe(defaultTemplateId);
            expect(res.rows[0].properties).toEqual(
                expect.objectContaining({
                    testProp: 'testProp',
                }),
            );
        });
    });

    describe('Check global search', () => {
        beforeAll(async () => {
            // Configure global search index in neo4j
            await Neo4jClient.writeTransaction(
                `CALL db.index.fulltext.createNodeIndex(
                    'globalSearchTest',
                    ['${defaultTemplateId}'],
                    ['name'],
                    { analyzer: 'unicode_whitespace' }
                )`,
                () => {},
            );

            // Configure redis and set latest index
            await RedisClient.initialize(redis.url);

            const redisClient = RedisClient.getClient();

            await redisClient.set(redis.globalSearchKeyName, 'globalSearchTest');
        });

        afterAll(async () => {
            // Delete global search index in neo4j
            await Neo4jClient.writeTransaction(`CALL db.index.fulltext.drop('globalSearchTest')`, () => {});

            // Delete latest index in redis
            const redisClient = RedisClient.getClient();

            await redisClient.del(redis.globalSearchKeyName);

            redisClient.disconnect();
        });

        beforeEach(async () => {
            await EntityManager.createEntity(
                { templateId: defaultTemplateId, properties: { name: 'Name', age: 1, lastName: 'lastName' } },
                entityTemplate,
            );
            await EntityManager.createEntity({ templateId: defaultTemplateId, properties: { name: 'AnotherName', age: 2 } }, entityTemplate);
            await EntityManager.createEntity(
                { templateId: defaultTemplateId, properties: { name: 'Name with lucene-special-chars (((', age: 3 } },
                entityTemplate,
            );
        });

        it('Check simple search query', async () => {
            const agGridRequest: IAGGridRequest = {
                startRow: 0,
                endRow: 0,
                filterModel: {},
                sortModel: [],
                quickFilter: 'Another',
            };

            const res = await EntityManager.getEntities(defaultTemplateId, agGridRequest);

            expect(res).toBeDefined();
            expect(res.lastRowIndex).toBe(1);
            expect(res.rows).toHaveLength(1);
            expect(res.rows[0].templateId).toBe(defaultTemplateId);
            expect(res.rows[0].properties).toEqual(
                expect.objectContaining({
                    name: 'AnotherName',
                }),
            );
        });

        it('Check search with sort query', async () => {
            const agGridRequest: IAGGridRequest = {
                startRow: 0,
                endRow: 2,
                filterModel: {},
                sortModel: [{ colId: 'age', sort: 'asc' }],
                quickFilter: 'Name',
            };

            const res = await EntityManager.getEntities(defaultTemplateId, agGridRequest);

            expect(res).toBeDefined();
            expect(res.lastRowIndex).toBe(3);
            expect(res.rows).toHaveLength(3);

            expect(res.rows[0].templateId).toBe(defaultTemplateId);
            expect(res.rows[0].properties).toEqual(
                expect.objectContaining({
                    age: 1,
                    name: 'Name',
                }),
            );

            expect(res.rows[1].templateId).toBe(defaultTemplateId);
            expect(res.rows[1].properties).toEqual(
                expect.objectContaining({
                    age: 2,
                    name: 'AnotherName',
                }),
            );

            expect(res.rows[2].templateId).toBe(defaultTemplateId);
            expect(res.rows[2].properties).toEqual(
                expect.objectContaining({
                    age: 3,
                    name: 'Name with lucene-special-chars (((',
                }),
            );
        });

        it('Check search with sort query and filter query', async () => {
            const agGridRequest: IAGGridRequest = {
                startRow: 0,
                endRow: 2,
                filterModel: {
                    lastName: {
                        filterType: 'text',
                        type: 'equals',
                        filter: 'lastName',
                    },
                },
                sortModel: [{ colId: 'age', sort: 'asc' }],
                quickFilter: 'Name',
            };

            const res = await EntityManager.getEntities(defaultTemplateId, agGridRequest);

            expect(res).toBeDefined();
            expect(res.lastRowIndex).toBe(1);
            expect(res.rows).toHaveLength(1);

            expect(res.rows[0].templateId).toBe(defaultTemplateId);
            expect(res.rows[0].properties).toEqual(
                expect.objectContaining({
                    age: 1,
                    name: 'Name',
                    lastName: 'lastName',
                }),
            );
        });

        it('Check search with lucene special characters', async () => {
            const agGridRequest: IAGGridRequest = {
                startRow: 0,
                endRow: 0,
                filterModel: {},
                sortModel: [],
                quickFilter: '(((',
            };

            const res = await EntityManager.getEntities(defaultTemplateId, agGridRequest);

            expect(res).toBeDefined();
            expect(res.lastRowIndex).toBe(1);
            expect(res.rows).toHaveLength(1);
            expect(res.rows[0].templateId).toBe(defaultTemplateId);
            expect(res.rows[0].properties).toEqual(
                expect.objectContaining({
                    name: 'Name with lucene-special-chars (((',
                }),
            );
        });

        it('Check search with wildstar with non-letter characters', async () => {
            const agGridRequest: IAGGridRequest = {
                startRow: 0,
                endRow: 0,
                filterModel: {},
                sortModel: [],
                quickFilter: 'with lucene-speci',
            };

            const res = await EntityManager.getEntities(defaultTemplateId, agGridRequest);

            expect(res).toBeDefined();
            expect(res.lastRowIndex).toBe(1);
            expect(res.rows).toHaveLength(1);
            expect(res.rows[0].templateId).toBe(defaultTemplateId);
            expect(res.rows[0].properties).toEqual(
                expect.objectContaining({
                    name: 'Name with lucene-special-chars (((',
                }),
            );
        });
    });

    describe('Test skip and limit', () => {
        beforeEach(async () => {
            await Promise.all([
                EntityManager.createEntity({ templateId: defaultTemplateId, properties: { num: 1 } }, entityTemplate),
                EntityManager.createEntity({ templateId: defaultTemplateId, properties: { num: 2 } }, entityTemplate),
                EntityManager.createEntity({ templateId: defaultTemplateId, properties: { num: 3 } }, entityTemplate),
                EntityManager.createEntity({ templateId: defaultTemplateId, properties: { num: 4 } }, entityTemplate),
            ]);
        });

        it('Check sort model query with start row and end row', async () => {
            const agGridRequest: IAGGridRequest = {
                startRow: 0,
                endRow: 1,
                filterModel: {},
                sortModel: [{ colId: 'num', sort: 'asc' }],
            };

            const res = await EntityManager.getEntities(defaultTemplateId, agGridRequest);

            expect(res).toBeDefined();
            expect(res.lastRowIndex).toBe(4);
            expect(res.rows).toHaveLength(2);

            expect(res.rows.map((row: IEntity) => row.properties)).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        num: 1,
                    }),
                    expect.objectContaining({
                        num: 2,
                    }),
                ]),
            );

            const secondAgGridRequest: IAGGridRequest = {
                startRow: 2,
                endRow: 3,
                filterModel: {},
                sortModel: [{ colId: 'num', sort: 'asc' }],
            };

            const secondRes = await EntityManager.getEntities(defaultTemplateId, secondAgGridRequest);

            expect(secondRes).toBeDefined();
            expect(secondRes.lastRowIndex).toBe(4);
            expect(secondRes.rows).toHaveLength(2);

            expect(secondRes.rows.map((row: IEntity) => row.properties)).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        num: 3,
                    }),
                    expect.objectContaining({
                        num: 4,
                    }),
                ]),
            );
        });
    });
});
