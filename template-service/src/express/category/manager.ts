import config from '../../config';
import { DefaultManagerMongo } from '../../utils/mongo/manager';
import { NotFoundError } from '../error';
import { ICategory, IMongoCategory } from './interface';
import { CategorySchema } from './model';
import ConfigManager from '../config/manager';

class CategoryManager extends DefaultManagerMongo<IMongoCategory> {
    private configManager: ConfigManager;

    constructor(workspaceId: string) {
        super(workspaceId, config.mongo.categoriesCollectionName, CategorySchema);
        this.configManager = new ConfigManager(workspaceId);
    }

    async getCategories(displayName?: string) {
        const categories = await this.model
            .find(displayName ? { displayName: { $regex: new RegExp(`.*${displayName}.*`) } } : {})
            .lean()
            .exec();

        const categoryOrder = await this.configManager.getOrderConfigByName('categoryOrder');

        return categories.sort((a, b) => categoryOrder.order.indexOf(a._id) - categoryOrder.order.indexOf(b._id));
    }

    async getCategoryById(id: string) {
        return this.model.findById(id).orFail(new NotFoundError('Category not found')).lean().exec();
    }

    async createCategory(categoryData: ICategory) {
        const category = await this.model.create(categoryData);

        const categoryOrder = await this.configManager.getOrderConfigByName('categoryOrder');
        const order = categoryOrder.order;
        order.push(category._id);
        this.configManager.updateOrder(categoryOrder._id, { order: order });

        return category;
    }

    async deleteCategory(id: string) {
        const categoryOrder = await this.configManager.getOrderConfigByName('categoryOrder');
        const order = categoryOrder.order;
        const index = order.indexOf(id);
        if (index > -1) {
            order.splice(index, 1);
            this.configManager.updateOrder(categoryOrder._id, { order: order });
        }

        return this.model.findByIdAndDelete(id).orFail(new NotFoundError('Category not found')).lean().exec();
    }

    async updateCategory(id: string, updatedData: Partial<ICategory>) {
        return this.model.findByIdAndUpdate(id, updatedData, { new: true }).orFail(new NotFoundError('Category not found')).lean().exec();
    }

    async updateCategoryTempOrder(
        templateId: string,
        newCategoryId: string,
        srcCategoryId: string,
        newIndex: number,
    ): Promise<{ oldCategory: IMongoCategory; newCategory: IMongoCategory }> {
        const oldCategory: IMongoCategory = await this.model
            .findByIdAndUpdate(srcCategoryId, { $pullAll: { templateOrder: [templateId.toString()] } }, { new: true })
            .orFail(new NotFoundError('Category not found'))
            .lean()
            .exec();

        const newCategory: IMongoCategory = await this.model
            .findByIdAndUpdate(newCategoryId, { $push: { templateOrder: { $each: [templateId.toString()], $position: newIndex } } }, { new: true })
            .orFail(new NotFoundError('Category not found'))
            .lean()
            .exec();

        return { oldCategory, newCategory };
    }
}

export default CategoryManager;
