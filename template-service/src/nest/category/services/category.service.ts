import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { IMongoCategory } from '@packages/category';
import { ClsService, DefaultMongoService, MongoModelFactory } from '@packages/utils';
import { ConfigTypes, IMongoCategoryOrderConfig } from '@packages/workspace';
import { ClientSession, Connection } from 'mongoose';
import config from '../../../config';
import { ConfigService } from '../../config/services/config.service';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto/category.dto';
import { Category, CategorySchema } from '../schemas/category.schema';

@Injectable()
export class CategoryService extends DefaultMongoService<Category> {
    constructor(
        @InjectConnection() connection: Connection,
        cls: ClsService,
        mongoModelFactory: MongoModelFactory,
        private readonly configService: ConfigService,
    ) {
        super(connection, cls, config.mongo.categoriesCollectionName, CategorySchema, mongoModelFactory, Category.name);
    }

    async getCategories(displayName?: string): Promise<IMongoCategory[]> {
        const query = displayName ? { displayName: { $regex: new RegExp(`.*${displayName}.*`, 'i') } } : {};
        return this.model.find(query).lean<IMongoCategory[]>().exec();
    }

    async getCategoryById(id: string): Promise<IMongoCategory> {
        const category = await this.model.findById(id).lean<IMongoCategory>().exec();
        if (!category) {
            throw new NotFoundException(`Category with ID ${id} not found`);
        }
        return category;
    }

    async createCategory(categoryData: CreateCategoryDto): Promise<IMongoCategory> {
        const category = await this.model.create(categoryData);

        try {
            const categoryOrder = (await this.configService.getConfigByType(ConfigTypes.CATEGORY_ORDER)) as IMongoCategoryOrderConfig;
            const { order } = categoryOrder;
            await this.configService.updateCategoryOrder(categoryOrder._id.toString(), order.length, category._id.toString());
        } catch {
            await this.configService.createCategoryOrder({ type: ConfigTypes.CATEGORY_ORDER, order: [category._id.toString()] });
        }

        return category.toObject() as unknown as IMongoCategory;
    }

    async deleteCategory(id: string): Promise<IMongoCategory> {
        try {
            const categoryOrder = (await this.configService.getConfigByType(ConfigTypes.CATEGORY_ORDER)) as IMongoCategoryOrderConfig;
            const { order } = categoryOrder;
            const index = order.indexOf(id);

            if (index > -1) {
                await this.configService.updateCategoryOrder(categoryOrder._id.toString(), -1, id, true);
            }
        } catch {
            // If category order doesn't exist, continue with deletion
        }

        const category = await this.model.findByIdAndDelete(id).lean<IMongoCategory>().exec();
        if (!category) {
            throw new NotFoundException(`Category with ID ${id} not found`);
        }
        return category;
    }

    async updateCategory(id: string, updatedData: UpdateCategoryDto): Promise<IMongoCategory> {
        const category = await this.model.findByIdAndUpdate(id, updatedData, { new: true }).lean<IMongoCategory>().exec();
        if (!category) {
            throw new NotFoundException(`Category with ID ${id} not found`);
        }
        return category;
    }

    async updateCategoryTemplatesOrder(
        templateId: string,
        newCategoryId: string,
        srcCategoryId: string,
        newIndex: number,
        session?: ClientSession,
    ): Promise<{ oldCategory: IMongoCategory; newCategory: IMongoCategory }> {
        const oldCategory = await this.model
            .findByIdAndUpdate(srcCategoryId, { $pullAll: { templatesOrder: [templateId] } }, { new: true, session })
            .lean<IMongoCategory>()
            .exec();

        if (!oldCategory) {
            throw new NotFoundException(`Source category with ID ${srcCategoryId} not found`);
        }

        const newCategory = await this.model
            .findByIdAndUpdate(newCategoryId, { $push: { templatesOrder: { $each: [templateId], $position: newIndex } } }, { new: true, session })
            .lean<IMongoCategory>()
            .exec();

        if (!newCategory) {
            throw new NotFoundException(`Destination category with ID ${newCategoryId} not found`);
        }

        return { oldCategory, newCategory };
    }
}
