import { Document, FilterQuery } from 'mongoose';
import GlobalSearchIndexCreator from '../../externalServices/globalSearchIndexCreator';
import { escapeRegExp } from '../../utils';
import DefaultManager from '../../utils/express/manager';
import { ServiceError } from '../error';
import { IEntitySingleProperty, IEntityTemplate } from './interface';
import EntityTemplateModel from './model';

export class EntityTemplateManager extends DefaultManager<IEntityTemplate> {
    private globalSearchIndexCreator: GlobalSearchIndexCreator;

    constructor(dbName: string) {
        super(dbName, EntityTemplateModel);
        this.globalSearchIndexCreator = new GlobalSearchIndexCreator(dbName);
    }

    async getTemplates(searchQuery: { search?: string; ids?: string[]; categoryIds?: string[]; limit: number; skip: number }) {
        const { search: displayName, ids, categoryIds, limit, skip } = searchQuery;
        const query: FilterQuery<IEntityTemplate & Document<any, any, any>> = {};

        if (displayName) {
            query.displayName = { $regex: escapeRegExp(displayName) };
        }

        if (ids) {
            query._id = { $in: ids };
        }

        if (categoryIds) {
            query.category = { $in: categoryIds };
        }

        return this.model.find(query).populate('category').limit(limit).skip(skip).lean().exec();
    }

    async getTemplateById(id: string) {
        return this.model.findById(id).populate('category').orFail(new ServiceError(404, 'Entity Template not found')).lean().exec();
    }

    async getTemplatesByCategory(category: string) {
        return this.model.find({ category }).lean().exec();
    }

    async createTemplate(templateData: Omit<IEntityTemplate, 'iconFileId'>) {
        const entityTemplate = await this.model.create(templateData);

        await this.globalSearchIndexCreator.sendUpdateIndexesOnUpdateTemplate(entityTemplate._id);

        const entityTemplatePopulated = await entityTemplate.populate('category').execPopulate();

        return entityTemplatePopulated;
    }

    async deleteTemplate(id: string) {
        const entityTemplate = await this.model.findByIdAndDelete(id).orFail(new ServiceError(404, 'Entity Template not found')).lean().exec();

        await this.globalSearchIndexCreator.sendUpdateIndexesOnDeleteTemplate(id);

        return entityTemplate;
    }

    async updateEntityTemplate(id: string, updatedTemplate: Omit<IEntityTemplate, 'disabled'>) {
        const currentEntityTemplate = await this.getTemplateById(id);

        const newEntityTemplate = await this.model
            .findByIdAndUpdate(id, updatedTemplate, { new: true, overwrite: true })
            .populate('category')
            .orFail(new ServiceError(404, 'Entity Template not found'))
            .lean()
            .exec();

        const propertyTypeWithToString = ['number', 'boolean', 'date', 'date-time'];
        const isPropertyWithToString = (property: IEntitySingleProperty) => {
            return propertyTypeWithToString.includes(property.type) || propertyTypeWithToString.includes(property.format!);
        };

        const isPropertyTypeChanged = Object.entries(currentEntityTemplate.properties.properties).some(([key, value]) => {
            const newProperty = newEntityTemplate.properties.properties[key];

            if (!newProperty) return true; // if property deleted

            const isCurrentPropertyWithToString = isPropertyWithToString(value);
            const isNewPropertyWithToString = isPropertyWithToString(newProperty);

            return isCurrentPropertyWithToString !== isNewPropertyWithToString;
        });

        if (isPropertyTypeChanged) {
            await this.globalSearchIndexCreator.sendUpdateIndexesOnUpdateTemplate(id);
        }

        const isNewPropertyAdded =
            Object.keys(currentEntityTemplate.properties.properties).length !== Object.keys(newEntityTemplate.properties.properties).length;

        if (isNewPropertyAdded) {
            await this.globalSearchIndexCreator.sendUpdateIndexesOnUpdateTemplate(id);
        }

        return newEntityTemplate;
    }

    async updateEntityTemplateStatus(id: string, disabledStatus: boolean) {
        return this.model
            .findByIdAndUpdate(id, { disabled: disabledStatus }, { new: true })
            .populate('category')
            .orFail(new ServiceError(404, 'Entity Template not found'))
            .lean()
            .exec();
    }
}

export default EntityTemplateManager;
