import { FilterQuery } from 'mongoose';
import { ISearchIFramesBody } from '../../externalServices/iFramesService';
import { ServiceError } from '../error';
import IFrameModel from './model';
import { IFrame, IFrameDocument } from './interface';
import { IPermissionsOfUser } from '../permissions/interfaces';
import { deleteFile, uploadFile } from '../../externalServices/storageService';
import { removeTmpFile } from '../../utils/fs';
import { getAllowedCategoriesForInstances } from './middlewares';

export class IFrameManager {
    private static filterIFramesWithPermissions(allIFrames, allowedCategories: string[]) {
        return allIFrames.filter((iframe) => iframe.categoryIds.every((categoryId: string) => allowedCategories.includes(categoryId)));
    }

    static escapeRegExp(text: string) {
        return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    }

    static async searchIFrames({ search, limit, skip }: ISearchIFramesBody, permissionsOfUserId: Omit<IPermissionsOfUser, 'user'>) {
        const allowedCategories: string[] = getAllowedCategoriesForInstances(permissionsOfUserId);
        const query: FilterQuery<IFrameDocument> = {};
        if (search) {
            const searchRegex = { $regex: this.escapeRegExp(search), $options: 'i' };
            query.$or = [{ name: searchRegex }, { description: searchRegex }, { url: searchRegex }];
        }
        const allIFrames = await IFrameModel.find(query).lean().exec();
        const filteredIFrames = this.filterIFramesWithPermissions(allIFrames, allowedCategories);
        if (!skip && !limit) return filteredIFrames;
        return filteredIFrames.slice(skip, skip + limit);
    }

    static getIFrameById(iFrameId: string) {
        return IFrameModel.findById(iFrameId).orFail(new ServiceError(404, 'IFrame not found')).lean().exec();
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
