import CategoryModel from './model';
import { ICategory } from './interface';
import { ServiceError } from '../error';
import { uploadFile, deleteFile } from '../../utils/storageService';
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

    static async createCategory(categoryData: Omit<ICategory, 'iconFileId'>, file?: Express.Multer.File) {
        if (file) {
            const newFile = await uploadFile(file);
            return CategoryModel.create({ ...categoryData, iconFileId: newFile.data.path });
        }

        return CategoryModel.create({ ...categoryData, iconFileId: null });
    }

    static async deleteCategory(id: string) {
        const templates = await EntityTemplateManager.getTemplates({ categoryIds: [id], limit: 0, skip: 0 });
        if (templates.length > 0) {
            throw new ServiceError(403, 'category still has entity templates');
        }

        const category = await CategoryManager.getCategoryById(id);
        if (category.iconFileId !== null) {
            await deleteFile(category.iconFileId);
        }

        return CategoryModel.findByIdAndDelete(id).orFail(new ServiceError(404, 'Category not found')).lean().exec();
    }

    static async updateCategory(id: string, updatedData: Partial<Omit<ICategory, 'iconFileId'>> & { file?: string }, file?: Express.Multer.File) {
        const { file: categoryFile } = updatedData;

        if (file || categoryFile === null) {
            const category = await CategoryManager.getCategoryById(id);
            if (category.iconFileId !== null) {
                await deleteFile(category.iconFileId);
            }

            let iconFileId = null;
            if (file) {
                const newFile = await uploadFile(file);
                iconFileId = newFile.data.path;
            }

            return CategoryModel.findByIdAndUpdate(id, { ...updatedData, iconFileId }, { new: true })
                .orFail(new ServiceError(404, 'Category not found'))
                .lean()
                .exec();
        }
        return CategoryModel.findByIdAndUpdate(id, updatedData, { new: true }).orFail(new ServiceError(404, 'Category not found')).lean().exec();
    }
}
export default CategoryManager;
