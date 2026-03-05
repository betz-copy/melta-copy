import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/mongoose';
import { ClsService, MongoModelFactory } from '@packages/utils';
import { Connection } from 'mongoose';
import { PrintingTemplateService } from './printingTemplate.service';

describe('PrintingTemplateService', () => {
    let service: PrintingTemplateService;
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
                PrintingTemplateService,
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

        service = module.get<PrintingTemplateService>(PrintingTemplateService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should get all printing templates', async () => {
        const mockTemplates = [{ _id: '1', name: 'Print Template' }];
        (mockModel.exec as jest.Mock).mockResolvedValue(mockTemplates);

        const result = await service.getAllPrintingTemplates();
        expect(result).toEqual(mockTemplates);
    });

    it('should get printing template by ID', async () => {
        const mockTemplate = { _id: 'test-id', name: 'Print Template' };
        (mockModel.exec as jest.Mock).mockResolvedValue(mockTemplate);

        const result = await service.getPrintingTemplateById('test-id');
        expect(result).toEqual(mockTemplate);
    });

    it('should create a printing template', async () => {
        const createDto = { name: 'New Print Template', sections: [] };
        const mockTemplate = { ...createDto, _id: 'new-id', toObject: () => createDto };
        (mockModel.create as jest.Mock).mockResolvedValue(mockTemplate);

        const result = await service.createPrintingTemplate(createDto as any);
        expect(result).toBeDefined();
    });

    it('should update a printing template', async () => {
        const updateDto = { name: 'Updated Print Template' };
        const mockTemplate = { _id: 'test-id', ...updateDto };
        (mockModel.exec as jest.Mock).mockResolvedValue(mockTemplate);

        const result = await service.updatePrintingTemplate('test-id', updateDto as any);
        expect(result).toEqual(mockTemplate);
    });

    it('should delete a printing template', async () => {
        const mockTemplate = { _id: 'test-id', name: 'To Delete' };
        (mockModel.exec as jest.Mock).mockResolvedValue(mockTemplate);

        const result = await service.deletePrintingTemplate('test-id');
        expect(result).toEqual(mockTemplate);
    });
});
