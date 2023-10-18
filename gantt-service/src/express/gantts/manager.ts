import { FilterQuery } from 'mongoose';
import FolderModel from './model';
import { IGantt, IGanttDocument, ISearchGanttsBody } from './interface';
import { ServiceError } from '../error';
import { escapeRegExp } from '../../utils';

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
}

export default GanttManager;
