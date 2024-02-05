import { Document, FilterQuery } from 'mongoose';
import { escapeRegExp } from '../../utils';
import DefaultManager from '../../utils/express/manager';
import { ServiceError } from '../error';
import { IRelationshipTemplate } from './interface';
import RelationshipTemplateModel from './model';

export class RelationshipTemplateManager extends DefaultManager<IRelationshipTemplate> {
    constructor(dbName: string) {
        super(dbName, RelationshipTemplateModel);
    }

    async getTemplateById(templateId: string) {
        return this.model.findById(templateId).orFail(new ServiceError(404, 'Relationship Template not found')).lean().exec();
    }

    async updateTemplateById(templateId: string, updatedFields: Partial<IRelationshipTemplate>) {
        return this.model
            .findByIdAndUpdate(templateId, updatedFields, { new: true })
            .orFail(new ServiceError(404, 'Relationship Template not found'))
            .lean()
            .exec();
    }

    async deleteTemplateById(templateId: string) {
        return this.model.findByIdAndDelete(templateId).orFail(new ServiceError(404, 'Relationship Template not found')).lean().exec();
    }

    async createTemplate(relationshipTemplate: IRelationshipTemplate) {
        return this.model.create(relationshipTemplate);
    }

    async searchTemplates(searchBody: {
        search?: string;
        ids?: string[];
        sourceEntityIds?: string[];
        destinationEntityIds?: string[];
        limit: number;
        skip: number;
    }) {
        const { search, ids, sourceEntityIds, destinationEntityIds, limit, skip } = searchBody;
        const query: FilterQuery<IRelationshipTemplate & Document> = {};

        if (search) {
            query.displayName = { $regex: escapeRegExp(search) };
        }

        if (ids) {
            query._id = { $in: ids };
        }

        if (sourceEntityIds) {
            query.sourceEntityId = { $in: sourceEntityIds };
        }

        if (destinationEntityIds) {
            query.destinationEntityId = { $in: destinationEntityIds };
        }

        return this.model.find(query).limit(limit).skip(skip).lean().exec();
    }
}

export default RelationshipTemplateManager;
