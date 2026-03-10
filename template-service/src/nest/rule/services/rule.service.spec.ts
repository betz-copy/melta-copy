import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/mongoose';
import { ClsService, MongoModelFactory } from '@packages/utils';
import { Connection } from 'mongoose';
import { RuleService } from './rule.service';

describe('RuleService', () => {
    let service: RuleService;
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
                RuleService,
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

        service = module.get<RuleService>(RuleService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should get all rules', async () => {
        const mockRules = [{ _id: '1', name: 'Test Rule' }];
        (mockModel.exec as jest.Mock).mockResolvedValue(mockRules);

        const result = await service.getAllRules();
        expect(result).toEqual(mockRules);
    });

    it('should get rule by ID', async () => {
        const mockRule = { _id: 'test-id', name: 'Test Rule' };
        (mockModel.exec as jest.Mock).mockResolvedValue(mockRule);

        const result = await service.getRuleById('test-id');
        expect(result).toEqual(mockRule);
    });

    it('should create a rule', async () => {
        const createDto = { name: 'New Rule', description: 'Test', entityTemplateId: 'entity-id' };
        const mockRule = { ...createDto, _id: 'new-id', toObject: () => createDto };
        (mockModel.create as jest.Mock).mockResolvedValue(mockRule);

        const result = await service.createRule(createDto as any);
        expect(result).toBeDefined();
    });

    it('should update a rule', async () => {
        const updateDto = { name: 'Updated Rule' };
        const mockRule = { _id: 'test-id', ...updateDto };
        (mockModel.exec as jest.Mock).mockResolvedValue(mockRule);

        const result = await service.updateRule('test-id', updateDto as any);
        expect(result).toEqual(mockRule);
    });

    it('should delete a rule', async () => {
        const mockRule = { _id: 'test-id', name: 'To Delete' };
        (mockModel.exec as jest.Mock).mockResolvedValue(mockRule);

        const result = await service.deleteRule('test-id');
        expect(result).toEqual(mockRule);
    });

    it('should get rules by entity template', async () => {
        const mockRules = [{ _id: '1', name: 'Entity Rule' }];
        (mockModel.exec as jest.Mock).mockResolvedValue(mockRules);

        const result = await service.getRulesByEntityTemplate('entity-id');
        expect(result).toEqual(mockRules);
    });
});
