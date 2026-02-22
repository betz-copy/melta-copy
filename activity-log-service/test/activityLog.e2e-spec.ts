process.env.ELASTIC_APM_ACTIVE = 'false';

import type { INestApplication } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test, type TestingModule } from '@nestjs/testing';
import config from 'activity-log-service/src/config';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('ActivityLogController (e2e)', () => {
    let app: INestApplication<App>;
    const mockWorkspaceId = 'test-workspace';

    const mockModel = {
        find: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
        lean: jest.fn().mockReturnThis(),
    };

    const mockClientProxy = {
        connect: jest.fn().mockResolvedValue(undefined),
        emit: jest.fn().mockReturnValue({ subscribe: jest.fn() }),
        close: jest.fn().mockResolvedValue(undefined),
        registerDisconnectListener: jest.fn(),
        onModuleInit: jest.fn(),
        onModuleDestroy: jest.fn(),
    };

    beforeAll(async () => {
        const builder = Test.createTestingModule({
            imports: [AppModule],
        });

        Object.values(config.rabbit.queues).forEach((queue) => {
            builder.overrideProvider(queue).useValue(mockClientProxy);
        });

        builder.overrideProvider(getConnectionToken()).useValue({
            on: jest.fn(),
            useDb: jest.fn().mockReturnValue({
                model: jest.fn().mockReturnValue(mockModel),
            }),
            close: jest.fn().mockResolvedValue(undefined),
        });

        const moduleFixture: TestingModule = await builder.compile();

        app = moduleFixture.createNestApplication();

        app.useLogger(false);

        await app.init();
    });

    afterAll(async () => {
        await app.close();
        jest.restoreAllMocks();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('/api/activity-log/:entityId (GET)', () => {
        const entityId = 'entity-123';

        it('should return 200 and activities when valid', () => {
            return request(app.getHttpServer())
                .get(`/api/activity-log/${entityId}`)
                .set(config.server.workspaceIdHeader, mockWorkspaceId)
                .query({ limit: 10, skip: 0 })
                .expect(200)
                .expect((res) => {
                    expect(Array.isArray(res.body)).toBe(true);
                    expect(mockModel.find).toHaveBeenCalledWith(expect.objectContaining({ entityId: { $eq: entityId } }));
                });
        });

        it('should handle array query parameters correctly (comma-separated)', () => {
            const actions = 'CREATE,UPDATE';
            return request(app.getHttpServer())
                .get(`/api/activity-log/${entityId}`)
                .set(config.server.workspaceIdHeader, mockWorkspaceId)
                .query({ limit: 10, skip: 0, actions })
                .expect(200)
                .expect(() => {
                    expect(mockModel.find).toHaveBeenCalledWith(
                        expect.objectContaining({
                            action: { $in: ['CREATE', 'UPDATE'] },
                        }),
                    );
                });
        });

        it('should handle fieldsSearch and usersSearch as arrays in query', () => {
            return request(app.getHttpServer())
                .get(`/api/activity-log/${entityId}`)
                .set(config.server.workspaceIdHeader, mockWorkspaceId)
                .query({
                    limit: 10,
                    skip: 0,
                    fieldsSearch: ['field1', 'field2'],
                    usersSearch: 'user1',
                })
                .expect(200)
                .expect(() => {
                    expect(mockModel.find).toHaveBeenCalledWith(
                        expect.objectContaining({
                            $or: expect.arrayContaining([
                                expect.objectContaining({ 'metadata.updatedFields': { $elemMatch: { fieldName: { $in: ['field1', 'field2'] } } } }),
                                expect.objectContaining({ userId: { $in: ['user1'] } }),
                            ]),
                        }),
                    );
                });
        });

        it('should return 400 if workspace-id header is missing', () => {
            return request(app.getHttpServer()).get(`/api/activity-log/${entityId}`).query({ limit: 10, skip: 0 }).expect(400);
        });
    });
});
