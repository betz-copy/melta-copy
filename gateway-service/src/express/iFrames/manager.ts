import { FilterQuery, Types } from 'mongoose';
import { ISearchIFramesBody } from '../../externalServices/iFramesService';
import { ServiceError } from '../error';
import IFrameModel from './model';
import { IFrame, IFrameDocument } from './interface';
import { StorageService } from '../../externalServices/storageService';
import { removeTmpFile } from '../../utils/fs';
import { RequestWithPermissionsOfUserId } from '../../utils/authorizer';
import DefaultManagerProxy from '../../utils/express/manager';

export class IFrameManager extends DefaultManagerProxy {
    private storageService: StorageService;

    constructor(workspaceId: string) {
        super(null);
        this.storageService = new StorageService(workspaceId);
    }
    private filterIFramesWithPermissions(allIFrames, allowedCategories: string[]) {
        return allIFrames.filter((iFrame) => iFrame.categoryIds.every((categoryId: string) => allowedCategories.includes(categoryId)));
    }

    escapeRegExp(text: string) {
        return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    }

    async searchIFrames(
        { search, limit, skip, ids }: ISearchIFramesBody,
        permissionsOfUserId: RequestWithPermissionsOfUserId['permissionsOfUserId'],
    ) {
        const allowedCategories = Object.keys(permissionsOfUserId.instances?.categories ?? {});

        const query: FilterQuery<IFrameDocument> = {};
        if (search) {
            const searchRegex = { $regex: this.escapeRegExp(search), $options: 'i' };
            query.$or = [{ name: searchRegex }, { url: searchRegex }];
        }
        if (ids) query._id = { $in: ids.map((id) => new Types.ObjectId(id)) };
        const iFrames = await IFrameModel.find(query, {}, { limit, skip, sort: ids ? {} : { createdAt: -1 } })
            .lean()
            .exec();

        const filteredIFrames = permissionsOfUserId.admin?.scope ? iFrames : this.filterIFramesWithPermissions(iFrames, allowedCategories);

        if (ids) return ids?.map((id) => filteredIFrames.find((iFrame) => iFrame._id.toString() === id)).filter(Boolean);

        return filteredIFrames;
    }

    async getIFrameById(iFrameId: string) {
        const iFrame = await IFrameModel.findById(iFrameId).orFail(new ServiceError(404, 'IFrame not found')).lean().exec();

        return iFrame;
    }

    async createIFrame(iFrameData: Omit<IFrame, 'iconFileId'>, file?: Express.Multer.File) {
        let newIFrame;
        if (file) {
            const newFileId = await this.storageService.uploadFile(file);
            await removeTmpFile(file.path);
            newIFrame = { ...iFrameData, iconFileId: newFileId };
        } else newIFrame = { ...iFrameData, iconFileId: null };

        return IFrameModel.create(newIFrame);
    }

    deleteIFrame(iFrameId: string) {
        return IFrameModel.findByIdAndDelete(iFrameId).orFail(new ServiceError(404, 'IFrame not found')).lean().exec();
    }

    async update(
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

    async updateIFrame(iFrameId: string, updatedData: Partial<IFrame> & { file?: string }, file?: Express.Multer.File) {
        const { iconFileId } = await this.getIFrameById(iFrameId);
        let updatedIFrame;

        if (file) {
            if (iconFileId) {
                await this.storageService.deleteFile(iconFileId);
            }

            const newFileId = await this.storageService.uploadFile(file);
            await removeTmpFile(file.path);

            updatedIFrame = await this.update(iFrameId, { ...updatedData, iconFileId: newFileId });
        } else if (iconFileId && !updatedData.iconFileId) {
            await this.storageService.deleteFile(iconFileId);

            updatedIFrame = await this.update(iFrameId, { ...updatedData, iconFileId: null });
        } else updatedIFrame = await this.update(iFrameId, updatedData);

        return updatedIFrame;
    }
}

export default IFrameManager;
