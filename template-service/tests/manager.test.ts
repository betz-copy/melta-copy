// import * as mockingooseNoTypes from 'mockingoose';

import { Express } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Document, Query } from 'mongoose';
import request from 'supertest';
import * as entityTemplateManager from '../src/entityTemplateManager';
import { IRelationshipTemplate } from '../src/express/relationshipTemplate/interface';
import RelationshipTemplateModel from '../src/express/relationshipTemplate/model';
import Server from '../src/express/server';

jest.mock('../src/entityTemplateManager');
const entityTemplateManagerMocked = jest.mocked(entityTemplateManager, true);

const { OK: okStatus, NOT_FOUND: notFoundStatus, INTERNAL_SERVER_ERROR: internalServerErrorStatus, FORBIDDEN: forbiddenStatus } = StatusCodes;

jest.mock('../src/express/relationshipTemplate/model', () => ({
    // mocking model.ts accidently mock Map. see here: https://github.com/sideway/joi/issues/2350#issuecomment-739639198
    default: {
        find: jest.fn(),
        findById: jest.fn(),
        findByIdAndUpdate: jest.fn(),
        findByIdAndDelete: jest.fn(),
        create: jest.fn(),
    },
}));
const RelationshipTemplateModelMocked = jest.mocked(RelationshipTemplateModel, false);

const exampleEntity: entityTemplateManager.IEntityTemplate = {
    _id: '123451234512345123451234',
    name: '123',
    displayName: '123',
    category: '123451234512345123451234',
    disabled: false,
    properties: {},
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
    }) as Query<IRelationshipTemplate & Document, IRelationshipTemplate & Document>;

const mockMongooseFindManyWithChainingResolveValue = (resolveValue: IRelationshipTemplate[]) =>
    ({
        lean: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(resolveValue),
    }) as Query<(IRelationshipTemplate & Document)[], IRelationshipTemplate & Document>;

