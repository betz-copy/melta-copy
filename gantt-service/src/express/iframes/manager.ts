import { FilterQuery } from 'mongoose';
import IFrameModel from './model';
import { IFrame, IFrameDocument, ISearchIFramesBody } from './interface';
import { ServiceError } from '../error';
import { escapeRegExp } from '../../utils';

export class IFrameManager {
    static searchIFrames({ search, limit, step }: ISearchIFramesBody) {
        const query: FilterQuery<IFrameDocument> = {};

        if (search) {
            query.name = { $regex: escapeRegExp(search) };
        }

        return IFrameModel.find(query)
            .limit(limit)
            .skip(step * limit)
            .lean()
            .exec();
    }

    static getIFrameById(iframeId: string) {
        return IFrameModel.findById(iframeId).orFail(new ServiceError(404, 'IFrame not found')).lean().exec();
    }

    // static getExternalSiteById(iframeId: string) {
    //     // const GRAFANA_URL = 'https://grafana.yourdomain.com/api/datasource';
    //     // const GRAFANA_TOKEN = 'your_grafana_api_token';
    // }

    static getAllIFrames() {
        return IFrameModel.find().orFail(new ServiceError(404, 'no IFrame exist')).lean().exec();
    }

    static async createIFrame(iframe: IFrame) {
        return IFrameModel.create(iframe);
    }

    static deleteIFrame(iframeId: string) {
        return IFrameModel.findByIdAndDelete(iframeId).orFail(new ServiceError(404, 'IFrame not found')).lean().exec();
    }

    static async updateIFrame(iframeId: string, iframe: IFrame) {
        return IFrameModel.findByIdAndUpdate(iframeId, iframe, { new: true, overwrite: true })
            .orFail(new ServiceError(404, 'IFrame not found'))
            .lean()
            .exec();
    }
}

export default IFrameManager;
