import CategoryModel from './model';
import { ICategory } from './interface';
import { NotFoundError } from '../error';

class CategoryManager {
    static getCategories(displayName?: string) {
        return CategoryModel.find(displayName ? { displayName: { $regex: new RegExp(`.*${displayName}.*`) } } : {})
            .lean()
            .exec();
    }

    static getCategoryById(id: string) {
        return CategoryModel.findById(id).orFail(new NotFoundError('Category not found')).lean().exec();
    }

    static async createCategory(categoryData: ICategory) {
        return CategoryModel.create(categoryData);
    }

    static async deleteCategory(id: string) {
        return CategoryModel.findByIdAndDelete(id).orFail(new NotFoundError('Category not found')).lean().exec();
    }

    static async updateCategory(id: string, updatedData: Partial<ICategory>) {
        return CategoryModel.findByIdAndUpdate(id, updatedData, { new: true }).orFail(new NotFoundError('Category not found')).lean().exec();
    }
}
export default CategoryManager;
