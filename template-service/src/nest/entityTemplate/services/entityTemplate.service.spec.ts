import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { ClsService, MongoModelFactory } from '@packages/utils';
import { EntityTemplateService } from './entityTemplate.service';
import { CategoryService } from '../../category/services/category.service';
import { RelationshipTemplateService } from '../../relationshipTemplate/services/relationshipTemplate.service';

describe('EntityTemplateService', () => {
    let service: EntityTemplateService;
    let mockModel: any;
    let mockCategoryService: Partial<CategoryService>;
    let mockRelationshipTemplateService: Partial<RelationshipTemplateService>;

    beforeEach(async () => {
        mockModel = {
            find: jest.fn().mockReturnThis(),
            findById: jest.fn().mockReturnThis(),
            findByIdAndUpdate: jest.fn().mockReturnThis(),
            findByIdAndDelete: jest.fn().mockReturnThis(),
            create: jest.fn(),
            lean: jest.fn().mockReturnThis(),
            populate: jest.fn().mockReturnThis(),
            exec: jest.fn(),
        };

        mockCategoryService = {
            getCategoryById: jest.fn(),
            updateCategory: jest.fn(),
        };

        mockRelationshipTemplateService = {
            deleteBySourceOrDestination: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EntityTemplateService,
                { provide: getConnectionToken(), useValue: { model: jest.fn().mockReturnValue(mockModel) } },
                { provide: ClsService, useValue: { get: jest.fn(), set: jest.fn() } },
                { provide: MongoModelFactory, useValue: { getModel: jest.fn().mockReturnValue(mockModel) } },
                { provide: CategoryService, useValue: mockCategoryService },
                { provide: RelationshipTemplateService, useValue: mockRelationshipTemplateService },
            ],
        }).compile();

        service = module.get<EntityTemplateService>(EntityTemplateService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getTemplateById', () => {
        it('should return a template by ID', async () => {
            const mockTemplate = {
                _id: '1',
                name: 'person',
                displayName: 'Person',
                properties: { properties: {} },
            };

            (mockModel.exec as jest.Mock).mockResolvedValueOnce(mockTemplate);

            const result = await service.getTemplateById('1');

            expect(mockModel.findById).toHaveBeenCalledWith('1');
            expect(result).toEqual(mockTemplate);
        });

        it('should throw NotFoundException if template not found', async () => {
            (mockModel.exec as jest.Mock).mockResolvedValueOnce(null);

            await expect(service.getTemplateById('nonexistent')).rejects.toThrow(NotFoundException);
        });
    });

    describe('createTemplate', () => {
        it('should create a template', async () => {
            const createDto = {
                name: 'person',
                displayName: 'Person',
                category: '507f1f77bcf86cd799439011',
                properties: { properties: {} },
                propertiesOrder: [],
                propertiesTypeOrder: [],
                propertiesPreview: [],
            };

            const mockCreated = {
                _id: '1',
                ...createDto,
                toObject: jest.fn().mockReturnValue({ _id: '1', ...createDto }),
            };

            (mockModel.create as jest.Mock).mockResolvedValueOnce(mockCreated);
            (mockCategoryService.getCategoryById as jest.Mock).mockResolvedValueOnce({ _id: '507f1f77bcf86cd799439011', templatesOrder: [] });

            const result = await service.createTemplate(createDto as any);

            expect(mockModel.create).toHaveBeenCalled();
            expect(result).toBeDefined();
        });
    });

    describe('deleteTemplate', () => {
        it('should delete a template', async () => {
            const mockTemplate = {
                _id: '1',
                name: 'person',
                category: '507f1f77bcf86cd799439011',
            };

            (mockModel.exec as jest.Mock).mockResolvedValueOnce(mockTemplate);
            (mockCategoryService.getCategoryById as jest.Mock).mockResolvedValueOnce({ _id: '507f1f77bcf86cd799439011', templatesOrder: ['1'] });

            const result = await service.deleteTemplate('1');

            expect(mockModel.findByIdAndDelete).toHaveBeenCalledWith('1');
            expect(result).toEqual(mockTemplate);
        });
    });
});
