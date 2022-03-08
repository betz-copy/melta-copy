import { FilterQuery, Document } from 'mongoose';
import EntityTemplateModel from './model';
import { IEntityTemplate } from './interface';
import { ServiceError } from '../error';
import { escapeRegExp } from '../../utils';
import { getRelationshipTemplates } from '../../relationshipTemplateManager';
import CategoryManager from '../category/manager';

export class EntityTemplateManager {
    static getTemplates(queryGetAll: { search?: string; categoryId?: string; limit: number; skip: number }) {
        const { search: displayName, categoryId: category, limit, skip } = queryGetAll;
        const query: FilterQuery<IEntityTemplate & Document<any, any, any>> = {};

        if (displayName) {
            query.displayName = { $regex: escapeRegExp(displayName) };
        }

        if (category) {
            query.category = category;
        }

        return EntityTemplateModel.find(query).populate('category').limit(limit).skip(skip).lean().exec();
    }

    static getTemplateById(id: string) {
        return EntityTemplateModel.findById(id).populate('category').orFail(new ServiceError(404, 'Entity Template not found')).lean().exec();
    }

    static getTemplatesByCategory(category: string) {
        return EntityTemplateModel.find({ category }).lean().exec();
    }

    static async createTemplate(templateData: IEntityTemplate) {
        await CategoryManager.getCategoryById(templateData.category);

        return EntityTemplateModel.create(templateData);
    }

    static async throwIfEntityHasRelationships(id: string) {
        const outgoingRelationships = await getRelationshipTemplates({ sourceEntityId: id });
        if (outgoingRelationships.length > 0) {
            throw new ServiceError(403, 'entity template still has outgoing relationships');
        }
        const incomingRelationships = await getRelationshipTemplates({ destinationEntityId: id });
        if (incomingRelationships.length > 0) {
            throw new ServiceError(403, 'entity template still has incoming relationships');
        }
    }

    static async deleteTemplate(id: string) {
        await EntityTemplateManager.throwIfEntityHasRelationships(id);

        return EntityTemplateModel.findByIdAndDelete(id).orFail(new ServiceError(404, 'Entity Template not found')).lean().exec();
    }

    static async updateEntityTemplate(id: string, updatedTemplate: Partial<IEntityTemplate>) {
        if (updatedTemplate.category) {
            await CategoryManager.getCategoryById(updatedTemplate.category);
        }

        return EntityTemplateModel.findByIdAndUpdate(id, updatedTemplate, { new: true })
            .populate('category')
            .orFail(new ServiceError(404, 'Entity Template not found'))
            .lean()
            .exec();
    }
}

export default EntityTemplateManager;
