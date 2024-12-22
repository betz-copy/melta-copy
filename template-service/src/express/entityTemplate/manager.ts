import { ClientSession, FilterQuery } from 'mongoose';
import { parse as parsePath } from 'node:path/posix';
import config from '../../config';
import { escapeRegExp } from '../../utils';

import { DefaultManagerMongo } from '../../utils/mongo/manager';
import { withTransaction } from '../../utils/mongoose';
import { NotFoundError, PathDoesNotExistError } from '../error';
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
                    .exec();
            });
        } else {
            const createdEntityTemplate = await this.model.create(templateData);
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

    async getTemplatesUsingRelationshipReferance(relatedTemplateId: string) {
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

    async updateEntityTemplate(id: string, updatedTemplateData: Omit<IEntityTemplate, 'disabled'>) {
        const currentEntityTemplate = await this.getTemplateById(id);

        const newEntityTemplate = await withTransaction(async (session: ClientSession) => {
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
            await this.globalSearchIndexCreator.sendUpdateIndexesOnUpdateTemplate(id);

            const relatedTemplates = await this.getTemplatesUsingRelationshipReferance(id);
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

    async updateEntityTemplatePath(id: string, path: string) {
        return this.model
            .findByIdAndUpdate(id, { path }, { new: true })
            .populate('category')
            .orFail(new NotFoundError('Entity Template not found'))
            .lean()
            .exec();
    }

    async getTemplateByPath(path: string) {
        const { dir, name } = parsePath(path);

        return this.model.findOne({ path: dir, name }).orFail(new PathDoesNotExistError(path)).lean().exec();
    }

    getRootTemplateByCategory(categoryId: string) {
        return this.model.findOne({ path: '/', category: categoryId }).lean().exec();
    }

    async getSubTemplatesTree(categoryId: string) {
        const templatesWithPath = await this.model
            .find({ path: { $ne: null }, category: categoryId })
            .populate<Pick<IEntityTemplatePopulated, 'category'>>('category')
            .lean()
            .exec();
        const rootTemplate = templatesWithPath.find((template) => template.path === '/');

        if (!templatesWithPath?.length || !rootTemplate) return [];
        console.log(0);
        console.log(templatesWithPath);

        templatesWithPath.sort((a, b) => a.path!.split('/').length - b.path!.split('/').length).pop();

        console.log(1);
        console.log(templatesWithPath);
        type IEntityTemplatePopulatedWithChildren = IEntityTemplatePopulated & { children: IEntityTemplatePopulatedWithChildren[] };

        const result = {
            ...rootTemplate,
            children: [] as IEntityTemplatePopulatedWithChildren[],
        };

        templatesWithPath.forEach((child) => {
            const { path } = child;

            const levels = path!.substring(path!.indexOf(rootTemplate.name) + rootTemplate.name.length + 1).split('/');
            const { length: levelsLength } = levels;
            let reference = result.children;
            levels.forEach((level, index) => {
                const isLastLevel = levelsLength - index === 1;
                if (isLastLevel && level === '') {
                    reference.push({ ...child, children: [] });
                } else {
                    const childRef = reference.find((subChild) => subChild.name === level);
                    if (!childRef) {
                        throw new PathDoesNotExistError(level);
                    }
                    childRef.children ??= [];
                    if (isLastLevel) {
                        childRef.children.push({ ...child, children: [] });
                    } else {
                        reference = childRef.children;
                    }
                }
            });
        });

        return result;
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
