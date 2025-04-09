import { FilterQuery } from 'mongoose';
import config from '../../config';
import { DefaultManagerMongo } from '../../utils/mongo/manager';
import { NotFoundError } from '../error';
import { IFrame, IMongoIframe } from './interface';
import IFrameSchema from './model';

export class IFrameManager extends DefaultManagerMongo<IMongoIframe> {
    constructor(workspaceId: string) {
        super(workspaceId, config.mongo.iFramesCollectionName, IFrameSchema);
    }

    async searchIFrames(query: FilterQuery<IMongoIframe>, limit: number, skip: number, ids?: string[]) {
        const iFrames = await this.model
            .find(query, {}, { limit, skip, sort: ids ? {} : { createdAt: -1 } })
            .lean()
            .exec();

        return iFrames;
    }

    async getIFrameById(iFrameId: string) {
        return this.model.findById(iFrameId).orFail(new NotFoundError('IFrame not found')).lean().exec();
    }

    async createIFrame(iFrame: IFrame) {
        return this.model.create(iFrame);
    }

    async deleteIFrame(iFrameId: string) {
        return this.model.findByIdAndDelete(iFrameId).orFail(new NotFoundError('IFrame not found')).lean().exec();
    }

    async updateIFrame(
        iFrameId: string,
        iFrame: Partial<IFrame> & {
            file?: string;
        },
    ) {
        return this.model
            .findByIdAndUpdate(iFrameId, iFrame, { new: true, overwrite: true })
            .orFail(new NotFoundError('IFrame not found'))
            .lean()
            .exec();
    }
}

export default IFrameManager;
