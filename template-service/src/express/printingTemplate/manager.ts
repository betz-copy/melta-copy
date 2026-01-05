import { IMongoPrintingTemplate, IPrintingTemplate } from '@packages/printing-template';
import { DefaultManagerMongo } from '@packages/utils';
import { NotFoundError } from '@packages/utils';
import { ClientSession, FilterQuery } from 'mongoose';
import config from '../../config';
import { escapeRegExp } from '../../utils';
import PrintingTemplateSchema from './model';

export class PrintingTemplateManager extends DefaultManagerMongo<IMongoPrintingTemplate> {
    constructor(workspaceId: string) {
        super(workspaceId, config.mongo.printingTemplatesCollectionName, PrintingTemplateSchema);
    }

    async getTemplateById(templateId: string) {
        return this.model.findById(templateId).orFail(new NotFoundError('Printing Template not found')).lean().exec();
    }

    async getAllPrintingTemplates() {
        return this.model.find().lean().exec();
    }

    async updateTemplateById(templateId: string, updatedFields: Partial<IPrintingTemplate>, session?: ClientSession) {
        return this.model
            .findByIdAndUpdate(templateId, updatedFields, { new: true, session })
            .orFail(new NotFoundError('Printing Template not found'))
            .lean()
            .exec();
    }

    async deleteTemplateById(templateId: string, session?: ClientSession) {
        return this.model.findByIdAndDelete(templateId, { session }).orFail(new NotFoundError('Printing Template not found')).lean().exec();
    }

    async deleteManyTemplatesByIds(templateIds: string[], session?: ClientSession) {
        const { deletedCount } = await this.model
            .deleteMany({ _id: { $in: templateIds } }, { session })
            .lean()
            .exec();

        if (deletedCount !== templateIds.length) throw new NotFoundError('Some Printing Templates not found');
    }

    async createTemplate(printingTemplate: IPrintingTemplate, session?: ClientSession) {
        return session ? this.model.create([printingTemplate], { session }).then((res) => res[0]) : this.model.create(printingTemplate);
    }

    async searchTemplates(searchBody: { search?: string; ids?: string[]; limit: number; skip: number }) {
        const { search, ids, limit, skip } = searchBody;
        const query: FilterQuery<IPrintingTemplate> = {};

        if (search) {
            query.name = { $regex: escapeRegExp(search) };
        }

        if (ids) {
            query._id = { $in: ids };
        }

        return this.model.find(query).limit(limit).skip(skip).lean().exec();
    }
}

export default PrintingTemplateManager;
