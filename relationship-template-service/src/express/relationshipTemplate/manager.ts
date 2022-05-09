import { FilterQuery, Document } from 'mongoose';
import { AxiosError } from 'axios';
import RelationshipTemplateModel from './model';
import { IRelationshipTemplate } from './interface';
import { ServiceError } from '../error';
import { escapeRegExp, trycatch } from '../../utils';
import { getEntityTemplatebyId } from '../../entityTemplateManager';

export class RelationshipTemplateManager {
    static async throw403IfEntityDoesntExist(entityId: string, errorMessage: string) {
        const { err: getEntityErr } = await trycatch(() => getEntityTemplatebyId(entityId));
        if (getEntityErr) {
            if ((getEntityErr as AxiosError).response?.status === 404) {
                throw new ServiceError(403, errorMessage);
            }
            throw getEntityErr;
        }
    }

    static getTemplateById(templateId: string) {
        return RelationshipTemplateModel.findById(templateId).orFail(new ServiceError(404, 'Relationship Template not found')).lean().exec();
    }

    static async updateTemplateById(templateId: string, updatedFields: Partial<IRelationshipTemplate>) {
        if (updatedFields.sourceEntityId) {
            await RelationshipTemplateManager.throw403IfEntityDoesntExist(updatedFields.sourceEntityId, 'source entity of relation doesnt exist');
        }
        if (updatedFields.destinationEntityId) {
            await RelationshipTemplateManager.throw403IfEntityDoesntExist(
                updatedFields.destinationEntityId,
                'destination entity of relation doesnt exist',
            );
        }

        return RelationshipTemplateModel.findByIdAndUpdate(templateId, updatedFields, { new: true })
            .orFail(new ServiceError(404, 'Relationship Template not found'))
            .lean()
            .exec();
    }

    static deleteTemplateById(templateId: string) {
        return RelationshipTemplateModel.findByIdAndDelete(templateId).orFail(new ServiceError(404, 'Relationship Template not found')).lean().exec();
    }

    static async createTemplate(relationshipTemplate: IRelationshipTemplate) {
        await RelationshipTemplateManager.throw403IfEntityDoesntExist(relationshipTemplate.sourceEntityId, 'source entity of relation doesnt exist');
        await RelationshipTemplateManager.throw403IfEntityDoesntExist(
            relationshipTemplate.destinationEntityId,
            'destination entity of relation doesnt exist',
        );

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
