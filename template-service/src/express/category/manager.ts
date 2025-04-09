import { generateKeyBetween } from 'fractional-indexing';
import config from '../../config';
import { DefaultManagerMongo } from '../../utils/mongo/manager';
import { NotFoundError } from '../error';
import { ICategory, IMongoCategory } from './interface';
import { CategorySchema } from './model';

class CategoryManager extends DefaultManagerMongo<IMongoCategory> {
    constructor(workspaceId: string) {
        super(workspaceId, config.mongo.categoriesCollectionName, CategorySchema);
    }

    async getCategories(displayName?: string) {
        return this.model
            .find(displayName ? { displayName: { $regex: new RegExp(`.*${displayName}.*`) } } : {})
            .sort({ fractionalIndex: 1 })
            .lean()
            .exec();
    }

    async getCategoryById(id: string) {
        return this.model.findById(id).orFail(new NotFoundError('Category not found')).lean().exec();
    }

    async createCategory(categoryData: Omit<ICategory, 'fractionalIndex'>) {
        const lastCategory: IMongoCategory | undefined = (await this.model.find().sort({ fractionalIndex: -1 }).limit(1).lean().exec())[0];
        const index = generateKeyBetween(lastCategory ? lastCategory.fractionalIndex : null, null);

        return this.model.create({ ...categoryData, fractionalIndex: index });
    }

    async deleteCategory(id: string) {
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
