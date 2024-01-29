import DefaultManager from '../../utils/express/manager';
import { ServiceError } from '../error';
import { ICategory } from './interface';
import CategoryModel from './model';

class CategoryManager extends DefaultManager<ICategory> {
    constructor(dbName: string) {
        super(dbName, CategoryModel);
    }

    async getCategories(displayName?: string) {
        return this.model
            .find(displayName ? { displayName: { $regex: new RegExp(`.*${displayName}.*`) } } : {})
            .lean()
            .exec();
    }

    async getCategoryById(id: string) {
        return this.model.findById(id).orFail(new ServiceError(404, 'Category not found')).lean().exec();
    }

    async createCategory(categoryData: ICategory) {
        return this.model.create(categoryData);
    }

    async deleteCategory(id: string) {
        return this.model.findByIdAndDelete(id).orFail(new ServiceError(404, 'Category not found')).lean().exec();
    }

    async updateCategory(id: string, updatedData: Partial<ICategory>) {
        return this.model.findByIdAndUpdate(id, updatedData, { new: true }).orFail(new ServiceError(404, 'Category not found')).lean().exec();
    }
}

export default CategoryManager;
