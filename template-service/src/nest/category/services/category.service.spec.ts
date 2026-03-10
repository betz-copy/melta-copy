import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { Connection } from 'mongoose';
import { ClsService, MongoModelFactory } from '@packages/utils';
import { ConfigTypes } from '@packages/workspace';
import { CategoryService } from '../services/category.service';
import { ConfigService } from '../../config/services/config.service';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto/category.dto';
import { IMongoCategory } from '@packages/category';

describe('CategoryService', () => {
    let service: CategoryService;
    let mockModel: any;
    let mockConfigService: Partial<ConfigService>;
    let mockConnection: Partial<Connection>;
    let mockClsService: Partial<ClsService>;
    let mockMongoModelFactory: Partial<MongoModelFactory>;

    beforeEach(async () => {
        // Mock model methods
        mockModel = {
            find: jest.fn().mockReturnThis(),
            findById: jest.fn().mockReturnThis(),
            findByIdAndUpdate: jest.fn().mockReturnThis(),
            findByIdAndDelete: jest.fn().mockReturnThis(),
            create: jest.fn(),
            lean: jest.fn().mockReturnThis(),
            exec: jest.fn(),
            toObject: jest.fn(),
        };

        // Mock config service
        mockConfigService = {
            getConfigByType: jest.fn(),
            updateCategoryOrder: jest.fn(),
            createCategoryOrder: jest.fn(),
        };

        // Mock connection
        mockConnection = {
            model: jest.fn().mockReturnValue(mockModel),
        };

        // Mock CLS service
        mockClsService = {
            get: jest.fn(),
            set: jest.fn(),
        };

        // Mock MongoModelFactory
        mockMongoModelFactory = {
            getModel: jest.fn().mockReturnValue(mockModel),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CategoryService,
                {
                    provide: getConnectionToken(),
                    useValue: mockConnection,
                },
                {
                    provide: ClsService,
                    useValue: mockClsService,
                },
                {
                    provide: MongoModelFactory,
                    useValue: mockMongoModelFactory,
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
            ],
        }).compile();

        service = module.get<CategoryService>(CategoryService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getCategories', () => {
        it('should return all categories when no search term provided', async () => {
            const mockCategories: IMongoCategory[] = [
                {
                    _id: '507f1f77bcf86cd799439011',
                    name: 'person',
                    displayName: 'Person',
                    color: '#FF5733',
                    iconFileId: null,
                    templatesOrder: [],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            (mockModel.exec as jest.Mock).mockResolvedValue(mockCategories);

            const result = await service.getCategories();

            expect(mockModel.find).toHaveBeenCalledWith({});
            expect(result).toEqual(mockCategories);
        });

        it('should return filtered categories when search term provided', async () => {
            const searchTerm = 'Person';
            const mockCategories: IMongoCategory[] = [
                {
                    _id: '507f1f77bcf86cd799439011',
                    name: 'person',
                    displayName: 'Person',
                    color: '#FF5733',
                    iconFileId: null,
                    templatesOrder: [],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            (mockModel.exec as jest.Mock).mockResolvedValue(mockCategories);

            const result = await service.getCategories(searchTerm);

            expect(mockModel.find).toHaveBeenCalledWith({
                displayName: { $regex: new RegExp(`.*${searchTerm}.*`, 'i') },
            });
            expect(result).toEqual(mockCategories);
        });
    });

    describe('getCategoryById', () => {
        it('should return a category when found', async () => {
            const categoryId = '507f1f77bcf86cd799439011';
            const mockCategory: IMongoCategory = {
                _id: categoryId,
                name: 'person',
                displayName: 'Person',
                color: '#FF5733',
                iconFileId: null,
                templatesOrder: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            (mockModel.exec as jest.Mock).mockResolvedValue(mockCategory);

            const result = await service.getCategoryById(categoryId);

            expect(mockModel.findById).toHaveBeenCalledWith(categoryId);
            expect(result).toEqual(mockCategory);
        });

        it('should throw NotFoundException when category not found', async () => {
            const categoryId = '507f1f77bcf86cd799439011';

            (mockModel.exec as jest.Mock).mockResolvedValue(null);

            await expect(service.getCategoryById(categoryId)).rejects.toThrow(NotFoundException);
        });
    });

    describe('createCategory', () => {
        it('should create a category and update category order', async () => {
            const createCategoryDto: CreateCategoryDto = {
                name: 'person',
                displayName: 'Person',
                color: '#FF5733',
                iconFileId: null,
            };

            const mockCreatedCategory = {
                _id: '507f1f77bcf86cd799439011',
                ...createCategoryDto,
                templatesOrder: [],
                toObject: jest.fn().mockReturnValue({
                    _id: '507f1f77bcf86cd799439011',
                    ...createCategoryDto,
                    templatesOrder: [],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }),
            };

            const mockCategoryOrder = {
                _id: '507f1f77bcf86cd799439012',
                type: ConfigTypes.CATEGORY_ORDER,
                order: [],
            };

            (mockModel.create as jest.Mock).mockResolvedValue(mockCreatedCategory);
            (mockConfigService.getConfigByType as jest.Mock).mockResolvedValue(mockCategoryOrder);

            const result = await service.createCategory(createCategoryDto);

            expect(mockModel.create).toHaveBeenCalledWith(createCategoryDto);
            expect(mockConfigService.updateCategoryOrder).toHaveBeenCalledWith(
                mockCategoryOrder._id.toString(),
                0,
                mockCreatedCategory._id.toString(),
            );
            expect(result).toBeDefined();
        });

        it('should create category and category order if order does not exist', async () => {
            const createCategoryDto: CreateCategoryDto = {
                name: 'person',
                displayName: 'Person',
                color: '#FF5733',
                iconFileId: null,
            };

            const mockCreatedCategory = {
                _id: '507f1f77bcf86cd799439011',
                ...createCategoryDto,
                templatesOrder: [],
                toObject: jest.fn().mockReturnValue({
                    _id: '507f1f77bcf86cd799439011',
                    ...createCategoryDto,
                    templatesOrder: [],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }),
            };

            (mockModel.create as jest.Mock).mockResolvedValue(mockCreatedCategory);
            (mockConfigService.getConfigByType as jest.Mock).mockRejectedValue(new NotFoundException());

            const result = await service.createCategory(createCategoryDto);

            expect(mockConfigService.createCategoryOrder).toHaveBeenCalledWith({
                type: ConfigTypes.CATEGORY_ORDER,
                order: [mockCreatedCategory._id.toString()],
            });
            expect(result).toBeDefined();
        });
    });

    describe('updateCategory', () => {
        it('should update and return a category', async () => {
            const categoryId = '507f1f77bcf86cd799439011';
            const updateCategoryDto: UpdateCategoryDto = {
                displayName: 'Updated Person',
                color: '#00FF00',
            };

            const mockUpdatedCategory: IMongoCategory = {
                _id: categoryId,
                name: 'person',
                displayName: 'Updated Person',
                color: '#00FF00',
                iconFileId: null,
                templatesOrder: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            (mockModel.exec as jest.Mock).mockResolvedValue(mockUpdatedCategory);

            const result = await service.updateCategory(categoryId, updateCategoryDto);

            expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith(categoryId, updateCategoryDto, { new: true });
            expect(result).toEqual(mockUpdatedCategory);
        });

        it('should throw NotFoundException when category not found', async () => {
            const categoryId = '507f1f77bcf86cd799439011';
            const updateCategoryDto: UpdateCategoryDto = {
                displayName: 'Updated Person',
            };

            (mockModel.exec as jest.Mock).mockResolvedValue(null);

            await expect(service.updateCategory(categoryId, updateCategoryDto)).rejects.toThrow(NotFoundException);
        });
    });

    describe('deleteCategory', () => {
        it('should delete and return a category', async () => {
            const categoryId = '507f1f77bcf86cd799439011';
            const mockDeletedCategory: IMongoCategory = {
                _id: categoryId,
                name: 'person',
                displayName: 'Person',
                color: '#FF5733',
                iconFileId: null,
                templatesOrder: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const mockCategoryOrder = {
                _id: '507f1f77bcf86cd799439012',
                type: ConfigTypes.CATEGORY_ORDER,
                order: [categoryId],
            };

            (mockConfigService.getConfigByType as jest.Mock).mockResolvedValue(mockCategoryOrder);
            (mockModel.exec as jest.Mock).mockResolvedValue(mockDeletedCategory);

            const result = await service.deleteCategory(categoryId);

            expect(mockConfigService.updateCategoryOrder).toHaveBeenCalledWith(mockCategoryOrder._id.toString(), -1, categoryId, true);
            expect(mockModel.findByIdAndDelete).toHaveBeenCalledWith(categoryId);
            expect(result).toEqual(mockDeletedCategory);
        });

        it('should throw NotFoundException when category not found', async () => {
            const categoryId = '507f1f77bcf86cd799439011';

            (mockModel.exec as jest.Mock).mockResolvedValue(null);

            await expect(service.deleteCategory(categoryId)).rejects.toThrow(NotFoundException);
        });
    });

    describe('updateCategoryTemplatesOrder', () => {
        it('should update templates order between categories', async () => {
            const templateId = '507f1f77bcf86cd799439013';
            const srcCategoryId = '507f1f77bcf86cd799439011';
            const newCategoryId = '507f1f77bcf86cd799439012';
            const newIndex = 0;

            const mockOldCategory: IMongoCategory = {
                _id: srcCategoryId,
                name: 'oldCategory',
                displayName: 'Old Category',
                color: '#FF5733',
                iconFileId: null,
                templatesOrder: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const mockNewCategory: IMongoCategory = {
                _id: newCategoryId,
                name: 'newCategory',
                displayName: 'New Category',
                color: '#00FF00',
                iconFileId: null,
                templatesOrder: [templateId],
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            (mockModel.exec as jest.Mock).mockResolvedValueOnce(mockOldCategory).mockResolvedValueOnce(mockNewCategory);

            const result = await service.updateCategoryTemplatesOrder(templateId, newCategoryId, srcCategoryId, newIndex);

            expect(result).toEqual({ oldCategory: mockOldCategory, newCategory: mockNewCategory });
        });

        it('should throw NotFoundException when source category not found', async () => {
            const templateId = '507f1f77bcf86cd799439013';
            const srcCategoryId = '507f1f77bcf86cd799439011';
            const newCategoryId = '507f1f77bcf86cd799439012';
            const newIndex = 0;

            (mockModel.exec as jest.Mock).mockResolvedValue(null);

            await expect(service.updateCategoryTemplatesOrder(templateId, newCategoryId, srcCategoryId, newIndex)).rejects.toThrow(NotFoundException);
        });
    });
});
