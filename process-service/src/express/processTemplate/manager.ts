import { FilterQuery, Document } from 'mongoose';
import ProcessTemplateModel from './model';
import { IProcessTemplate } from './interface';
import { ServiceError } from '../error';
import { escapeRegExp } from '../../utils';

export class ProcessTemplateManager {
    static getTemplateById(templateId: string) {
        return ProcessTemplateModel.findById(templateId).orFail(new ServiceError(404, 'Process Template not found')).lean().exec();
    }

    static createTemplate(template: IProcessTemplate) {
        return ProcessTemplateModel.create(template);
    }

    static deleteTemplate(id: string) {
        return ProcessTemplateModel.findByIdAndDelete(id).orFail(new ServiceError(404, 'Process Template not found')).lean().exec();
    }

    static async updateTemplate(id: string, updatedData: Partial<IProcessTemplate>) {
        return ProcessTemplateModel.findByIdAndUpdate(id, updatedData, { new: true })
            .orFail(new ServiceError(404, 'Process Template not found'))
            .lean()
            .exec();
    }

    static searchTemplates(searchBody: { search?: string; ids?: string[]; limit: number; skip: number }) {
        const { search, ids, limit, skip } = searchBody;
        const query: FilterQuery<IProcessTemplate & Document> = {};

        if (search) {
            query.displayName = { $regex: escapeRegExp(search) };
        }

        if (ids) {
            query._id = { $in: ids };
        }

        return ProcessTemplateModel.find(query).limit(limit).skip(skip).lean().exec();
    }
}

export default ProcessTemplateManager;
