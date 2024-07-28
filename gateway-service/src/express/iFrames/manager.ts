import { FilterQuery } from 'mongoose';
import { IFramesService, ISearchIFramesBody } from '../../externalServices/iFramesService';
import { ServiceError } from '../error';
import IFrameModel from './model';
import { IFrame, IFrameDocument } from './interface';
import { IPermissionsOfUser } from '../permissions/interfaces';
import { deleteFile, uploadFile } from '../../externalServices/storageService';
import { removeTmpFile } from '../../utils/fs';

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

    static async searchIFrames({ search, limit, skip }: ISearchIFramesBody, _permissionsOfUserId: Omit<IPermissionsOfUser, 'user'>) {
        // const allowedCategories = await getAllowedCategoriesForInstances(permissionsOfUserId);
        // console.log({ allowedCategories });

        const query: FilterQuery<IFrameDocument> = {};

        if (search) {
            query.name = { $regex: this.escapeRegExp(search) };
        }
        console.log({ search, limit, skip });

        const iFrames = await IFrameModel.find(query).limit(limit).skip(skip).lean().exec();
        console.log({ iFrames });

        // return iFrames.map((iframe) => this.filterIFramesWithPermissions(iframe, allowedCategories));
        return iFrames;
    }

    static getIFrameById(iFrameId: string) {
        return IFrameModel.findById(iFrameId).orFail(new ServiceError(404, 'IFrame not found')).lean().exec();
    }

    static async getExternalSiteById(iFrameId: string) {
        const iFrame = await this.getIFrameById(iFrameId);
        return IFramesService.getExternalSiteById(iFrame.url);
    }

    static async createIFrame(iFrame: IFrame) {
        return IFrameModel.create(iFrame);
    }

    static deleteIFrame(iFrameId: string) {
        return IFrameModel.findByIdAndDelete(iFrameId).orFail(new ServiceError(404, 'IFrame not found')).lean().exec();
    }

    static async update(
        id: string,
        updatedIFrame: Partial<IFrame> & {
            file?: string;
        },
    ) {
        return IFrameModel.findByIdAndUpdate(id, updatedIFrame, { new: true, overwrite: true })
            .orFail(new ServiceError(404, 'IFrame not found'))
            .lean()
            .exec();
    }

    static async updateIFrame(iFrameId: string, updatedData: Partial<IFrame> & { file?: string }, file?: Express.Multer.File) {
        const { iconFileId } = await IFrameManager.getIFrameById(iFrameId);
        let updatedIFrame;

        if (file) {
            if (iconFileId) {
                await deleteFile(iconFileId);
            }

            const newFileId = await uploadFile(file);
            await removeTmpFile(file.path);

            updatedIFrame = await IFrameManager.update(iFrameId, { ...updatedData, iconFileId: newFileId });
        } else if (iconFileId && !updatedData.iconFileId) {
            await deleteFile(iconFileId);

            updatedIFrame = await IFrameManager.update(iFrameId, { ...updatedData, iconFileId: null });
        } else updatedIFrame = await IFrameManager.update(iFrameId, updatedData);

        return updatedIFrame;
    }
}

export default IFrameManager;
