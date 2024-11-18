import { IMongoCategory, ICategory } from '@microservices/shared';
import config from '../../config';
import { DefaultManagerMongo } from '../../utils/mongo/manager';
import { NotFoundError } from '../error';
import { CategorySchema } from './model';

class CategoryManager extends DefaultManagerMongo<IMongoCategory> {
    constructor(workspaceId: string) {
        super(workspaceId, config.mongo.categoriesCollectionName, CategorySchema);
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
        return this.model.create(categoryData);
    }

    async deleteCategory(id: string) {
        return this.model.findByIdAndDelete(id).orFail(new NotFoundError('Category not found')).lean().exec();
    }

    async updateCategory(id: string, updatedData: Partial<ICategory>) {
        return this.model.findByIdAndUpdate(id, updatedData, { new: true }).orFail(new NotFoundError('Category not found')).lean().exec();
    }
}

export default CategoryManager;
