import { FilterQuery } from 'mongoose';
import FolderModel from './model';
import { IGantt, IGanttDocument, ISearchGanttsBody } from './interface';
import { ServiceError } from '../error';
import { escapeRegExp } from '../../utils';
import config from '../../config';

export class GanttManager {
    static searchGantts({ search, limit, step }: ISearchGanttsBody) {
        const query: FilterQuery<IGanttDocument> = {};

        if (search) {
            query.name = { $regex: escapeRegExp(search) };
        }

        return FolderModel.find(query)
            .limit(limit)
            .skip(step * limit)
            .lean()
            .exec();
    }

    static getGanttById(ganttId: string) {
        return FolderModel.findById(ganttId).orFail(new ServiceError(404, 'Gantt not found')).lean().exec();
    }

    static async createGantt(gantt: IGantt) {
        return FolderModel.create(gantt);
    }

    static deleteGantt(ganttId: string) {
        return FolderModel.findByIdAndDelete(ganttId).orFail(new ServiceError(404, 'Gantt not found')).lean().exec();
    }

    static async updateGantt(ganttId: string, gantt: IGantt) {
        return FolderModel.findByIdAndUpdate(ganttId, gantt, { new: true, overwrite: true })
            .orFail(new ServiceError(404, 'Gantt not found'))
            .lean()
            .exec();
    }

    static async isPropertyOfTemplateInUsed(templateId: string, propertiesToRemove: { properties: string[] }) {
        const { properties } = propertiesToRemove;

        const propertyChecks = properties.map(async (property) => {
            const propertyInUsed = await FolderModel.exists({
                'items.entityTemplate.id': templateId,
                $or: [
                    { 'items.entityTemplate.fieldsToShow': property },
                    { 'items.entityTemplate.startDateField': property },
                    { 'items.entityTemplate.endDateField': property },
                ],
            });

            if (propertyInUsed) {
                throw new ServiceError(400, 'can not delete field that used in gantts', {
                    errorCode: config.errorCodes.failedToDeleteField,
                    type: 'gantss',
                    property,
                });
            }
        });

        await Promise.all(propertyChecks);
    }
}

export default GanttManager;
