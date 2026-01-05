
import { IMongoCategory } from '@packages/category';
import { IEntitySingleProperty, IEntityTemplate, IEntityTemplatePopulated, IMongoEntityTemplate } from '@packages/entity-template';
import { IRelationshipTemplate } from '@packages/relationship-template';
import { DefaultManagerMongo } from '@packages/utils';
import { NotFoundError } from '@packages/utils';
import { ClientSession, FilterQuery } from 'mongoose';
import config from '../../config';
import { escapeRegExp } from '../../utils';
import { withTransaction } from '../../utils/mongoose';
import CategoryManager from '../category/manager';
import ChildTemplateManager from '../childTemplate/manager';
import GlobalSearchIndexCreator from '../externalServices/globalSearchIndexCreator';
import RelationshipTemplateManager from '../relationshipTemplate/manager';
import EntityTemplateSchema from './model';

export class EntityTemplateManager extends DefaultManagerMongo<IMongoEntityTemplate> {
    private globalSearchIndexCreator: GlobalSearchIndexCreator;

    private relationshipTemplateManager: RelationshipTemplateManager;

    private categoryManager: CategoryManager;

    private childTemplateManager: ChildTemplateManager;

    constructor(workspaceId: string) {
        super(workspaceId, config.mongo.entityTemplatesCollectionName, EntityTemplateSchema);
        this.globalSearchIndexCreator = new GlobalSearchIndexCreator(workspaceId);
        this.relationshipTemplateManager = new RelationshipTemplateManager(workspaceId);
        this.categoryManager = new CategoryManager(workspaceId);
        this.childTemplateManager = new ChildTemplateManager(workspaceId);
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

        return this.model
            .find(query)
            .populate<Pick<IEntityTemplatePopulated, 'category'>>('category')
            .limit(limit)
            .skip(skip)
            .lean()
            .exec() as Promise<IEntityTemplatePopulated[]>;
    }

    getTemplatesByFormat({ format }: { format: string }) {
        const query: FilterQuery<IEntityTemplate> = {
            $expr: {
                $gt: [
                    {
                        $size: {
                            $filter: {
                                input: {
                                    $objectToArray: '$properties.properties',
                                },
                                as: 'item',
                                cond: {
                                    $eq: ['$$item.v.format', format],
                                },
                            },
                        },
                    },
                    0,
                ],
            },
        };

        return this.model.find(query).lean().exec();
    }

    getAllTemplates() {
        return this.model.find().lean().exec();
    }

    async getTemplateById(id: string): Promise<IEntityTemplatePopulated> {
        const targetTemplate: IEntityTemplatePopulated = (await this.model
            .findById<IEntityTemplatePopulated>(id)
            .populate<Pick<IEntityTemplatePopulated, 'category'>>('category')
            .orFail(new NotFoundError('Entity Template not found'))
            .lean()
            .exec()) as IEntityTemplatePopulated;

        Object.entries(targetTemplate.properties.properties).forEach(([_name, value]) => {
            if (value.relationshipReference?.filters && typeof value.relationshipReference.filters === 'string') {
                // eslint-disable-next-line no-param-reassign
                value.relationshipReference.filters = JSON.parse(value.relationshipReference.filters);
            }
        });

        return targetTemplate;
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
        Object.entries(templateData.properties.properties).forEach(([_name, value]) => {
            if (value.relationshipReference?.filters && typeof value.relationshipReference.filters === 'object') {
                // eslint-disable-next-line no-param-reassign
                value.relationshipReference.filters = JSON.stringify(value.relationshipReference.filters);
            }
        });

        let entityTemplate: IEntityTemplatePopulated | null = null;

        if (this.hasRelationshipsProperties(templateData)) {
            entityTemplate = await withTransaction(async (session: ClientSession) => {
                const [newEntityTemplate] = await this.model.create([templateData], { session });

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
                    .exec() as Promise<IEntityTemplatePopulated>;
            });
        } else {
            const createdEntityTemplate = await this.model.create(templateData);
            entityTemplate = await createdEntityTemplate.populate<Pick<IEntityTemplatePopulated, 'category'>>('category');
        }

        const { templatesOrder } = entityTemplate.category;
        templatesOrder.push(entityTemplate._id.toString());
        await this.categoryManager.updateCategory(entityTemplate.category._id, { templatesOrder });

        await this.globalSearchIndexCreator.sendUpdateIndexesOnUpdateTemplate(entityTemplate!._id);

        return entityTemplate;
    }

    async deleteTemplate(id: string) {
        const entityTemplate = await withTransaction(async (session: ClientSession) => {
            const deletedEntityTemplate: IMongoEntityTemplate = (await this.model
                .findByIdAndDelete(id, { session })
                .orFail(new NotFoundError('Entity Template not found'))
                .lean()
                .exec()) as IMongoEntityTemplate;

            await Promise.all(
                Object.values(deletedEntityTemplate.properties.properties).map(async (property) => {
                    if (property.relationshipReference) {
                        await this.relationshipTemplateManager.deleteTemplateById(property.relationshipReference.relationshipTemplateId!, session);
                    }
                }),
            );

            const category: IMongoCategory = await this.categoryManager.getCategoryById(deletedEntityTemplate.category);
            const index: number = category.templatesOrder.indexOf(id);

            if (index !== -1) {
                category.templatesOrder.splice(index, 1);
            }

            await this.categoryManager.updateCategory(category._id, { templatesOrder: category.templatesOrder });
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

        if (currentEntityTemplate.displayName !== updatedEntityTemplate.displayName) {
            await this.childTemplateManager.updateChildrenDisplayNames(
                updatedEntityTemplate._id,
                currentEntityTemplate.displayName,
                updatedEntityTemplate.displayName,
            );
        }

        return updatedEntityTemplate;
    }

    async updateEntityTemplate(
        id: string,
        updatedTemplateData: Omit<IEntityTemplate, 'disabled'>,
        allowToDeleteRelationshipFields: boolean,
        session?: ClientSession,
    ) {
        Object.entries(updatedTemplateData.properties.properties).forEach(([_name, value]) => {
            if (value.relationshipReference?.filters && typeof value.relationshipReference.filters === 'object') {
                // eslint-disable-next-line no-param-reassign
                value.relationshipReference.filters = JSON.stringify(value.relationshipReference.filters);
            }
        });

        const currentEntityTemplate = await this.getTemplateById(id);

        const newEntityTemplate = session
            ? await this.updateEntityTemplateInTransaction(id, currentEntityTemplate, updatedTemplateData, allowToDeleteRelationshipFields, session)
            : await withTransaction(async (newSession: ClientSession) =>
                  this.updateEntityTemplateInTransaction(id, currentEntityTemplate, updatedTemplateData, allowToDeleteRelationshipFields, newSession),
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

    async updateEntityTemplateCategory(tempId: string, categoryId: string) {
        return this.model
            .findByIdAndUpdate(tempId, { category: categoryId }, { new: true })
            .orFail(new NotFoundError('Entity Template not found'))
            .lean()
            .exec();
    }
}

export default EntityTemplateManager;
