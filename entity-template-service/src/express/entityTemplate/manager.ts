import { FilterQuery, Document } from 'mongoose';
import menash from 'menashmq';
import EntityTemplateModel from './model';
import { IEntityTemplate } from './interface';
import { ServiceError } from '../error';
import { escapeRegExp } from '../../utils';
import { uploadFile, deleteFile } from '../../utils/storageService';
import { searchRelationshipTemplates } from '../../relationshipTemplateManager';
import CategoryManager from '../category/manager';
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

    static async createTemplate(templateData: Omit<IEntityTemplate, 'iconFileId'>, file?: Express.Multer.File) {
        await CategoryManager.getCategoryById(templateData.category);

        if (file) {
            const newFile = await uploadFile(file);

            const entityTemplate = await EntityTemplateModel.create({ ...templateData, iconFileId: newFile.data.path });
            await menash.send(rabbit.queueName, 'New Template Created.');

            return entityTemplate;
        }
        const entityTemplate = await EntityTemplateModel.create({ ...templateData, iconFileId: null });
        await menash.send(rabbit.queueName, 'New Template Created.');
        return entityTemplate;
    }

    static async throwIfEntityHasRelationships(id: string) {
        const outgoingRelationships = await searchRelationshipTemplates({ sourceEntityIds: [id] });
        if (outgoingRelationships.length > 0) {
            throw new ServiceError(403, 'entity template still has outgoing relationships');
        }
        const incomingRelationships = await searchRelationshipTemplates({ destinationEntityIds: [id] });
        if (incomingRelationships.length > 0) {
            throw new ServiceError(403, 'entity template still has incoming relationships');
        }
    }

    static async deleteTemplate(id: string) {
        await EntityTemplateManager.throwIfEntityHasRelationships(id);

        const { iconFileId } = await EntityTemplateManager.getTemplateById(id);
        if (iconFileId) {
            await deleteFile(iconFileId);
        }

        const entityTemplate = await EntityTemplateModel.findByIdAndDelete(id)
            .orFail(new ServiceError(404, 'Entity Template not found'))
            .lean()
            .exec();

        await menash.send(rabbit.queueName, 'Template Deleted.');
        return entityTemplate;
    }

    static async updateEntityTemplate(
        id: string,
        updatedTemplate: Partial<Omit<IEntityTemplate, 'iconFileId'>> & { file?: string },
        file?: Express.Multer.File,
    ) {
        if (updatedTemplate.category) {
            await CategoryManager.getCategoryById(updatedTemplate.category);
        }

        const { file: templateFile } = updatedTemplate;

        if (file || templateFile === null) {
            const template = await EntityTemplateManager.getTemplateById(id);

            if (template.iconFileId !== null) {
                await deleteFile(template.iconFileId);
            }

            let iconFileId = null;
            if (file) {
                const newFile = await uploadFile(file);
                iconFileId = newFile.data.path;
            }

            const entityTemplate = await EntityTemplateModel.findByIdAndUpdate(id, { ...updatedTemplate, iconFileId }, { new: true })
                .populate('category')
                .orFail(new ServiceError(404, 'Entity Template not found'))
                .lean()
                .exec();

            await menash.send(rabbit.queueName, 'Template Updated.');
            return entityTemplate;
        }
        const entityTemplate = await EntityTemplateModel.findByIdAndUpdate(id, updatedTemplate, { new: true })
            .populate('category')
            .orFail(new ServiceError(404, 'Entity Template not found'))
            .lean()
            .exec();
        await menash.send(rabbit.queueName, 'Template Updated.');
        return entityTemplate;
    }
}

export default EntityTemplateManager;
