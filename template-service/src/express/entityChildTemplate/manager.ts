import {
    DefaultManagerMongo,
    NotFoundError,
    IEntityChildTemplate,
    IEntityChildTemplatePopulated,
    IMongoEntityChildTemplate,
} from '@microservices/shared';
import { FilterQuery } from 'mongoose';
import config from '../../config';
import { escapeRegExp } from '../../utils';

import EntityChildTemplateSchema from './model';

class EntityChildTemplateManager extends DefaultManagerMongo<IMongoEntityChildTemplate> {
    constructor(workspaceId: string) {
        super(workspaceId, config.mongo.entityChildTemplatesCollectionName, EntityChildTemplateSchema);
    }

    getChildTemplates(searchQuery: {
        search?: string;
        ids?: string[];
        categoryIds?: string[];
        fatherTemplatesIds?: string[];
        limit: number;
        skip: number;
    }): Promise<IEntityChildTemplatePopulated[]> {
        const { search: displayName, ids, categoryIds, limit, skip, fatherTemplatesIds } = searchQuery;
        const query: FilterQuery<IEntityChildTemplate> = {};

        if (displayName) {
            query.displayName = { $regex: escapeRegExp(displayName) };
        }

        if (ids) {
            query._id = { $in: ids };
        }

        if (categoryIds) {
            query.category = { $in: categoryIds };
        }

        if (fatherTemplatesIds) {
            query.fatherTemplateId = { $in: fatherTemplatesIds };
        }

        return this.model
            .find(query)
            .populate<Pick<IEntityChildTemplatePopulated, 'categories'>>('categories')
            .populate<Pick<IEntityChildTemplatePopulated, 'fatherTemplateId'>>('fatherTemplateId')
            .limit(limit)
            .skip(skip)
            .lean()
            .exec();
    }

    getAllChildTemplates(): Promise<IEntityChildTemplatePopulated[]> {
        return this.model
            .find()
            .populate<Pick<IEntityChildTemplatePopulated, 'categories'>>('categories')
            .populate<Pick<IEntityChildTemplatePopulated, 'fatherTemplateId'>>('fatherTemplateId')
            .lean()
            .exec();
    }

    getChildTemplateById(id: string): Promise<IEntityChildTemplatePopulated> {
        return this.model
            .findById(id)
            .populate<Pick<IEntityChildTemplatePopulated, 'categories'>>('categories')
            .populate<Pick<IEntityChildTemplatePopulated, 'fatherTemplateId'>>('fatherTemplateId')
            .orFail(new NotFoundError('Entity Child Template not found'))
            .lean()
            .exec();
    }

    async createChildTemplate(childTemplate: IEntityChildTemplate): Promise<IMongoEntityChildTemplate> {
        return this.model.create(childTemplate);
    }

    async updateChildTemplate(id: string, childTemplate: IEntityChildTemplate): Promise<IMongoEntityChildTemplate | null> {
        return this.model.findByIdAndUpdate(id, childTemplate, { new: true }).orFail(new NotFoundError('Entity Child Template not found'));
    }

    async updateChildrenDisplayNames(fatherTemplateId: string, oldDisplayName: string, newDisplayName: string): Promise<void> {
        const result = await this.model.updateMany({ fatherTemplateId }, [
            { $set: { displayName: { $replaceOne: { input: '$displayName', find: oldDisplayName, replacement: newDisplayName } } } },
        ]);

        if (result.modifiedCount === 0) {
            throw new NotFoundError('No child templates found');
        }
    }

    async deleteChildTemplate(id: string): Promise<IMongoEntityChildTemplate | null> {
        return this.model.findByIdAndDelete(id).orFail(new NotFoundError('Entity Child Template not found'));
    }

    async updateEntityTemplateAction(id: string, actions: string) {
        return this.model
            .findByIdAndUpdate(id, { actions }, { new: true })
            .populate('categories')
            .orFail(new NotFoundError('Entity Child Template not found'))
            .lean()
            .exec();
    }
}

export default EntityChildTemplateManager;
