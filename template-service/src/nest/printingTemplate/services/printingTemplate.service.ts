import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ClsService, DefaultMongoService, MongoModelFactory } from '@packages/utils';
import { Connection } from 'mongoose';
import config from '../../../config';
import { CreatePrintingTemplateDto, UpdatePrintingTemplateDto } from '../dto/printingTemplate.dto';
import { PrintingTemplate, PrintingTemplateSchema } from '../schemas/printingTemplate.schema';

@Injectable()
export class PrintingTemplateService extends DefaultMongoService<PrintingTemplate> {
    constructor(@InjectConnection() connection: Connection, cls: ClsService, mongoModelFactory: MongoModelFactory) {
        super(connection, cls, config.mongo.printingTemplatesCollectionName, PrintingTemplateSchema, mongoModelFactory, PrintingTemplate.name);
    }

    async getAllPrintingTemplates(): Promise<PrintingTemplate[]> {
        return this.model.find().lean<PrintingTemplate[]>().exec();
    }

    async getPrintingTemplateById(id: string): Promise<PrintingTemplate> {
        const template = await this.model.findById(id).lean<PrintingTemplate>().exec();
        if (!template) {
            throw new NotFoundException(`Printing Template with ID ${id} not found`);
        }
        return template;
    }

    async createPrintingTemplate(data: CreatePrintingTemplateDto): Promise<PrintingTemplate> {
        const template = await this.model.create(data);
        return template.toObject() as PrintingTemplate;
    }

    async updatePrintingTemplate(id: string, data: UpdatePrintingTemplateDto): Promise<PrintingTemplate> {
        const template = await this.model.findByIdAndUpdate(id, data, { new: true }).lean<PrintingTemplate>().exec();

        if (!template) {
            throw new NotFoundException(`Printing Template with ID ${id} not found`);
        }
        return template;
    }

    async deletePrintingTemplate(id: string): Promise<PrintingTemplate> {
        const template = await this.model.findByIdAndDelete(id).lean<PrintingTemplate>().exec();
        if (!template) {
            throw new NotFoundException(`Printing Template with ID ${id} not found`);
        }
        return template;
    }
}
