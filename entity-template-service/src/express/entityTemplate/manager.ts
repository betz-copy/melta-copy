import { FilterQuery, Document } from 'mongoose';
import menash from 'menashmq';
import EntityTemplateModel from './model';
import { IEntitySingleProperty, IEntityTemplate } from './interface';
import { ServiceError } from '../error';
import { escapeRegExp } from '../../utils';
import config from '../../config';

const { rabbit } = config;
export class EntityTemplateManager {
    static getTemplates(searchQuery: { search?: string; ids?: string[]; categoryIds?: string[]; limit: number; skip: number }) {
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

        return EntityTemplateModel.find(query).populate('category').limit(limit).skip(skip).lean().exec();
    }

    static getTemplateById(id: string) {
        return EntityTemplateModel.findById(id).populate('category').orFail(new ServiceError(404, 'Entity Template not found')).lean().exec();
    }

    static getTemplatesByCategory(category: string) {
        return EntityTemplateModel.find({ category }).lean().exec();
    }

    static async createTemplate(templateData: Omit<IEntityTemplate, 'iconFileId'>) {
        const entityTemplate = await EntityTemplateModel.create(templateData);

        await menash.send(rabbit.queueName, 'New Template Created.');

        const entityTemplatePopulated = await entityTemplate.populate('category').execPopulate();

        return entityTemplatePopulated;
    }

    static async deleteTemplate(id: string) {
        const entityTemplate = await EntityTemplateModel.findByIdAndDelete(id)
            .orFail(new ServiceError(404, 'Entity Template not found'))
            .lean()
            .exec();

        await menash.send(rabbit.queueName, 'Template Deleted.');

        return entityTemplate;
    }

    static async updateEntityTemplate(id: string, updatedTemplate: Omit<IEntityTemplate, 'disabled'>) {
        const currentEntityTemplate = await EntityTemplateManager.getTemplateById(id);

        const newEntityTemplate = await EntityTemplateModel.findByIdAndUpdate(id, updatedTemplate, { new: true, overwrite: true })
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

        if (isPropertyTypeChanged) await menash.send(rabbit.queueName, 'Template Updated.');

        const isNewPropertyAdded =
            Object.keys(currentEntityTemplate.properties.properties).length !== Object.keys(newEntityTemplate.properties.properties).length;

        if (isNewPropertyAdded) await menash.send(rabbit.queueName, 'Template Updated.');

        return newEntityTemplate;
    }

    static async updateEntityTemplateStatus(id: string, disabledStatus: boolean) {
        return EntityTemplateModel.findByIdAndUpdate(id, { disabled: disabledStatus }, { new: true })
            .populate('category')
            .orFail(new ServiceError(404, 'Entity Template not found'))
            .lean()
            .exec();
    }
}

export default EntityTemplateManager;
