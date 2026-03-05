import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ClsService, DefaultMongoService, MongoModelFactory } from '@packages/utils';
import { Connection, FilterQuery, Types } from 'mongoose';
import config from '../../../config';
import { CreateRelationshipTemplateDto, UpdateRelationshipTemplateDto, SearchRelationshipDto } from '../dto/relationshipTemplate.dto';
import { RelationshipTemplate, RelationshipTemplateSchema } from '../schemas/relationshipTemplate.schema';

@Injectable()
export class RelationshipTemplateService extends DefaultMongoService<RelationshipTemplate> {
    constructor(@InjectConnection() connection: Connection, cls: ClsService, mongoModelFactory: MongoModelFactory) {
        super(
            connection,
            cls,
            config.mongo.relationshipTemplatesCollectionName,
            RelationshipTemplateSchema,
            mongoModelFactory,
            RelationshipTemplate.name,
        );
    }

    async searchRelationships(query: SearchRelationshipDto): Promise<RelationshipTemplate[]> {
        const mongoQuery: FilterQuery<RelationshipTemplate> = {};

        if (query.search) {
            mongoQuery.displayName = { $regex: query.search, $options: 'i' };
        }

        if (query.sourceEntityId) {
            mongoQuery.sourceEntityId = new Types.ObjectId(query.sourceEntityId);
        }

        if (query.destinationEntityId) {
            mongoQuery.destinationEntityId = new Types.ObjectId(query.destinationEntityId);
        }

        return this.model.find(mongoQuery).lean<RelationshipTemplate[]>().exec();
    }

    async getAllRelationships(): Promise<RelationshipTemplate[]> {
        return this.model.find().lean<RelationshipTemplate[]>().exec();
    }

    async getRelationshipById(id: string): Promise<RelationshipTemplate> {
        const relationship = await this.model.findById(id).lean<RelationshipTemplate>().exec();
        if (!relationship) {
            throw new NotFoundException(`Relationship Template with ID ${id} not found`);
        }
        return relationship;
    }

    async getRelationshipsBySourceEntity(sourceEntityId: string): Promise<RelationshipTemplate[]> {
        return this.model
            .find({ sourceEntityId: new Types.ObjectId(sourceEntityId) })
            .lean<RelationshipTemplate[]>()
            .exec();
    }

    async getRelationshipsByDestinationEntity(destinationEntityId: string): Promise<RelationshipTemplate[]> {
        return this.model
            .find({ destinationEntityId: new Types.ObjectId(destinationEntityId) })
            .lean<RelationshipTemplate[]>()
            .exec();
    }

    async createRelationship(data: CreateRelationshipTemplateDto): Promise<RelationshipTemplate> {
        const relationship = await this.model.create(data);
        return relationship.toObject() as RelationshipTemplate;
    }

    async updateRelationship(id: string, data: UpdateRelationshipTemplateDto): Promise<RelationshipTemplate> {
        const relationship = await this.model.findByIdAndUpdate(id, data, { new: true }).lean<RelationshipTemplate>().exec();

        if (!relationship) {
            throw new NotFoundException(`Relationship Template with ID ${id} not found`);
        }

        return relationship;
    }

    async deleteRelationship(id: string): Promise<RelationshipTemplate> {
        const relationship = await this.model.findByIdAndDelete(id).lean<RelationshipTemplate>().exec();
        if (!relationship) {
            throw new NotFoundException(`Relationship Template with ID ${id} not found`);
        }
        return relationship;
    }

    async deleteBySourceOrDestination(entityId: string): Promise<number> {
        const result = await this.model
            .deleteMany({
                $or: [{ sourceEntityId: new Types.ObjectId(entityId) }, { destinationEntityId: new Types.ObjectId(entityId) }],
            })
            .exec();
        return result.deletedCount || 0;
    }
}
