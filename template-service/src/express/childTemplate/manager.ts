import {
    DefaultManagerMongo,
    IChildTemplate,
    IChildTemplatePopulated,
    IChildTemplatePopulatedFromDb,
    IMongoChildTemplate,
    NotFoundError,
} from '@microservices/shared';
import { FilterQuery } from 'mongoose';
import config from '../../config';
import { escapeRegExp } from '../../utils';
import populateChildTemplateWithParent from '../../utils/childTemplate';

import ChildTemplateSchema from './model';

class ChildTemplateManager extends DefaultManagerMongo<IMongoChildTemplate> {
    constructor(workspaceId: string) {
        super(workspaceId, config.mongo.childTemplatesCollectionName, ChildTemplateSchema);
    }

    async searchChildTemplates(searchQuery: {
        search?: string;
        ids?: string[];
        categoryIds?: string[];
        parentTemplatesIds?: string[];
        limit: number;
        skip: number;
    }): Promise<IChildTemplatePopulated[]> {
        const { search: displayName, ids, categoryIds, limit, skip, parentTemplatesIds } = searchQuery;
        const query: FilterQuery<IChildTemplate> = {};

        if (displayName) {
            query.displayName = { $regex: escapeRegExp(displayName) };
        }

        if (ids) {
            query._id = { $in: ids };
        }

        if (categoryIds) {
            query.category = { $in: categoryIds };
        }

        if (parentTemplatesIds) {
            query.parentTemplateId = { $in: parentTemplatesIds };
        }

        const populatedWithParent = await this.model
            .find(query)
            .populate<Pick<IChildTemplatePopulatedFromDb, 'category'>>('category')
            .populate<Pick<IChildTemplatePopulatedFromDb, 'parentTemplateId'>>('parentTemplateId')
            .limit(limit)
            .skip(skip)
            .lean()
            .exec();

        return populatedWithParent.map(populateChildTemplateWithParent);
    }

    async getAllChildTemplates(): Promise<IChildTemplatePopulated[]> {
        const populatedWithParent = await this.model
            .find()
            .populate<Pick<IChildTemplatePopulatedFromDb, 'category'>>('category')
            .populate<Pick<IChildTemplatePopulatedFromDb, 'parentTemplateId'>>('parentTemplateId')
            .lean()
            .exec();

        return populatedWithParent.map(populateChildTemplateWithParent);
    }

    async getChildTemplateById(id: string): Promise<IChildTemplatePopulated> {
        const populatedWithParent = await this.model
            .findById(id)
            .populate<Pick<IChildTemplatePopulatedFromDb, 'category'>>('category')
            .populate<Pick<IChildTemplatePopulatedFromDb, 'parentTemplateId'>>('parentTemplateId')
            .orFail(new NotFoundError('Entity Child Template not found'))
            .lean()
            .exec();

        return populateChildTemplateWithParent(populatedWithParent);
    }

    async createChildTemplate(childTemplate: IChildTemplate): Promise<IMongoChildTemplate> {
        return this.model.create(childTemplate);
    }

    async updateChildTemplate(id: string, childTemplate: IChildTemplate): Promise<IMongoChildTemplate | null> {
        return this.model.findByIdAndUpdate(id, childTemplate, { new: true }).orFail(new NotFoundError('Entity Child Template not found'));
    }

    async updateChildrenDisplayNames(parentTemplateId: string, oldDisplayName: string, newDisplayName: string): Promise<void> {
        const result = await this.model.updateMany({ parentTemplateId }, [
            { $set: { displayName: { $replaceOne: { input: '$displayName', find: oldDisplayName, replacement: newDisplayName } } } },
        ]);

        if (result.modifiedCount === 0) {
            throw new NotFoundError('No child templates found');
        }
    }

    async deleteChildTemplate(id: string): Promise<IMongoChildTemplate | null> {
        return this.model.findByIdAndDelete(id).orFail(new NotFoundError('Entity Child Template not found'));
    }

    async updateEntityTemplateAction(id: string, actions: string) {
        return this.model
            .findByIdAndUpdate(id, { actions }, { new: true })
            .populate('category')
            .orFail(new NotFoundError('Entity Child Template not found'))
            .lean()
            .exec();
    }
}

export default ChildTemplateManager;
