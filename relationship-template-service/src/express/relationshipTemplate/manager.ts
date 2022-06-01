import { FilterQuery, Document } from 'mongoose';
import RelationshipTemplateModel from './model';
import { IRelationshipTemplate } from './interface';
import { ServiceError } from '../error';
import { escapeRegExp } from '../../utils';

export class RelationshipTemplateManager {
    static getTemplateById(templateId: string) {
        return RelationshipTemplateModel.findById(templateId).orFail(new ServiceError(404, 'Relationship Template not found')).lean().exec();
    }

    static async updateTemplateById(templateId: string, updatedFields: Partial<IRelationshipTemplate>) {
        return RelationshipTemplateModel.findByIdAndUpdate(templateId, updatedFields, { new: true })
            .orFail(new ServiceError(404, 'Relationship Template not found'))
            .lean()
            .exec();
    }

    static deleteTemplateById(templateId: string) {
        return RelationshipTemplateModel.findByIdAndDelete(templateId).orFail(new ServiceError(404, 'Relationship Template not found')).lean().exec();
    }

    static async createTemplate(relationshipTemplate: IRelationshipTemplate) {
        return RelationshipTemplateModel.create(relationshipTemplate);
    }

    static searchTemplates(searchBody: {
        search?: string;
        sourceEntityIds?: string[];
        destinationEntityIds?: string[];
        limit: number;
        skip: number;
    }) {
        const { search, sourceEntityIds, destinationEntityIds, limit, skip } = searchBody;
        const query: FilterQuery<IRelationshipTemplate & Document<any, any, any>> = {};

        if (search) {
            query.displayName = { $regex: escapeRegExp(search) };
        }
        if (sourceEntityIds) {
            query.sourceEntityId = { $in: sourceEntityIds };
        }

        if (destinationEntityIds) {
            query.destinationEntityId = { $in: destinationEntityIds };
        }

        return RelationshipTemplateModel.find(query).limit(limit).skip(skip).lean().exec();
    }
}

export default RelationshipTemplateManager;
