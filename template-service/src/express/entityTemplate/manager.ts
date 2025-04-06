import { ClientSession, FilterQuery } from 'mongoose';
import config from '../../config';
import { escapeRegExp } from '../../utils';

import { DefaultManagerMongo } from '../../utils/mongo/manager';
import { withTransaction } from '../../utils/mongoose';
import { NotFoundError } from '../error';
import GlobalSearchIndexCreator from '../externalServices/globalSearchIndexCreator';
import { IRelationshipTemplate } from '../relationshipTemplate/interface';
import RelationshipTemplateManager from '../relationshipTemplate/manager';
import { IEntitySingleProperty, IEntityTemplate, IEntityTemplatePopulated, IMongoEntityTemplate } from './interface';
import { EntityTemplateSchema } from './model';

export class EntityTemplateManager extends DefaultManagerMongo<IMongoEntityTemplate> {
    private globalSearchIndexCreator: GlobalSearchIndexCreator;

    private relationshipTemplateManager: RelationshipTemplateManager;

    constructor(workspaceId: string) {
        super(workspaceId, config.mongo.entityTemplatesCollectionName, EntityTemplateSchema);
        this.globalSearchIndexCreator = new GlobalSearchIndexCreator(workspaceId);
        this.relationshipTemplateManager = new RelationshipTemplateManager(workspaceId);
    }

