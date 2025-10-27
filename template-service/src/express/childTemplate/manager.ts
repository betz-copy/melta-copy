import {
    DefaultManagerMongo,
    IChildTemplate,
    IChildTemplatePopulated,
    IChildTemplatePopulatedFromDb,
    IMongoChildTemplate,
    IMongoChildTemplatePopulated,
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
    }): Promise<IMongoChildTemplatePopulated[]> {
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
            .orFail(new NotFoundError('Child Template not found'))
            .lean()
            .exec();

        return populateChildTemplateWithParent(populatedWithParent);
    }

    async createChildTemplate(childTemplate: IChildTemplate): Promise<IChildTemplatePopulated> {
        const createdDoc = await this.model.create(childTemplate);
        return this.getChildTemplateById(createdDoc._id);
    }

    async updateChildTemplate(id: string, childTemplate: IChildTemplate): Promise<IChildTemplatePopulated | null> {
        // TODO: try to .populate with .findByIdAndUpdate

        const childTemplateToUpdate = { ...childTemplate };

        if (!childTemplate.isFilterByCurrentUser) {
            childTemplateToUpdate.filterByCurrentUserField = null;
        }
        if (!childTemplate.isFilterByUserUnit) {
            childTemplateToUpdate.filterByUnitUserField = null;
        }

        const updatedDoc = await this.model
            .findByIdAndUpdate(id, childTemplateToUpdate, { new: true })
            .orFail(new NotFoundError('Child Template not found'));

        return this.getChildTemplateById(updatedDoc._id);
    }

    async updateChildrenDisplayNames(parentTemplateId: string, oldDisplayName: string, newDisplayName: string): Promise<void> {
        await this.model.updateMany({ parentTemplateId }, [
            { $set: { displayName: { $replaceOne: { input: '$displayName', find: oldDisplayName, replacement: newDisplayName } } } },
        ]);
    }

    async deleteChildTemplate(id: string): Promise<IMongoChildTemplate | null> {
        return this.model.findByIdAndDelete(id).orFail(new NotFoundError('Entity Child Template not found'));
    }

    async updateEntityTemplateAction(id: string, actions: string) {
        return this.model
            .findByIdAndUpdate(id, { actions }, { new: true })
            .populate('category')
            .orFail(new NotFoundError('Child Template not found'))
            .lean()
            .exec();
    }

    async updateChildTemplateStatus(id: string, disabledStatus: boolean) {
        const populatedWithParent = await this.model
            .findByIdAndUpdate(id, { disabled: disabledStatus }, { new: true })
            .populate<Pick<IChildTemplatePopulatedFromDb, 'category'>>('category')
            .populate<Pick<IChildTemplatePopulatedFromDb, 'parentTemplateId'>>('parentTemplateId')
            .orFail(new NotFoundError('Child Template not found'))
            .lean()
            .exec();

        return populateChildTemplateWithParent(populatedWithParent);
    }

    async multiUpdateChildTemplateStatusByParentId(parentTemplateId: string, disabledStatus: boolean) {
        await this.model.updateMany({ parentTemplateId }, { $set: { disabled: disabledStatus } });

        const populatedWithParent = await this.model
            .find({ parentTemplateId })
            .populate<Pick<IChildTemplatePopulatedFromDb, 'category'>>('category')
            .populate<Pick<IChildTemplatePopulatedFromDb, 'parentTemplateId'>>('parentTemplateId')
            .lean()
            .exec();

        return populatedWithParent.map(populateChildTemplateWithParent);
    }
}

export default ChildTemplateManager;
