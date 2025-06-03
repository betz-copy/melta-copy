import { DefaultManagerMongo, NotFoundError } from '@microservices/shared';
import { FilterQuery } from 'mongoose';
import config from '../../config';
import { escapeRegExp } from '../../utils';

import { IEntityChildTemplate, IEntityChildTemplatePopulated, IMongoEntityChildTemplate } from './interface';
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
    }) {
        const { search: displayName, ids, categoryIds, limit, skip } = searchQuery;
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

        return this.model
            .find(query)
            .populate<Pick<IEntityChildTemplatePopulated, 'categories'>>('categories')
            .populate<Pick<IEntityChildTemplatePopulated, 'fatherTemplateId'>>('fatherTemplateId')
            .limit(limit)
            .skip(skip)
            .lean()
            .exec();
    }

    getAllChildTemplates() {
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
            .orFail(new NotFoundError('Entity Template not found'))
            .lean()
            .exec();
    }

    async createChildTemplate(childTemplate: IEntityChildTemplate): Promise<IMongoEntityChildTemplate> {
        return this.model.create(childTemplate);
    }

    async updateChildTemplate(id: string, childTemplate: IEntityChildTemplate): Promise<IMongoEntityChildTemplate | null> {
        return this.model.findByIdAndUpdate(id, childTemplate, { new: true });
    }

    async deleteChildTemplate(id: string): Promise<IMongoEntityChildTemplate | null> {
        return this.model.findByIdAndDelete(id).orFail(new NotFoundError('Entity Template not found'));
    }
}

export default EntityChildTemplateManager;
