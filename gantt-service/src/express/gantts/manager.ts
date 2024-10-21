import { FilterQuery } from 'mongoose';
import config from '../../config';
import { escapeRegExp } from '../../utils';
import { DefaultManagerMongo } from '../../utils/mongo/manager';
import { ServiceError } from '../error';
import { IGantt, ISearchGanttsBody } from './interface';
import { GanttSchema } from './model';

export default class GanttManager extends DefaultManagerMongo<IGantt> {
    constructor(workspaceId: string) {
        super(workspaceId, config.mongo.ganttsCollectionName, GanttSchema);
    }

    async searchGantts({ search, limit, step, entityTemplateId, relationshipTemplateIds }: ISearchGanttsBody) {
        const query: FilterQuery<IGantt> = {};

        if (search) query.name = { $regex: escapeRegExp(search) };

        if (entityTemplateId) query['items.entityTemplate.id'] = entityTemplateId;

        if (relationshipTemplateIds) query['items.connectedEntityTemplates.relationshipTemplateId'] = { $in: relationshipTemplateIds };

        return this.model
            .find(query)
            .limit(limit)
            .skip(step * limit)
            .lean()
            .exec();
    }

    async getGanttById(ganttId: string) {
        return this.model.findById(ganttId).orFail(new ServiceError(404, 'Gantt not found')).lean().exec();
    }

    async createGantt(gantt: IGantt) {
        return this.model.create(gantt);
    }

    async deleteGantt(ganttId: string) {
        return this.model.findByIdAndDelete(ganttId).orFail(new ServiceError(404, 'Gantt not found')).lean().exec();
    }

    async updateGantt(ganttId: string, gantt: IGantt) {
        return this.model
            .findByIdAndUpdate(ganttId, gantt, { new: true, overwrite: true })
            .orFail(new ServiceError(404, 'Gantt not found'))
            .lean()
            .exec();
    }
}
