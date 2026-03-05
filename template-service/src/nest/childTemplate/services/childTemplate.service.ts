import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ClsService, DefaultMongoService, MongoModelFactory } from '@packages/utils';
import { Connection, Types } from 'mongoose';
import config from '../../../config';
import { CreateChildTemplateDto, UpdateChildTemplateDto } from '../dto/childTemplate.dto';
import { ChildTemplate, ChildTemplateSchema } from '../schemas/childTemplate.schema';

@Injectable()
export class ChildTemplateService extends DefaultMongoService<ChildTemplate> {
    constructor(@InjectConnection() connection: Connection, cls: ClsService, mongoModelFactory: MongoModelFactory) {
        super(connection, cls, config.mongo.childTemplatesCollectionName, ChildTemplateSchema, mongoModelFactory, ChildTemplate.name);
    }

    async getAllChildTemplates(): Promise<ChildTemplate[]> {
        return this.model.find().lean<ChildTemplate[]>().exec();
    }

    async getChildTemplateById(id: string): Promise<ChildTemplate> {
        const template = await this.model.findById(id).lean<ChildTemplate>().exec();
        if (!template) {
            throw new NotFoundException(`Child Template with ID ${id} not found`);
        }
        return template;
    }

    async getChildTemplatesByParent(parentTemplateId: string): Promise<ChildTemplate[]> {
        return this.model
            .find({ parentTemplateId: new Types.ObjectId(parentTemplateId) })
            .lean<ChildTemplate[]>()
            .exec();
    }

    async createChildTemplate(data: CreateChildTemplateDto): Promise<ChildTemplate> {
        const template = await this.model.create(data);
        return template.toObject() as ChildTemplate;
    }

    async updateChildTemplate(id: string, data: UpdateChildTemplateDto): Promise<ChildTemplate> {
        const template = await this.model.findByIdAndUpdate(id, data, { new: true }).lean<ChildTemplate>().exec();

        if (!template) {
            throw new NotFoundException(`Child Template with ID ${id} not found`);
        }
        return template;
    }

    async deleteChildTemplate(id: string): Promise<ChildTemplate> {
        const template = await this.model.findByIdAndDelete(id).lean<ChildTemplate>().exec();
        if (!template) {
            throw new NotFoundException(`Child Template with ID ${id} not found`);
        }
        return template;
    }
}
