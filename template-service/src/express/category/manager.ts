import { ICategory, IMongoCategory } from '@packages/category';
import { DefaultManagerMongo } from '@packages/utils';
import { NotFoundError } from '@packages/utils';
import { ConfigTypes, IMongoCategoryOrderConfig } from '@packages/workspace';
import { ClientSession } from 'mongoose';
import config from '../../config';
import { withTransaction } from '../../utils/mongoose';
import ConfigManager from '../config/manager';
import CategorySchema from './model';

class CategoryManager extends DefaultManagerMongo<IMongoCategory> {
    private configManager: ConfigManager;

    constructor(workspaceId: string) {
        super(workspaceId, config.mongo.categoriesCollectionName, CategorySchema);
        this.configManager = new ConfigManager(workspaceId);
    }

    async getCategories(displayName?: string) {
        return this.model
            .find(displayName ? { displayName: { $regex: new RegExp(`.*${displayName}.*`) } } : {})
            .lean()
            .exec();
    }

    async getCategoryById(id: string) {
        return this.model.findById(id).orFail(new NotFoundError('Category not found')).lean().exec();
    }

    async createCategory(categoryData: ICategory) {
        const category = await this.model.create(categoryData);

        try {
            const categoryOrder: IMongoCategoryOrderConfig = (await this.configManager.getConfigByType(
                ConfigTypes.CATEGORY_ORDER,
            )) as IMongoCategoryOrderConfig;
            const { order } = categoryOrder;
            this.configManager.updateCategoryOrder(categoryOrder._id, order.length, category._id);
        } catch {
            await this.configManager.createCategoryOrder({ type: ConfigTypes.CATEGORY_ORDER, order: [category._id] });
        }

        return category;
    }

    async deleteCategory(id: string) {
        const categoryOrder = (await this.configManager.getConfigByType(ConfigTypes.CATEGORY_ORDER)) as IMongoCategoryOrderConfig;
        const { order } = categoryOrder;
        const index = order.indexOf(id);

        if (index > -1) {
            order.splice(index, 1);
            this.configManager.updateCategoryOrder(categoryOrder._id, -1, id, true);
        }

        return this.model.findByIdAndDelete(id).orFail(new NotFoundError('Category not found')).lean().exec();
    }

    async updateCategory(id: string, updatedData: Partial<ICategory>) {
        return this.model.findByIdAndUpdate(id, updatedData, { new: true }).orFail(new NotFoundError('Category not found')).lean().exec();
    }

    async updateCategoryTemplatesOrder(
        templateId: string,
        newCategoryId: string,
        srcCategoryId: string,
        newIndex: number,
    ): Promise<{ oldCategory: IMongoCategory; newCategory: IMongoCategory }> {
        const updatedCategories = await withTransaction(async (session: ClientSession) => {
            const oldCategory: IMongoCategory = await this.model
                .findByIdAndUpdate(srcCategoryId, { $pullAll: { templatesOrder: [templateId.toString()] } }, { new: true, session })
                .orFail(new NotFoundError('Category not found'))
                .lean()
                .exec();

            const newCategory: IMongoCategory = await this.model
                .findByIdAndUpdate(
                    newCategoryId,
                    { $push: { templatesOrder: { $each: [templateId.toString()], $position: newIndex } } },
                    { new: true, session },
                )
                .orFail(new NotFoundError('Category not found'))
                .lean()
                .exec();

            return { oldCategory, newCategory };
        });

        return updatedCategories;
    }
}

export default CategoryManager;
