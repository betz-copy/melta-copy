import { FilterQuery, Types } from 'mongoose';
import { DefaultManagerMongo, IMongoIframe, IFrame, ISearchIFramesBody, NotFoundError } from '@microservices/shared';
import config from '../../config';
import IFrameSchema from './model';
import { escapeRegExp } from '../../utils';

class IFrameManager extends DefaultManagerMongo<IMongoIframe> {
    constructor(workspaceId: string) {
        super(workspaceId, config.mongo.iFramesCollectionName, IFrameSchema);
    }

    async searchIFrames({ search, limit, skip, ids }: ISearchIFramesBody) {
        const query: FilterQuery<IMongoIframe> = {};

        if (search) {
            const searchRegex = { $regex: escapeRegExp(search), $options: 'i' };
            query.$or = [{ name: searchRegex }, { url: searchRegex }];
        }
        if (ids) query._id = { $in: ids.map((id) => new Types.ObjectId(id)) };

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
