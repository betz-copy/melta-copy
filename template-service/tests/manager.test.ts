/** biome-ignore-all lint/suspicious/noExplicitAny: tests */
import { IRelationshipTemplate } from '@packages/relationship-template';
import { Express } from 'express';
import { StatusCodes } from 'http-status-codes';
import request from 'supertest';
import Server from '../src/express/server';

// Mock external entity template manager
const mockGetEntityTemplateById = jest.fn();
jest.mock('../../instance-service/src/externalServices/templates/entityTemplateManager', () => ({
    default: jest.fn().mockImplementation(() => ({
        getEntityTemplateById: mockGetEntityTemplateById,
    })),
}));

const { OK: okStatus, NOT_FOUND: notFoundStatus, INTERNAL_SERVER_ERROR: internalServerErrorStatus, FORBIDDEN: forbiddenStatus } = StatusCodes;

// Mock Mongoose model
const mockFind = jest.fn();
const mockFindById = jest.fn();
const mockFindByIdAndUpdate = jest.fn();
const mockFindByIdAndDelete = jest.fn();
const mockCreate = jest.fn();

jest.mock('../src/express/relationshipTemplate/model', () => ({
    default: {
        find: mockFind,
        findById: mockFindById,
        findByIdAndUpdate: mockFindByIdAndUpdate,
        findByIdAndDelete: mockFindByIdAndDelete,
        create: mockCreate,
    },
}));

const exampleEntity: any = {
    _id: '123451234512345123451234',
    name: '123',
    displayName: '123',
    category: '123451234512345123451234',
    disabled: false,
    iconFileId: null,
    properties: {
        type: 'object',
        properties: {},
        hide: [],
    },
    propertiesOrder: [],
    propertiesTypeOrder: [],
    propertiesPreview: [],
};

const exampleRelation: IRelationshipTemplate = {
    name: '123',
    displayName: '123',
    sourceEntityId: '123451234512345123451234',
    destinationEntityId: '123451234512345123451234',
};

const mockMongooseFindOneWithChainingResolveValue = (resolveValue: IRelationshipTemplate) =>
    ({
        orFail: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(resolveValue),
    }) as any;

const mockMongooseFindManyWithChainingResolveValue = (resolveValue: IRelationshipTemplate[]) =>
    ({
        lean: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(resolveValue),
    }) as any;

