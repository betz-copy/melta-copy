import { IMongoRelationshipTemplate, IRelationshipTemplate } from '@packages/relationship-template';
import { DefaultManagerMongo } from '@packages/utils';
import { NotFoundError } from '@packages/utils';
import { ClientSession, FilterQuery } from 'mongoose';
import config from '../../config';
import { escapeRegExp } from '../../utils';
import RelationshipTemplateSchema from './model';

export class RelationshipTemplateManager extends DefaultManagerMongo<IMongoRelationshipTemplate> {
    constructor(workspaceId: string) {
        super(workspaceId, config.mongo.relationshipTemplatesCollectionName, RelationshipTemplateSchema);
    }

    async getTemplateById(templateId: string) {
        return this.model.findById(templateId).orFail(new NotFoundError('Relationship Template not found')).lean().exec();
    }

    async updateTemplateById(templateId: string, updatedFields: Partial<IRelationshipTemplate>, session?: ClientSession) {
        return this.model
            .findByIdAndUpdate(templateId, updatedFields, { new: true, session })
            .orFail(new NotFoundError('Relationship Template not found'))
            .lean()
            .exec();
    }

    async deleteTemplateById(templateId: string, session?: ClientSession) {
        return this.model.findByIdAndDelete(templateId, { session }).orFail(new NotFoundError('Relationship Template not found')).lean().exec();
    }

    async deleteManyTemplatesByIds(templateIds: string[], session?: ClientSession) {
        const { deletedCount } = await this.model
            .deleteMany({ _id: { $in: templateIds } }, { session })
            .lean()
            .exec();

        if (deletedCount !== templateIds.length) throw new NotFoundError('Some Relationship Templates not found');
    }

    async createTemplate(relationshipTemplate: IRelationshipTemplate, session?: ClientSession) {
        return session ? this.model.create([relationshipTemplate], { session }).then((res) => res[0]) : this.model.create(relationshipTemplate);
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
        const query: FilterQuery<IRelationshipTemplate> = {};

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
