import { FilterQuery, Document, ClientSession } from 'mongoose';

import EntityTemplateModel from './model';
import { IEntitySingleProperty, IEntityTemplate, IEntityTemplatePopulated, IMongoEntityTemplate } from './interface';
import { ServiceError } from '../error';
import { escapeRegExp } from '../../utils';
import { sendUpdateIndexesOnUpdateTemplate, sendUpdateIndexesOnDeleteTemplate } from '../externalServices/globalSearchIndexCreator';
import { withTransaction } from '../../utils/mongoose';
import RelationshipTemplateManager from '../relationshipTemplate/manager';
import { IRelationshipTemplate } from '../relationshipTemplate/interface';

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

    static getTemplateById(id: string): Promise<IEntityTemplatePopulated> {
        return EntityTemplateModel.findById(id)
            .populate<Pick<IEntityTemplatePopulated, 'category'>>('category')
            .orFail(new ServiceError(404, 'Entity Template not found'))
            .lean()
            .exec();
    }

    static getTemplatesByCategory(category: string) {
        return EntityTemplateModel.find({ category }).lean().exec();
    }

    static hasRelationshipsProperties(entityTemplate: Omit<IEntityTemplate, 'disabled'>) {
        return Object.values(entityTemplate.properties.properties).some((property) => property.relationshipReference);
    }

    static async upsertRelationshipsProperties(entityTemplate: IMongoEntityTemplate, session?: ClientSession) {
        const fixedEntityTemplate: IMongoEntityTemplate = JSON.parse(JSON.stringify(entityTemplate));

        await Promise.all(
            Object.entries(fixedEntityTemplate.properties.properties).map(async ([propertyName, propertyTemplate]) => {
                if (propertyTemplate.format === 'relationshipReference' && propertyTemplate.relationshipReference) {
                    const {
                        relationshipTemplateDirection: relationshipDirection,
                        relatedTemplateId,
                        relationshipTemplateId,
                    } = propertyTemplate.relationshipReference;

                    const relationshipTemplateToUpsert: IRelationshipTemplate = {
                        sourceEntityId: relationshipDirection === 'outgoing' ? fixedEntityTemplate._id : relatedTemplateId,
                        destinationEntityId: relationshipDirection === 'outgoing' ? relatedTemplateId : fixedEntityTemplate._id,
                        name: propertyName,
                        displayName: propertyTemplate.title,
                        isProperty: true,
                    };

                    if (relationshipTemplateId) {
                        await RelationshipTemplateManager.updateTemplateById(relationshipTemplateId, relationshipTemplateToUpsert, session);
                    } else {
                        const upsertedRelationshipTemplate = await RelationshipTemplateManager.createTemplate(relationshipTemplateToUpsert, session);

                        // eslint-disable-next-line no-param-reassign
                        fixedEntityTemplate.properties.properties[propertyName].relationshipReference!.relationshipTemplateId =
                            upsertedRelationshipTemplate._id.toString();
                    }
                }
            }),
        );

        return fixedEntityTemplate;
    }

    static async createTemplate(templateData: Omit<IEntityTemplate, 'disabled'>) {
        let entityTemplate: IEntityTemplatePopulated | null = null;

        if (this.hasRelationshipsProperties(templateData)) {
            entityTemplate = await withTransaction(async (session: ClientSession) => {
                const [newEntityTemplate] = await EntityTemplateModel.create([templateData], { session });

                const fixedEntityTemplate = await this.upsertRelationshipsProperties(newEntityTemplate, session);

                return EntityTemplateModel.findByIdAndUpdate(fixedEntityTemplate._id, fixedEntityTemplate, {
                    new: true,
                    overwrite: true,
                    session,
                })
                    .populate<Pick<IEntityTemplatePopulated, 'category'>>('category')
                    .orFail(new ServiceError(404, 'Entity Template not found'))
                    .lean()
                    .exec();
            });
        } else {
            const createdEntityTemplate = await EntityTemplateModel.create(templateData);
            entityTemplate = await createdEntityTemplate.populate<Pick<IEntityTemplatePopulated, 'category'>>('category');
        }

        await sendUpdateIndexesOnUpdateTemplate(entityTemplate._id);

        return entityTemplate;
    }

    static async deleteTemplate(id: string) {
        const entityTemplate = await withTransaction(async (session: ClientSession) => {
            const deletedEntityTemplate = await EntityTemplateModel.findByIdAndDelete(id, { session })
                .orFail(new ServiceError(404, 'Entity Template not found'))
                .lean()
                .exec();

            await Promise.all(
                Object.values(deletedEntityTemplate.properties.properties).map(async (property) => {
                    if (property.relationshipReference) {
                        await RelationshipTemplateManager.deleteTemplateById(property.relationshipReference.relationshipTemplateId!, session);
                    }
                }),
            );
        });

        await sendUpdateIndexesOnDeleteTemplate(id);

        return entityTemplate;
    }

    static async getTemplatesUsingRelationshipReferance(relatedTemplateId: string) {
        return EntityTemplateModel.aggregate([
            {
                $addFields: {
                    propertiesArray: {
                        $objectToArray: '$properties.properties',
                    },
                },
            },
            {
                $match: {
                    'propertiesArray.v.relationshipReference.relatedTemplateId': relatedTemplateId,
                    'propertiesArray.v.format': 'relationshipReference',
                },
            },
            {
                $project: {
                    propertiesArray: 0,
                },
            },
        ]).exec();
    }

    static async updateEntityTemplate(id: string, updatedTemplateData: Omit<IEntityTemplate, 'disabled'>) {
        const currentEntityTemplate = await EntityTemplateManager.getTemplateById(id);

        const newEntityTemplate = await withTransaction(async (session: ClientSession) => {
            let entityTemplateToUpdate = { ...currentEntityTemplate, ...updatedTemplateData };

            if (this.hasRelationshipsProperties(entityTemplateToUpdate)) {
                entityTemplateToUpdate = await this.upsertRelationshipsProperties(entityTemplateToUpdate, session);
            }

            const updatedEntityTemplate = await EntityTemplateModel.findByIdAndUpdate(id, entityTemplateToUpdate, {
                new: true,
                overwrite: true,
                session,
            })
                .populate('category')
                .orFail(new ServiceError(404, 'Entity Template not found'))
                .lean()
                .exec();

            const relationshipTemplateIdsToDelete = Object.values(currentEntityTemplate.properties.properties)
                .filter(
                    (property) =>
                        property.relationshipReference?.relationshipTemplateId &&
                        Object.values(entityTemplateToUpdate.properties.properties).every(
                            (updatedProperty) =>
                                updatedProperty.relationshipReference?.relationshipTemplateId !==
                                property.relationshipReference!.relationshipTemplateId!,
                        ),
                )
                .map((property) => property.relationshipReference!.relationshipTemplateId!);
            await RelationshipTemplateManager.deleteManyTemplatesByIds(relationshipTemplateIdsToDelete, session);

            return updatedEntityTemplate;
        });

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

        const isNewPropertyAdded =
            Object.keys(currentEntityTemplate.properties.properties).length !== Object.keys(newEntityTemplate.properties.properties).length;

        if (isPropertyTypeChanged || isNewPropertyAdded) {
            await sendUpdateIndexesOnUpdateTemplate(id);

            const relatedTemplates = await EntityTemplateManager.getTemplatesUsingRelationshipReferance(id);
            await Promise.all(
                relatedTemplates.map(async (relatedTemplate) => {
                    await sendUpdateIndexesOnUpdateTemplate(relatedTemplate._id);
                }),
            );
        }

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