describe('manager logic', () => {
    let app: Express;

    beforeEach(() => {
        // jest.restoreAllMocks();
        jest.resetAllMocks();
    });
    beforeAll(() => {
        app = Server.createExpressApp();
    });

    it('getTemplateById', async () => {
        mockFindById.mockReturnValueOnce(mockMongooseFindOneWithChainingResolveValue(exampleRelation));

        const { body } = await request(app).get('/api/relationships/templates/123451234512345123451234').expect(okStatus);

        expect(body).toEqual(exampleRelation);
        expect(mockFindById).toHaveBeenCalledTimes(1);
    });

    it('getTemplates', async () => {
        mockFind.mockReturnValueOnce(mockMongooseFindManyWithChainingResolveValue([exampleRelation]));

        const { body } = await request(app).get('/api/relationships/templates').expect(okStatus);

        expect(body).toEqual([exampleRelation]);
        expect(mockFind).toHaveBeenCalledTimes(1);
    });
    describe('updateTemplateById', () => {
        it('resolve when no source & dest updated', async () => {
            mockFindByIdAndUpdate.mockReturnValueOnce(mockMongooseFindOneWithChainingResolveValue(exampleRelation));

            const { body } = await request(app).put('/api/relationships/templates/123451234512345123451234').send({}).expect(okStatus);

            expect(body).toEqual(exampleRelation);
            expect(mockGetEntityTemplateById).toHaveBeenCalledTimes(0);
            expect(mockFindByIdAndUpdate).toHaveBeenCalledTimes(1);
        });
        it('resolve when source & dest updated and exist', async () => {
            mockGetEntityTemplateById.mockResolvedValueOnce(exampleEntity);
            mockGetEntityTemplateById.mockResolvedValueOnce(exampleEntity);
            mockFindByIdAndUpdate.mockReturnValueOnce(mockMongooseFindOneWithChainingResolveValue(exampleRelation));

            const { body } = await request(app)
                .put('/api/relationships/templates/123451234512345123451234')
                .send({ sourceEntityId: '123451234512345123451234', destinationEntityId: '123451234512345123451234' })
                .expect(okStatus);

            expect(body).toEqual(exampleRelation);
            expect(mockGetEntityTemplateById).toHaveBeenCalledTimes(2);
            expect(mockFindByIdAndUpdate).toHaveBeenCalledTimes(1);
        });
        it.each(['source', 'dest'] as ['source', 'dest'])('resolve when only %s updated and exists', async (sourceOrDest: 'source' | 'dest') => {
            mockGetEntityTemplateById.mockResolvedValueOnce(exampleEntity);
            mockFindByIdAndUpdate.mockReturnValueOnce(mockMongooseFindOneWithChainingResolveValue(exampleRelation));

            const updatedFields: Partial<IRelationshipTemplate> = {};
            if (sourceOrDest === 'source') updatedFields.sourceEntityId = '123451234512345123451234';
            else updatedFields.destinationEntityId = '123451234512345123451234';

            const { body } = await request(app).put('/api/relationships/templates/123451234512345123451234').send(updatedFields).expect(okStatus);

            expect(body).toEqual(exampleRelation);
            expect(mockGetEntityTemplateById).toHaveBeenCalledTimes(1);
            expect(mockFindByIdAndUpdate).toHaveBeenCalledTimes(1);
        });
        it.each(['source', 'dest'] as ['source', 'dest'])('throw 403 when only %s updated and doesnt exist', async (sourceOrDest:
            | 'source'
            | 'dest') => {
            mockGetEntityTemplateById.mockRejectedValueOnce({ response: { status: notFoundStatus } });

            const updatedFields: Partial<IRelationshipTemplate> = {};
            if (sourceOrDest === 'source') updatedFields.sourceEntityId = '123451234512345123451234';
            else updatedFields.destinationEntityId = '123451234512345123451234';

            await request(app).put('/api/relationships/templates/123451234512345123451234').send(updatedFields).expect(forbiddenStatus);

            expect(mockGetEntityTemplateById).toHaveBeenCalledTimes(1);
            expect(mockFindByIdAndUpdate).toHaveBeenCalledTimes(0);
        });
        it.each(['source', 'dest'] as [
            'source',
            'dest',
        ])('throw unknown error when only %s updated and getById throw unknown error', async (sourceOrDest: 'source' | 'dest') => {
            mockGetEntityTemplateById.mockRejectedValueOnce(new Error('unknown error'));

            const updatedFields: Partial<IRelationshipTemplate> = {};
            if (sourceOrDest === 'source') updatedFields.sourceEntityId = '123451234512345123451234';
            else updatedFields.destinationEntityId = '123451234512345123451234';

            await request(app).put('/api/relationships/templates/123451234512345123451234').send(updatedFields).expect(internalServerErrorStatus);

            expect(mockGetEntityTemplateById).toHaveBeenCalledTimes(1);
            expect(mockFindByIdAndUpdate).toHaveBeenCalledTimes(0);
        });
    });
    it('deleteTemplateById', async () => {
        mockFindByIdAndDelete.mockReturnValueOnce(mockMongooseFindOneWithChainingResolveValue(exampleRelation));
        const { body } = await request(app).delete('/api/relationships/templates/123451234512345123451234').expect(okStatus);

        expect(body).toEqual(exampleRelation);
        expect(mockFindByIdAndDelete).toHaveBeenCalledTimes(1);
    });
    describe('create template', () => {
        it('resolve when source & dest exist', async () => {
            mockGetEntityTemplateById.mockResolvedValueOnce(exampleEntity);
            mockGetEntityTemplateById.mockResolvedValueOnce(exampleEntity);
            mockCreate.mockImplementationOnce(async (doc) => doc);

            const { body } = await request(app).post('/api/relationships/templates').send(exampleRelation);

            expect(body).toEqual(exampleRelation);
            expect(mockGetEntityTemplateById).toHaveBeenCalledTimes(2);
            expect(mockCreate).toHaveBeenCalledTimes(1);
        });
        it.each(['source', 'dest'] as ['source', 'dest'])('throw 403 when %s doesnt exist', async (sourceOrDest: 'source' | 'dest') => {
            mockGetEntityTemplateById.mockImplementation(async (templateId: string) => {
                if (sourceOrDest === 'source' && templateId === exampleRelation.sourceEntityId) throw { response: { status: notFoundStatus } };
                if (sourceOrDest === 'dest' && templateId === exampleRelation.destinationEntityId) throw { response: { status: notFoundStatus } };

                return exampleEntity;
            });
            mockCreate.mockImplementationOnce(async (doc) => doc);

            await request(app).post('/api/relationships/templates').send(exampleRelation).expect(forbiddenStatus);

            expect(mockCreate).toHaveBeenCalledTimes(0);
        });
        it.each(['source', 'dest'] as ['source', 'dest'])('throw unknown error when %s getById throw unknown error', async (sourceOrDest:
            | 'source'
            | 'dest') => {
            mockGetEntityTemplateById.mockImplementation(async (templateId: string) => {
                if (sourceOrDest === 'source' && templateId === exampleRelation.sourceEntityId) throw new Error('unknown error');
                if (sourceOrDest === 'dest' && templateId === exampleRelation.destinationEntityId) throw new Error('unknown error');

                return exampleEntity;
            });
            mockCreate.mockImplementationOnce(async (doc) => doc);

            await request(app).post('/api/relationships/templates').send(exampleRelation).expect(internalServerErrorStatus);

            expect(mockCreate).toHaveBeenCalledTimes(0);
        });
    });
});
