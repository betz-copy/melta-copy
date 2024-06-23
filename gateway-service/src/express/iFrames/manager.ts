import { FilterQuery } from 'mongoose';
import { IFrame, IFramesService, ISearchIFramesBody } from '../../externalServices/iFramesService';
import { ServiceError } from '../error';
import IFrameModel from './model';
import { IFrameDocument } from './interface';
import { IPermissionsOfUser } from '../permissions/interfaces';

export class IFrameManager {
    // private static filterIFrameWithPermissions(iFrame: IMongoIFrame, allowedEntityTemplates: IMongoEntityTemplatePopulated[]) {
    //     const filteredIFrame = iFrame.categoryIds.filter((id) => {
    //         return allowedEntityTemplates.some(({ _id }) => _id === id);
    //     });
    //     console.log({ filteredIFrame });

    //     return filteredIFrame;
    // }

    static escapeRegExp(text: string) {
        return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    }

    static searchIFrames({ search, limit, step }: ISearchIFramesBody, _permissionsOfUserId: Omit<IPermissionsOfUser, 'user'>) {
        // const allowedEntityTemplates = await getAllowedCategoriesForInstances(permissionsOfUserId);

        const query: FilterQuery<IFrameDocument> = {};

        if (search) {
            query.name = { $regex: this.escapeRegExp(search) };
        }

        const iFrames = IFrameModel.find(query)
            .limit(limit)
            .skip(step * limit)
            .lean()
            .exec();
        // return iFrames.map((gantt) => this.filterIFramesWithPermissions(gantt, allowedEntityTemplates));
        return iFrames;
    }

    static getIFrameById(iframeId: string) {
        return IFrameModel.findById(iframeId).orFail(new ServiceError(404, 'IFrame not found')).lean().exec();
    }

    static async getExternalSiteById(iFrameId: string) {
        const iFrame = await this.getIFrameById(iFrameId);
        return IFramesService.getExternalSiteById(iFrame.url);
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
