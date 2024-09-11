import { FilterQuery } from 'mongoose';
<<<<<<< HEAD
import FolderModel from './model';
import { IGantt, IGanttDocument, ISearchGanttsBody } from './interface';
import { NotFoundError } from '../error';
=======
import config from '../../config';
>>>>>>> origin/dev
import { escapeRegExp } from '../../utils';
import { DefaultManagerMongo } from '../../utils/mongo/manager';
import { ServiceError } from '../error';
import { IGantt, ISearchGanttsBody } from './interface';
import { GanttSchema } from './model';

export default class GanttManager extends DefaultManagerMongo<IGantt> {
    constructor(workspaceId: string) {
        super(workspaceId, config.mongo.ganttsCollectionName, GanttSchema);
    }

    async searchGantts({ search, limit, step }: ISearchGanttsBody) {
        const query: FilterQuery<IGantt> = {};

        if (search) {
            query.name = { $regex: escapeRegExp(search) };
        }

        return this.model
            .find(query)
            .limit(limit)
            .skip(step * limit)
            .lean()
            .exec();
    }

<<<<<<< HEAD
    static getGanttById(ganttId: string) {
        return FolderModel.findById(ganttId).orFail(new NotFoundError('Gantt not found')).lean().exec();
=======
    async getGanttById(ganttId: string) {
        return this.model.findById(ganttId).orFail(new ServiceError(404, 'Gantt not found')).lean().exec();
>>>>>>> origin/dev
    }

    async createGantt(gantt: IGantt) {
        return this.model.create(gantt);
    }

<<<<<<< HEAD
    static deleteGantt(ganttId: string) {
        return FolderModel.findByIdAndDelete(ganttId).orFail(new NotFoundError('Gantt not found')).lean().exec();
    }

    static async updateGantt(ganttId: string, gantt: IGantt) {
        return FolderModel.findByIdAndUpdate(ganttId, gantt, { new: true, overwrite: true })
            .orFail(new NotFoundError('Gantt not found'))
=======
    async deleteGantt(ganttId: string) {
        return this.model.findByIdAndDelete(ganttId).orFail(new ServiceError(404, 'Gantt not found')).lean().exec();
    }

    async updateGantt(ganttId: string, gantt: IGantt) {
        return this.model
            .findByIdAndUpdate(ganttId, gantt, { new: true, overwrite: true })
            .orFail(new ServiceError(404, 'Gantt not found'))
>>>>>>> origin/dev
            .lean()
            .exec();
    }
}
