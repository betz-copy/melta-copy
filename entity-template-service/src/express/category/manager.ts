import CategoryModel from './model';
import { ICategory } from './interface';
import { ServiceError } from '../error';
import { EntityTemplateManager } from '../entityTemplate/manager';

class CategoryManager {
    static getCategories(displayName?: string) {
        return CategoryModel.find(displayName ? { displayName: { $regex: new RegExp(`.*${displayName}.*`) } } : {})
            .lean()
            .exec();
    }

    static getCategoryById(id: string) {
        return CategoryModel.findById(id).orFail(new ServiceError(404, 'Category not found')).lean().exec();
    }

    static createCategory(categoryData: ICategory) {
        return CategoryModel.create(categoryData);
    }

    static async deleteCategory(id: string) {
        const templates = await EntityTemplateManager.getTemplates({ categoryId: id, limit: 0, skip: 0 });
        if (templates.length > 0) {
            throw new ServiceError(403, 'category still has entity templates');
        }

        return CategoryModel.findByIdAndDelete(id).orFail(new ServiceError(404, 'Category not found')).lean().exec();
    }

    static updateCategory(id: string, updatedData: Partial<ICategory>) {
        return CategoryModel.findByIdAndUpdate(id, updatedData, { new: true }).orFail(new ServiceError(404, 'Category not found')).lean().exec();
    }
}
export default CategoryManager;
