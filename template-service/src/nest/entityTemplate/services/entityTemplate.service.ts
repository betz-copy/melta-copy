import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ClsService, DefaultMongoService, MongoModelFactory } from '@packages/utils';
import { Connection, FilterQuery, Types } from 'mongoose';
import config from '../../../config';
import { CreateEntityTemplateDto, SearchEntityTemplateDto, UpdateEntityTemplateDto } from '../dto/entityTemplate.dto';
import { EntityTemplate, EntityTemplateSchema } from '../schemas/entityTemplate.schema';
import { CategoryService } from '../../category/services/category.service';
import { RelationshipTemplateService } from '../../relationshipTemplate/services/relationshipTemplate.service';

@Injectable()
export class EntityTemplateService extends DefaultMongoService<EntityTemplate> {
    constructor(
        @InjectConnection() connection: Connection,
        cls: ClsService,
        mongoModelFactory: MongoModelFactory,
        private readonly categoryService: CategoryService,
        private readonly relationshipTemplateService: RelationshipTemplateService,
    ) {
        super(connection, cls, config.mongo.entityTemplatesCollectionName, EntityTemplateSchema, mongoModelFactory, EntityTemplate.name);
    }

    async searchTemplates(searchQuery: SearchEntityTemplateDto): Promise<EntityTemplate[]> {
        const { search, ids, categoryIds, limit, skip } = searchQuery;
        const query: FilterQuery<EntityTemplate> = {};

        if (search) {
            query.displayName = { $regex: search, $options: 'i' };
        }

        if (ids && ids.length > 0) {
            query._id = { $in: ids.map((id) => new Types.ObjectId(id)) };
        }

        if (categoryIds && categoryIds.length > 0) {
            query.category = { $in: categoryIds.map((id) => new Types.ObjectId(id)) };
        }

        return this.model.find(query).populate('category').limit(limit).skip(skip).lean<EntityTemplate[]>().exec();
    }

    async getTemplatesByFormat(format: string): Promise<EntityTemplate[]> {
        const query: FilterQuery<EntityTemplate> = {
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

        return this.model.find(query).lean<EntityTemplate[]>().exec();
    }

    async getAllTemplates(): Promise<EntityTemplate[]> {
        return this.model.find().lean<EntityTemplate[]>().exec();
    }

    async getTemplateById(id: string): Promise<EntityTemplate> {
        const template = await this.model.findById(id).populate('category').lean<EntityTemplate>().exec();

        if (!template) {
            throw new NotFoundException(`Entity Template with ID ${id} not found`);
        }

        // Parse relationship references filters if they are strings
        Object.entries(template.properties?.properties || {}).forEach(([_, value]: [string, any]) => {
            if (value.relationshipReference?.filters && typeof value.relationshipReference.filters === 'string') {
                try {
                    value.relationshipReference.filters = JSON.parse(value.relationshipReference.filters);
                } catch {
                    // Keep as string if parsing fails
                }
            }
        });

        return template;
    }

    async getTemplatesByCategory(categoryId: string): Promise<EntityTemplate[]> {
        return this.model
            .find({ category: new Types.ObjectId(categoryId) })
            .lean<EntityTemplate[]>()
            .exec();
    }

    async getTemplatesUsingRelationshipReference(relatedTemplateId: string): Promise<EntityTemplate[]> {
        return this.model
            .find({
                $or: [
                    { 'properties.properties.relationshipReference.relatedTemplateId': relatedTemplateId },
                    { 'properties.properties.relationshipReference.relationshipTemplateId': relatedTemplateId },
                ],
            })
            .lean<EntityTemplate[]>()
            .exec();
    }

    async createTemplate(templateData: CreateEntityTemplateDto): Promise<EntityTemplate> {
        // Prepare property filters
        Object.entries(templateData.properties?.properties || {}).forEach(([_, value]: [string, any]) => {
            if (value.relationshipReference?.filters && typeof value.relationshipReference.filters === 'object') {
                value.relationshipReference.filters = JSON.stringify(value.relationshipReference.filters);
            }
        });

        const template = await this.model.create(templateData);

        // Add to category
        const category = await this.categoryService.getCategoryById(templateData.category);
        if (category.templatesOrder && !category.templatesOrder.includes(template._id.toString())) {
            const updatedOrder = [...(category.templatesOrder || []), template._id.toString()];
            await this.categoryService.updateCategory(templateData.category, { templatesOrder: updatedOrder });
        }

        return template.toObject() as EntityTemplate;
    }

    async updateTemplate(id: string, updateData: UpdateEntityTemplateDto): Promise<EntityTemplate> {
        // Prepare property filters
        if (updateData.properties) {
            Object.entries(updateData.properties?.properties || {}).forEach(([_, value]: [string, any]) => {
                if (value.relationshipReference?.filters && typeof value.relationshipReference.filters === 'object') {
                    value.relationshipReference.filters = JSON.stringify(value.relationshipReference.filters);
                }
            });
        }

        const template = await this.model.findByIdAndUpdate(id, updateData, { new: true }).lean<EntityTemplate>().exec();

        if (!template) {
            throw new NotFoundException(`Entity Template with ID ${id} not found`);
        }

        return template;
    }

    async updateTemplateStatus(id: string, disabled: boolean): Promise<EntityTemplate> {
        const template = await this.model.findByIdAndUpdate(id, { disabled }, { new: true }).lean<EntityTemplate>().exec();

        if (!template) {
            throw new NotFoundException(`Entity Template with ID ${id} not found`);
        }

        return template;
    }

    async updateTemplateAction(id: string, actions: string): Promise<EntityTemplate> {
        const template = await this.model.findByIdAndUpdate(id, { actions }, { new: true }).lean<EntityTemplate>().exec();

        if (!template) {
            throw new NotFoundException(`Entity Template with ID ${id} not found`);
        }

        return template;
    }

    async deleteTemplate(id: string): Promise<EntityTemplate> {
        const template = await this.model.findByIdAndDelete(id).lean<EntityTemplate>().exec();

        if (!template) {
            throw new NotFoundException(`Entity Template with ID ${id} not found`);
        }

        // Remove from category
        const categoryId = template.category as any as string;
        const category = await this.categoryService.getCategoryById(categoryId);
        if (category.templatesOrder) {
            const updatedOrder = category.templatesOrder.filter((tid) => tid !== id);
            await this.categoryService.updateCategory(categoryId, { templatesOrder: updatedOrder });
        }

        // Delete associated relationship templates
        await this.relationshipTemplateService.deleteBySourceOrDestination(id);

        return template;
    }
}
