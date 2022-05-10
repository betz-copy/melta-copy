import config from '../../config';
import { IAGGridRequest } from '../../utils/agGridFilterModelToNeoQuery';
import Neo4jClient from '../../utils/neo4j';
import { IEntity } from './interface';
import EntityManager from './manager';

const { neo4j } = config;

const defaultTemplateId = '1';
const defaultProperties = { testProp: 'testProp' };

describe('e2e ag-grid entities tests', () => {
    beforeAll(async () => {
        await Neo4jClient.initialize(neo4j.url, neo4j.auth);
    });

    afterAll(async () => {
        await Neo4jClient.close();
    });

    afterEach(async () => {
        await EntityManager.deleteByTemplateId(defaultTemplateId);
    });

    describe('Get one entity', () => {
        beforeEach(async () => {
            await EntityManager.createEntity({ templateId: defaultTemplateId, properties: defaultProperties });
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
            await EntityManager.createEntity({ templateId: defaultTemplateId, properties: { age: 1, salary: 2 } });
            await EntityManager.createEntity({ templateId: defaultTemplateId, properties: { age: 1, salary: 3 } });
            await EntityManager.createEntity({ templateId: defaultTemplateId, properties: { age: 2, salary: 3 } });
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
        beforeEach(async () => {
            await EntityManager.createEntity({ templateId: defaultTemplateId, properties: { name: 'Name' } });
            await EntityManager.createEntity({ templateId: defaultTemplateId, properties: { name: 'AnotherName' } });
        });

        it('Equals', async () => {
            const agGridRequest: IAGGridRequest = {
                startRow: 0,
                endRow: 1,
                filterModel: {
                    name: {
                        filterType: 'text',
                        type: 'equals',
                        filter: 'Name',
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
                    name: 'Name',
                }),
            );
        });

        it('Equals (no entities found)', async () => {
            const agGridRequest: IAGGridRequest = {
                startRow: 0,
                endRow: 1,
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
                endRow: 1,
                filterModel: {
                    name: {
                        filterType: 'text',
                        type: 'notEqual',
                        filter: 'AnotherName',
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
                    name: 'Name',
                }),
            );
        });

        it('Contains', async () => {
            const agGridRequest: IAGGridRequest = {
                startRow: 0,
                endRow: 1,
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
                        name: 'Name',
                    }),
                    expect.objectContaining({
                        name: 'AnotherName',
                    }),
                ]),
            );
        });

        it('Not contains', async () => {
            const agGridRequest: IAGGridRequest = {
                startRow: 0,
                endRow: 1,
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
            expect(res.lastRowIndex).toBe(1);
            expect(res.rows).toHaveLength(1);

            expect(res.rows[0].templateId).toBe(defaultTemplateId);
            expect(res.rows[0].properties).toEqual(
                expect.objectContaining({
                    name: 'Name',
                }),
            );
        });

        it('Starts with', async () => {
            const agGridRequest: IAGGridRequest = {
                startRow: 0,
                endRow: 1,
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
                    name: 'AnotherName',
                }),
            );
        });

        it('Ends with', async () => {
            const agGridRequest: IAGGridRequest = {
                startRow: 0,
                endRow: 1,
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
                        name: 'Name',
                    }),
                    expect.objectContaining({
                        name: 'AnotherName',
                    }),
                ]),
            );
        });

        it('Blank', async () => {
            const agGridRequest: IAGGridRequest = {
                startRow: 0,
                endRow: 1,
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
                endRow: 1,
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
            expect(res.lastRowIndex).toBe(2);
            expect(res.rows).toHaveLength(2);

            expect(res.rows.map((row: IEntity) => row.properties)).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        name: 'Name',
                    }),
                    expect.objectContaining({
                        name: 'AnotherName',
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
            await EntityManager.createEntity({ templateId: defaultTemplateId, properties: { age: 1 } });
            await EntityManager.createEntity({ templateId: defaultTemplateId, properties: { age: 2 } });
            await EntityManager.createEntity({ templateId: defaultTemplateId, properties: { age: 3 } });
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
            await EntityManager.createEntity({ templateId: defaultTemplateId, properties: { bDate: firstDate } });
            await EntityManager.createEntity({ templateId: defaultTemplateId, properties: { bDate: secondDate } });
            await EntityManager.createEntity({ templateId: defaultTemplateId, properties: { bDate: thirdDate } });
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
            await EntityManager.createEntity({ templateId: defaultTemplateId, properties: defaultProperties });
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
    });
});
