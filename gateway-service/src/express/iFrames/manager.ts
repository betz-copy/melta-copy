import { FilterQuery, Types } from 'mongoose';
import { ISearchIFramesBody } from '../../externalServices/iFramesService';
import { ServiceError } from '../error';
import IFrameModel from './model';
import { IFrame, IFrameDocument } from './interface';
import { IPermissionsOfUser } from '../permissions/interfaces';
import { deleteFile, uploadFile } from '../../externalServices/storageService';
import { removeTmpFile } from '../../utils/fs';
import { getAllowedCategories } from './middlewares';

export class IFrameManager {
    private static filterIFramesWithPermissions(allIFrames, allowedCategories: string[]) {
        return allIFrames.filter((iFrame) => iFrame.categoryIds.every((categoryId: string) => allowedCategories.includes(categoryId)));
    }

    static escapeRegExp(text: string) {
        return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    }

    static async searchIFrames({ search, limit, skip, ids }: ISearchIFramesBody, permissionsOfUserId: Omit<IPermissionsOfUser, 'user'>) {
        const allowedCategories: string[] = getAllowedCategories(permissionsOfUserId);
        const query: FilterQuery<IFrameDocument> = {};
        if (search) {
            const searchRegex = { $regex: this.escapeRegExp(search), $options: 'i' };
            query.$or = [{ name: searchRegex }, { description: searchRegex }, { url: searchRegex }];
        }
        if (ids) query._id = { $in: ids.map((id) => new Types.ObjectId(id)) };
        const iFrames = await IFrameModel.find(query, {}, { limit, skip, sort: ids ? {} : { createdAt: -1 } })
            .lean()
            .exec();
        const filteredIFrames = this.filterIFramesWithPermissions(iFrames, allowedCategories);
        console.log({ filteredIFrames });

        if (ids) return ids?.map((id) => filteredIFrames.find((iFrame) => iFrame._id.toString() === id)).filter(Boolean);

        return filteredIFrames;

        // return filteredIFrames;
        // const allIFrames = await IFrameModel.find(query).sort({ createdAt: -1 }).lean().exec();
        // const filteredIFrames = this.filterIFramesWithPermissions(allIFrames, allowedCategories);

        // if (!skip && !limit) return filteredIFrames;
        // return filteredIFrames.slice(skip, skip + limit);
    }

    static async getIFrameById(iFrameId: string) {
        // , _permissionsOfUserId: Omit<IPermissionsOfUser, 'user'>) {
        // const allowedCategories: string[] = getAllowedCategories(permissionsOfUserId);
        const iFrame = await IFrameModel.findById(iFrameId).orFail(new ServiceError(404, 'IFrame not found')).lean().exec();
        // const filteredIFrame = this.filterIFramesWithPermissions(iFrame, allowedCategories);
        // const isAllowed = iFrame.categoryIds.every((categoryId: string) => allowedCategories.includes(categoryId));
        // console.log({ isAllowed });
        // return isAllowed ? iFrame : null;
        // validateHasPermissionsToIFrame(iFrame, allowedCategories);
        return iFrame;
    }

    static async createIFrame(iFrameData: Omit<IFrame, 'iconFileId'>, file?: Express.Multer.File) {
        let newIFrame;
        if (file) {
            const newFileId = await uploadFile(file);
            await removeTmpFile(file.path);
            newIFrame = { ...iFrameData, iconFileId: newFileId };
        } else newIFrame = { ...iFrameData, iconFileId: null };
        console.log({ newIFrame });

        return IFrameModel.create(newIFrame);
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
