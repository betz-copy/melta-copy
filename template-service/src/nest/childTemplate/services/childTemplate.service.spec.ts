import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/mongoose';
import { ClsService, MongoModelFactory } from '@packages/utils';
import { Connection } from 'mongoose';
import { ChildTemplateService } from './childTemplate.service';

describe('ChildTemplateService', () => {
    let service: ChildTemplateService;
    let mockModel: any;
    let mockConnection: Partial<Connection>;

    beforeEach(async () => {
        mockModel = {
            find: jest.fn().mockReturnThis(),
            findById: jest.fn().mockReturnThis(),
            create: jest.fn(),
            findByIdAndUpdate: jest.fn().mockReturnThis(),
            findByIdAndDelete: jest.fn().mockReturnThis(),
            lean: jest.fn().mockReturnThis(),
            exec: jest.fn(),
        };

        mockConnection = {
            model: jest.fn().mockReturnValue(mockModel),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ChildTemplateService,
                {
                    provide: getConnectionToken(),
                    useValue: mockConnection,
                },
                {
                    provide: ClsService,
                    useValue: {
                        get: jest.fn(),
                        set: jest.fn(),
                    },
                },
                {
                    provide: MongoModelFactory,
                    useValue: {
                        create: jest.fn().mockReturnValue(mockModel),
                    },
                },
            ],
        }).compile();

        service = module.get<ChildTemplateService>(ChildTemplateService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should get all child templates', async () => {
        const mockTemplates = [{ _id: '1', name: 'Test Template' }];
        (mockModel.exec as jest.Mock).mockResolvedValue(mockTemplates);

        const result = await service.getAllChildTemplates();
        expect(result).toEqual(mockTemplates);
        expect(mockModel.find).toHaveBeenCalled();
    });

    it('should get child template by ID', async () => {
        const mockTemplate = { _id: 'test-id', name: 'Test Template' };
        (mockModel.exec as jest.Mock).mockResolvedValue(mockTemplate);

        const result = await service.getChildTemplateById('test-id');
        expect(result).toEqual(mockTemplate);
    });

    it('should throw NotFoundException when template not found', async () => {
        (mockModel.exec as jest.Mock).mockResolvedValue(null);

        await expect(service.getChildTemplateById('invalid-id')).rejects.toThrow();
    });

    it('should create a child template', async () => {
        const createDto = { name: 'New Template', displayName: 'New Template', parentTemplateId: 'parent-id', category: 'cat-id' };
        const mockTemplate = { ...createDto, _id: 'new-id', toObject: () => createDto };
        (mockModel.create as jest.Mock).mockResolvedValue(mockTemplate);

        const result = await service.createChildTemplate(createDto as any);
        expect(result).toBeDefined();
    });

    it('should update a child template', async () => {
        const updateDto = { name: 'Updated Template' };
        const mockTemplate = { _id: 'test-id', ...updateDto };
        (mockModel.exec as jest.Mock).mockResolvedValue(mockTemplate);

        const result = await service.updateChildTemplate('test-id', updateDto as any);
        expect(result).toEqual(mockTemplate);
    });

    it('should delete a child template', async () => {
        const mockTemplate = { _id: 'test-id', name: 'To Delete' };
        (mockModel.exec as jest.Mock).mockResolvedValue(mockTemplate);

        const result = await service.deleteChildTemplate('test-id');
        expect(result).toEqual(mockTemplate);
    });
});
