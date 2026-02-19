import { Test, TestingModule } from '@nestjs/testing';
import { ActionsLog, IActivityLog } from '@packages/activity-log';
import { ClsService, MongoModelFactory } from '@packages/utils';
import { Model } from 'mongoose';
import config from '../../../config';
import { GetActivityQueryDto } from '../dto/activityLog.dto';
import { ActivityLog } from '../schemas/activityLog.schema';
import { ActivityLogService } from './activityLog.service';

const { mongoDuplicateKeyErrorCode, mongoDuplicateErrorName } = config.mongo;

type MockModel = {
    find: jest.Mock;
    limit: jest.Mock;
    skip: jest.Mock;
    exec: jest.Mock;
    create: jest.Mock;
    findOne: jest.Mock;
    lean: jest.Mock;
};

describe('ActivityLogService', () => {
    let service: ActivityLogService;
    let modelMock: MockModel;
    let mongoModelFactoryMock: { getModel: jest.Mock };

    const mockWorkspaceId = 'workspace-123';

    beforeEach(async () => {
        modelMock = {
            find: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            lean: jest.fn().mockReturnThis(),
            exec: jest.fn(),
            create: jest.fn(),
            findOne: jest.fn().mockReturnThis(),
        };

        const clsServiceMock = {
            get: jest.fn().mockReturnValue(mockWorkspaceId),
        };

        const connectionMock = {
            useDb: jest.fn().mockReturnValue({
                model: jest.fn().mockReturnValue(modelMock),
            }),
        };

        mongoModelFactoryMock = {
            getModel: jest.fn().mockReturnValue(modelMock as unknown as Model<ActivityLog>),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ActivityLogService,
                {
                    provide: ClsService,
                    useValue: clsServiceMock,
                },
                {
                    provide: 'DatabaseConnection',
                    useValue: connectionMock,
                },
                {
                    provide: MongoModelFactory,
                    useValue: mongoModelFactoryMock,
                },
            ],
        }).compile();

        service = module.get<ActivityLogService>(ActivityLogService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getActivity', () => {
        const entityId = 'entity-1';
        const baseDto: GetActivityQueryDto = {
            limit: 10,
            skip: 0,
            fieldsSearch: [],
            usersSearch: [],
        };

        it('should call find with correct default query and pagination', async () => {
            modelMock.exec.mockResolvedValue([]);

            await service.getActivity(entityId, baseDto);

            expect(modelMock.find).toHaveBeenCalledWith({ entityId: { $eq: entityId } });
            expect(modelMock.limit).toHaveBeenCalledWith(baseDto.limit);
            expect(modelMock.skip).toHaveBeenCalledWith(baseDto.skip);
        });

        it('should filter by actions', async () => {
            const actions = ['CREATE', 'UPDATE'];
            const dto: GetActivityQueryDto = { ...baseDto, actions };
            modelMock.exec.mockResolvedValue([]);

            await service.getActivity(entityId, dto);

            expect(modelMock.find).toHaveBeenCalledWith({
                entityId: { $eq: entityId },
                action: { $in: actions },
            });
        });

        it('should search text if searchText is provided', async () => {
            const searchText = 'test search';
            const dto: GetActivityQueryDto = { ...baseDto, searchText };
            modelMock.exec.mockResolvedValue([]);

            await service.getActivity(entityId, dto);

            expect(modelMock.find).toHaveBeenCalledWith({
                entityId: { $eq: entityId },
                $text: { $search: searchText },
            });
        });

        it('should filter by fieldsSearch using $elemMatch', async () => {
            const fieldsSearch = ['name', 'description'];
            const dto: GetActivityQueryDto = { ...baseDto, fieldsSearch };
            modelMock.exec.mockResolvedValue([]);

            await service.getActivity(entityId, dto);

            expect(modelMock.find).toHaveBeenCalledWith({
                entityId: { $eq: entityId },
                $or: [
                    {
                        'metadata.updatedFields': {
                            $elemMatch: { fieldName: { $in: fieldsSearch } },
                        },
                    },
                ],
            });
        });

        it('should filter by usersSearch', async () => {
            const usersSearch = ['user-1', 'user-2'];
            const dto: GetActivityQueryDto = { ...baseDto, usersSearch };
            modelMock.exec.mockResolvedValue([]);

            await service.getActivity(entityId, dto);

            expect(modelMock.find).toHaveBeenCalledWith({
                entityId: { $eq: entityId },
                $or: [{ userId: { $in: usersSearch } }],
            });
        });

        it('should filter by date range', async () => {
            const startDateRange = new Date('2023-01-01').toISOString();
            const endDateRange = new Date('2023-01-31').toISOString();
            const dto: GetActivityQueryDto = { ...baseDto, startDateRange, endDateRange };
            modelMock.exec.mockResolvedValue([]);

            await service.getActivity(entityId, dto);

            expect(modelMock.find).toHaveBeenCalledWith({
                entityId: { $eq: entityId },
                timestamp: { $gte: startDateRange, $lte: endDateRange },
            });
        });

        it('should filter by only startDateRange', async () => {
            const startDateRange = new Date('2023-01-01').toISOString();
            const dto: GetActivityQueryDto = { ...baseDto, startDateRange };
            modelMock.exec.mockResolvedValue([]);

            await service.getActivity(entityId, dto);

            expect(modelMock.find).toHaveBeenCalledWith({
                entityId: { $eq: entityId },
                timestamp: { $gte: startDateRange },
            });
        });

        it('should filter by only endDateRange', async () => {
            const endDateRange = new Date('2023-01-31').toISOString();
            const dto: GetActivityQueryDto = { ...baseDto, endDateRange };
            modelMock.exec.mockResolvedValue([]);

            await service.getActivity(entityId, dto);

            expect(modelMock.find).toHaveBeenCalledWith({
                entityId: { $eq: entityId },
                timestamp: { $lte: endDateRange },
            });
        });

        it('should handle empty arrays for filters', async () => {
            const dto: GetActivityQueryDto = { ...baseDto, actions: [] };
            modelMock.exec.mockResolvedValue([]);

            await service.getActivity(entityId, dto);

            expect(modelMock.find).toHaveBeenCalledWith({ entityId: { $eq: entityId } });
        });

        it('should handle undefined searchText', async () => {
            const dto: GetActivityQueryDto = { ...baseDto, searchText: undefined };
            modelMock.exec.mockResolvedValue([]);

            await service.getActivity(entityId, dto);

            expect(modelMock.find).toHaveBeenCalledWith({ entityId: { $eq: entityId } });
        });

        it('should handle empty searchText string', async () => {
            const dto: GetActivityQueryDto = { ...baseDto, searchText: '' };
            modelMock.exec.mockResolvedValue([]);

            await service.getActivity(entityId, dto);

            expect(modelMock.find).toHaveBeenCalledWith({ entityId: { $eq: entityId } });
        });

        it('should combine fieldsSearch and usersSearch', async () => {
            const fieldsSearch = ['name', 'email'];
            const usersSearch = ['user-1', 'user-2'];
            const dto: GetActivityQueryDto = { ...baseDto, fieldsSearch, usersSearch };
            modelMock.exec.mockResolvedValue([]);

            await service.getActivity(entityId, dto);

            expect(modelMock.find).toHaveBeenCalledWith({
                entityId: { $eq: entityId },
                $or: [{ 'metadata.updatedFields': { $elemMatch: { fieldName: { $in: fieldsSearch } } } }, { userId: { $in: usersSearch } }],
            });
        });

        it('should combine searchText with date range', async () => {
            const searchText = 'query';
            const startDateRange = new Date('2023-06-01').toISOString();
            const dto: GetActivityQueryDto = { ...baseDto, searchText, startDateRange };
            modelMock.exec.mockResolvedValue([]);

            await service.getActivity(entityId, dto);

            expect(modelMock.find).toHaveBeenCalledWith({
                entityId: { $eq: entityId },
                $text: { $search: searchText },
                timestamp: { $gte: startDateRange },
            });
        });
    });

    describe('createActivity', () => {
        const activityLog: IActivityLog = {
            entityId: 'entity-1',
            action: ActionsLog.UPDATE_ENTITY,
            userId: 'user-1',
            timestamp: new Date(),
            metadata: {
                updatedFields: [],
            },
        };

        it('should create a new activity log', async () => {
            modelMock.create.mockResolvedValue(activityLog);

            const result = await service.createActivity(activityLog);

            expect(modelMock.create).toHaveBeenCalledWith(activityLog);
            expect(result).toEqual(activityLog);
        });

        it('should return existing activity if duplicate key error occurs', async () => {
            const error = {
                name: mongoDuplicateErrorName,
                code: mongoDuplicateKeyErrorCode,
            };
            modelMock.create.mockRejectedValue(error);
            modelMock.findOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue(activityLog),
            });

            const result = await service.createActivity(activityLog);

            expect(modelMock.create).toHaveBeenCalledWith(activityLog);
            expect(modelMock.findOne).toHaveBeenCalledWith({
                entityId: activityLog.entityId,
                action: new RegExp(activityLog.action),
            });
            expect(result).toEqual(activityLog);
        });

        it('should throw error if creation fails with non-duplicate error', async () => {
            const error = new Error('Some mongo error');
            modelMock.create.mockRejectedValue(error);

            await expect(service.createActivity(activityLog)).rejects.toThrow('Some mongo error');
        });
        it('should handle multiple duplicate key errors', async () => {
            const duplicateError = {
                name: mongoDuplicateErrorName,
                code: mongoDuplicateKeyErrorCode,
            };
            modelMock.create.mockRejectedValueOnce(duplicateError).mockRejectedValueOnce(duplicateError);
            modelMock.findOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue(activityLog),
            });

            await service.createActivity(activityLog);
            await service.createActivity(activityLog);

            expect(modelMock.findOne).toHaveBeenCalledTimes(2);
        });

        it('should return null if duplicate found but findOne returns null', async () => {
            const duplicateError = {
                name: mongoDuplicateErrorName,
                code: mongoDuplicateKeyErrorCode,
            };
            modelMock.create.mockRejectedValue(duplicateError);
            modelMock.findOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue(null),
            });

            const result = await service.createActivity(activityLog);

            expect(result).toBeNull();
        });
    });
});
