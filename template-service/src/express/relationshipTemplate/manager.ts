import { FilterQuery, Document, ClientSession } from 'mongoose';
import RelationshipTemplateModel from './model';
import { IRelationshipTemplate } from './interface';
import { NotFoundError } from '../error';
import { escapeRegExp } from '../../utils';

export class RelationshipTemplateManager {
    static getTemplateById(templateId: string) {
        return RelationshipTemplateModel.findById(templateId).orFail(new NotFoundError('Relationship Template not found')).lean().exec();
    }

    static async updateTemplateById(templateId: string, updatedFields: Partial<IRelationshipTemplate>, session?: ClientSession) {
        return RelationshipTemplateModel.findByIdAndUpdate(templateId, updatedFields, { new: true, session })
            .orFail(new NotFoundError('Relationship Template not found'))
            .lean()
            .exec();
    }

    static deleteTemplateById(templateId: string, session?: ClientSession) {
        return RelationshipTemplateModel.findByIdAndDelete(templateId, { session })
            .orFail(new NotFoundError('Relationship Template not found'))
            .lean()
            .exec();
    }

    static async deleteManyTemplatesByIds(templateIds: string[], session?: ClientSession) {
        const { deletedCount } = await RelationshipTemplateModel.deleteMany({ _id: { $in: templateIds } }, { session })
            .lean()
            .exec();

        if (deletedCount !== templateIds.length) throw new NotFoundError('Some Relationship Templates not found');
    }

    static async createTemplate(relationshipTemplate: IRelationshipTemplate, session?: ClientSession) {
        return session
            ? RelationshipTemplateModel.create([relationshipTemplate], { session }).then((res) => res[0])
            : RelationshipTemplateModel.create(relationshipTemplate);
    }

    static searchTemplates(searchBody: {
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

        return RelationshipTemplateModel.find(query).limit(limit).skip(skip).lean().exec();
    }
}

export default RelationshipTemplateManager;