// const mockMongooseFindWithChainingRejectValue = (rejectValue: any) =>
//     ({
//         orFail: jest.fn().mockReturnThis(),
//         lean: jest.fn().mockReturnThis(),
//         exec: jest.fn().mockRejectedValue(rejectValue),
//     } as Query<IRelationshipTemplate & Document, IRelationshipTemplate & Document>);

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
        RelationshipTemplateModelMocked.findById.mockReturnValueOnce(mockMongooseFindOneWithChainingResolveValue(exampleRelation));

        const { body } = await request(app).get('/api/relationships/templates/123451234512345123451234').expect(okStatus);
        // const getByIdPromise = RelationshipTemplateManager.getTemplateById('123');

        // await expect(getByIdPromise).resolves.toEqual(exampleRelation);
        expect(body).toEqual(exampleRelation);
        expect(RelationshipTemplateModelMocked.findById).toBeCalledTimes(1);
    });
    it('getTemplates', async () => {
        RelationshipTemplateModelMocked.find.mockReturnValueOnce(mockMongooseFindManyWithChainingResolveValue([exampleRelation]));

        const { body } = await request(app).get('/api/relationships/templates').expect(okStatus);
        // const getByIdPromise = RelationshipTemplateManager.getTemplateById('123');

        // await expect(getByIdPromise).resolves.toEqual(exampleRelation);
        expect(body).toEqual([exampleRelation]);
        expect(RelationshipTemplateModelMocked.find).toBeCalledTimes(1);
    });
    describe('updateTemplateById', () => {
        it('resolve when no source & dest updated', async () => {
            RelationshipTemplateModelMocked.findByIdAndUpdate.mockReturnValueOnce(mockMongooseFindOneWithChainingResolveValue(exampleRelation));

            const { body } = await request(app).put('/api/relationships/templates/123451234512345123451234').send({}).expect(okStatus);

            expect(body).toEqual(exampleRelation);
            expect(entityTemplateManagerMocked.getEntityTemplatebyId).toBeCalledTimes(0);
            expect(RelationshipTemplateModelMocked.findByIdAndUpdate).toBeCalledTimes(1);
        });
        it('resolve when source & dest updated and exist', async () => {
            entityTemplateManagerMocked.getEntityTemplatebyId.mockResolvedValueOnce(exampleEntity);
            entityTemplateManagerMocked.getEntityTemplatebyId.mockResolvedValueOnce(exampleEntity);
            RelationshipTemplateModelMocked.findByIdAndUpdate.mockReturnValueOnce(mockMongooseFindOneWithChainingResolveValue(exampleRelation));

            const { body } = await request(app)
                .put('/api/relationships/templates/123451234512345123451234')
                .send({ sourceEntityId: '123451234512345123451234', destinationEntityId: '123451234512345123451234' })
                .expect(okStatus);

            expect(body).toEqual(exampleRelation);
            expect(entityTemplateManagerMocked.getEntityTemplatebyId).toBeCalledTimes(2);
            expect(RelationshipTemplateModelMocked.findByIdAndUpdate).toBeCalledTimes(1);
        });
        it.each(['source', 'dest'] as ['source', 'dest'])('resolve when only %s updated and exists', async (sourceOrDest: 'source' | 'dest') => {
            entityTemplateManagerMocked.getEntityTemplatebyId.mockResolvedValueOnce(exampleEntity);
            RelationshipTemplateModelMocked.findByIdAndUpdate.mockReturnValueOnce(mockMongooseFindOneWithChainingResolveValue(exampleRelation));

            const updatedFields: Partial<IRelationshipTemplate> = {};
            if (sourceOrDest === 'source') updatedFields.sourceEntityId = '123451234512345123451234';
            else updatedFields.destinationEntityId = '123451234512345123451234';

            const { body } = await request(app).put('/api/relationships/templates/123451234512345123451234').send(updatedFields).expect(okStatus);

            expect(body).toEqual(exampleRelation);
            expect(entityTemplateManagerMocked.getEntityTemplatebyId).toBeCalledTimes(1);
            expect(RelationshipTemplateModelMocked.findByIdAndUpdate).toBeCalledTimes(1);
        });
        it.each(['source', 'dest'] as ['source', 'dest'])(
            'throw 403 when only %s updated and doesnt exist',
            async (sourceOrDest: 'source' | 'dest') => {
                entityTemplateManagerMocked.getEntityTemplatebyId.mockRejectedValueOnce({ response: { status: notFoundStatus } });

                const updatedFields: Partial<IRelationshipTemplate> = {};
                if (sourceOrDest === 'source') updatedFields.sourceEntityId = '123451234512345123451234';
                else updatedFields.destinationEntityId = '123451234512345123451234';

                await request(app).put('/api/relationships/templates/123451234512345123451234').send(updatedFields).expect(forbiddenStatus);

                expect(entityTemplateManagerMocked.getEntityTemplatebyId).toBeCalledTimes(1);
                expect(RelationshipTemplateModelMocked.findByIdAndUpdate).toBeCalledTimes(0);
            },
        );
        it.each(['source', 'dest'] as ['source', 'dest'])(
            'throw unknown error when only %s updated and getById throw unknown error',
            async (sourceOrDest: 'source' | 'dest') => {
                entityTemplateManagerMocked.getEntityTemplatebyId.mockRejectedValueOnce(new Error('unknown error'));

                const updatedFields: Partial<IRelationshipTemplate> = {};
                if (sourceOrDest === 'source') updatedFields.sourceEntityId = '123451234512345123451234';
                else updatedFields.destinationEntityId = '123451234512345123451234';

                await request(app).put('/api/relationships/templates/123451234512345123451234').send(updatedFields).expect(internalServerErrorStatus);

                expect(entityTemplateManagerMocked.getEntityTemplatebyId).toBeCalledTimes(1);
                expect(RelationshipTemplateModelMocked.findByIdAndUpdate).toBeCalledTimes(0);
            },
        );
    });
    it('deleteTemplateById', async () => {
        RelationshipTemplateModelMocked.findByIdAndDelete.mockReturnValueOnce(mockMongooseFindOneWithChainingResolveValue(exampleRelation));
        const { body } = await request(app).delete('/api/relationships/templates/123451234512345123451234').expect(okStatus);

        expect(body).toEqual(exampleRelation);
        expect(RelationshipTemplateModelMocked.findByIdAndDelete).toBeCalledTimes(1);
    });
    describe('create template', () => {
        it('resolve when source & dest exist', async () => {
            entityTemplateManagerMocked.getEntityTemplatebyId.mockResolvedValueOnce(exampleEntity);
            entityTemplateManagerMocked.getEntityTemplatebyId.mockResolvedValueOnce(exampleEntity);
            RelationshipTemplateModelMocked.create.mockImplementationOnce(async (doc) => doc);

            const { body } = await request(app).post('/api/relationships/templates').send(exampleRelation);

            expect(body).toEqual(exampleRelation);
            expect(entityTemplateManagerMocked.getEntityTemplatebyId).toBeCalledTimes(2);
            expect(RelationshipTemplateModelMocked.create).toBeCalledTimes(1);
        });
        it.each(['source', 'dest'] as ['source', 'dest'])('throw 403 when %s doesnt exist', async (sourceOrDest: 'source' | 'dest') => {
            entityTemplateManagerMocked.getEntityTemplatebyId.mockImplementation(async (templateId: string) => {
                if (sourceOrDest === 'source' && templateId === exampleRelation.sourceEntityId) throw { response: { status: notFoundStatus } };
                if (sourceOrDest === 'dest' && templateId === exampleRelation.destinationEntityId) throw { response: { status: notFoundStatus } };

                return exampleEntity;
            });
            RelationshipTemplateModelMocked.create.mockImplementationOnce(async (doc) => doc);

            await request(app).post('/api/relationships/templates').send(exampleRelation).expect(forbiddenStatus);

            expect(RelationshipTemplateModelMocked.create).toBeCalledTimes(0);
        });
        it.each(['source', 'dest'] as ['source', 'dest'])(
            'throw unknown error when %s getById throw unknown error',
            async (sourceOrDest: 'source' | 'dest') => {
                entityTemplateManagerMocked.getEntityTemplatebyId.mockImplementation(async (templateId: string) => {
                    if (sourceOrDest === 'source' && templateId === exampleRelation.sourceEntityId) throw new Error('unknown error');
                    if (sourceOrDest === 'dest' && templateId === exampleRelation.destinationEntityId) throw new Error('unknown error');

                    return exampleEntity;
                });
                RelationshipTemplateModelMocked.create.mockImplementationOnce(async (doc) => doc);

                await request(app).post('/api/relationships/templates').send(exampleRelation).expect(internalServerErrorStatus);

                expect(RelationshipTemplateModelMocked.create).toBeCalledTimes(0);
            },
        );
    });
});