    getTemplates(searchQuery: { search?: string; ids?: string[]; categoryIds?: string[]; limit: number; skip: number }) {
        const { search: displayName, ids, categoryIds, limit, skip } = searchQuery;
        const query: FilterQuery<IEntityTemplate> = {};

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

    getTemplatesByFormat(searchQuery: { format: string }) {
        const { format } = searchQuery;
        const query: FilterQuery<IEntityTemplate> = {
            $expr: {
              $gt: [
                {
                  $size: {
                    $filter: {
                      input: {
                        $objectToArray:
                          "$properties.properties"
                      },
                      as: "item",
                      cond: {
                        $eq: [
                          "$$item.v.format",
                          format
                        ]
                      }
                    }
                  }
                },
                0
              ]
            }
        };

        return this.model.find(query).lean().exec();
    }

    getAllTemplates() {
        return this.model.find().lean().exec();
    }

    getTemplateById(id: string): Promise<IEntityTemplatePopulated> {
        return this.model
            .findById(id)
            .populate<Pick<IEntityTemplatePopulated, 'category'>>('category')
            .orFail(new NotFoundError('Entity Template not found'))
            .lean()
            .exec();
    }

    getTemplatesByCategory(category: string) {
        return this.model.find({ category }).lean().exec();
    }

    hasRelationshipsProperties(entityTemplate: Omit<IEntityTemplate, 'disabled'>) {
        return Object.values(entityTemplate.properties.properties).some((property) => property.relationshipReference);
    }

    async upsertRelationshipsProperties(entityTemplate: IMongoEntityTemplate, session?: ClientSession, isEditMode?: boolean) {
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

                    if (isEditMode && relationshipTemplateId) {
                        await this.relationshipTemplateManager.updateTemplateById(relationshipTemplateId, relationshipTemplateToUpsert, session);
                    } else {
                        const upsertedRelationshipTemplate = await this.relationshipTemplateManager.createTemplate(
                            relationshipTemplateToUpsert,
                            session,
                        );

                        // eslint-disable-next-line no-param-reassign
                        fixedEntityTemplate.properties.properties[propertyName].relationshipReference!.relationshipTemplateId =
                            upsertedRelationshipTemplate._id.toString();
                    }
                }
            }),
        );

        return fixedEntityTemplate;
    }

    async createTemplate(templateData: Omit<IEntityTemplate, 'disabled'>) {
        let entityTemplate: IEntityTemplatePopulated | null = null;

        if (this.hasRelationshipsProperties(templateData)) {
            entityTemplate = await withTransaction(async (session: ClientSession) => {
                const [newEntityTemplate] = await this.model.create([this.convertExpendedUserFields(templateData)], { session });

                const fixedEntityTemplate = await this.upsertRelationshipsProperties(newEntityTemplate, session);

                return this.model
                    .findByIdAndUpdate(fixedEntityTemplate._id, fixedEntityTemplate, {
                        new: true,
                        overwrite: true,
                        session,
                    })
                    .populate<Pick<IEntityTemplatePopulated, 'category'>>('category')
                    .orFail(new NotFoundError('Entity Template not found'))
                    .lean()
                    .exec();
            });
        } else {
            const createdEntityTemplate = await this.model.create(this.convertExpendedUserFields(templateData));
            entityTemplate = await createdEntityTemplate.populate<Pick<IEntityTemplatePopulated, 'category'>>('category');
        }

        await this.globalSearchIndexCreator.sendUpdateIndexesOnUpdateTemplate(entityTemplate!._id);

        return entityTemplate;
    }

    async deleteTemplate(id: string) {
        const entityTemplate = await withTransaction(async (session: ClientSession) => {
            const deletedEntityTemplate: IMongoEntityTemplate = await this.model
                .findByIdAndDelete(id, { session })
                .orFail(new NotFoundError('Entity Template not found'))
                .lean()
                .exec();

            await Promise.all(
                Object.values(deletedEntityTemplate.properties.properties).map(async (property) => {
                    if (property.relationshipReference) {
                        await this.relationshipTemplateManager.deleteTemplateById(property.relationshipReference.relationshipTemplateId!, session);
                    }
                }),
            );
        });

        await this.globalSearchIndexCreator.sendUpdateIndexesOnDeleteTemplate(id);

        return entityTemplate;
    }

    async getTemplatesUsingRelationshipReference(relatedTemplateId: string) {
        return this.model
            .aggregate([
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
            ])
            .exec();
    }

    async updateEntityTemplateInTransaction(
        id: string,
        currentEntityTemplate: IEntityTemplatePopulated,
        updatedTemplateData: Omit<IEntityTemplate, 'disabled'>,
        allowToDeleteRelationshipFields: boolean,
        session?: ClientSession,
    ) {
        let entityTemplateToUpdate = { ...currentEntityTemplate, ...updatedTemplateData };

        if (this.hasRelationshipsProperties(entityTemplateToUpdate)) {
            entityTemplateToUpdate = await this.upsertRelationshipsProperties(entityTemplateToUpdate, session, true);
        }

        const updatedEntityTemplate = await this.model
            .findByIdAndUpdate(id, entityTemplateToUpdate, {
                new: true,
                overwrite: true,
                session,
            })
            .populate('category')
            .orFail(new NotFoundError('Entity Template not found'))
            .lean()
            .exec();

        if (allowToDeleteRelationshipFields) {
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

            await this.relationshipTemplateManager.deleteManyTemplatesByIds(relationshipTemplateIdsToDelete, session);
        }

        return updatedEntityTemplate;
    }

    convertExpendedUserFields(templateData: Omit<IEntityTemplate, 'disabled'>): Omit<IEntityTemplate, 'disabled'> {
        const convertedProperties = templateData.properties.properties;
        const updatedPropertiesOrder = templateData.propertiesOrder;
        // Object.entries(templateData.properties.properties).forEach(([key, value]) => {
        //     if(value.expandedUserFields) {
        //         const { expandedUserFields, ...restOfTheValue } = value;
        //         convertedProperties[key] = restOfTheValue;

        //         const indexOfKeyInOrder = updatedPropertiesOrder.findIndex((el)=> el === key);

        //         expandedUserFields.forEach((userFieldToAdd, index) => {
        //             convertedProperties[`userprefix_${key}_${userFieldToAdd}`] = {
        //                 title: `${value.title}_${userFieldToAdd}`,
        //                 type: 'string',
        //                 readOnly: true,
        //             };

        //             updatedPropertiesOrder.splice(indexOfKeyInOrder + index + 1, 0, `userprefix_${key}_${userFieldToAdd}`);
        //         });
        //     }
        // });

        return {
            ...templateData,
            properties: {
                ...templateData.properties,
                properties: convertedProperties
            },
            propertiesOrder: updatedPropertiesOrder,
        }
    }

    async updateEntityTemplate(
        id: string,
        updatedTemplateData: Omit<IEntityTemplate, 'disabled'>,
        allowToDeleteRelationshipFields: boolean,
        session?: ClientSession,
    ) {
        const currentEntityTemplate = await this.getTemplateById(id);

        const convertedTemplateDataToUpdate = this.convertExpendedUserFields(updatedTemplateData);

        const newEntityTemplate = session
            ? await this.updateEntityTemplateInTransaction(id, currentEntityTemplate, convertedTemplateDataToUpdate, allowToDeleteRelationshipFields, session)
            : await withTransaction(async (newSession: ClientSession) =>
                  this.updateEntityTemplateInTransaction(id, currentEntityTemplate, convertedTemplateDataToUpdate, allowToDeleteRelationshipFields, newSession),
              );

        const propertyTypeWithToString = ['number', 'boolean', 'date', 'date-time'];
        const isPropertyWithToString = (property: IEntitySingleProperty) => {
            return propertyTypeWithToString.includes(property.type) || propertyTypeWithToString.includes(property.format!);
        };

        const isPropertyTypeChanged = Object.entries(currentEntityTemplate.properties.properties).some(([key, value]) => {
            const newProperty = newEntityTemplate?.properties.properties[key];

            if (!newProperty) return true; // if property deleted

            const isCurrentPropertyWithToString = isPropertyWithToString(value);
            const isNewPropertyWithToString = isPropertyWithToString(newProperty);

            return isCurrentPropertyWithToString !== isNewPropertyWithToString;
        });

        const isNewPropertyAdded =
            Object.keys(currentEntityTemplate.properties.properties).length !== Object.keys(newEntityTemplate?.properties.properties).length;

        if (isPropertyTypeChanged || isNewPropertyAdded) {
            await this.globalSearchIndexCreator.sendUpdateIndexesOnUpdateTemplate(id);

            const relatedTemplates = await this.getTemplatesUsingRelationshipReference(id);
            await Promise.all(
                relatedTemplates.map(async (relatedTemplate) => {
                    await this.globalSearchIndexCreator.sendUpdateIndexesOnUpdateTemplate(relatedTemplate._id);
                }),
            );
        }

        return newEntityTemplate;
    }

    async updateEntityTemplateStatus(id: string, disabledStatus: boolean) {
        return this.model
            .findByIdAndUpdate(id, { disabled: disabledStatus }, { new: true })
            .populate('category')
            .orFail(new NotFoundError('Entity Template not found'))
            .lean()
            .exec();
    }

    async convertToRelationshipField(
        templateId: string,
        relationshipTemplateId: string,
        updatedEntityTemplateData: Omit<IEntityTemplate, 'disabled'>,
    ) {
        return withTransaction(async (session: ClientSession) => {
            const updatedEntityTemplate = await this.updateEntityTemplate(templateId, updatedEntityTemplateData, true, session);

            const updatedRelationShipTemplate = await this.relationshipTemplateManager.updateTemplateById(
                relationshipTemplateId,
                { isProperty: true },
                session,
            );
            return { updatedRelationShipTemplate, updatedEntityTemplate };
        });
    }

    async updateEntityTemplateAction(id: string, actions: string) {
        return this.model
            .findByIdAndUpdate(id, { actions }, { new: true })
            .populate('category')
            .orFail(new NotFoundError('Entity Template not found'))
            .lean()
            .exec();
    }
}

export default EntityTemplateManager;
