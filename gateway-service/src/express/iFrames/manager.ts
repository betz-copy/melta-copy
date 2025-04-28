import { FilterQuery, Types } from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import { ISearchIFramesBody, IFrame, IMongoIFrame, DefaultManagerMongo, ServiceError } from '@microservices/shared';
import config from '../../config';
import StorageService from '../../externalServices/storageService';
import { RequestWithPermissionsOfUserId } from '../../utils/authorizer';
import IFrameSchema from './model';
import { UploadedFile } from '../../utils/busboy/interface';

export class IFrameManager extends DefaultManagerMongo<IMongoIFrame> {
    private storageService: StorageService;

    constructor(workspaceId: string) {
        super(workspaceId, config.mongo.iFramesCollectionName, IFrameSchema);
        this.storageService = new StorageService(workspaceId);
    }

    private filterIFramesWithPermissions(allIFrames: IMongoIFrame[], allowedCategories: string[]) {
        return allIFrames.filter((iFrame) => iFrame.categoryIds.every((categoryId) => allowedCategories.includes(categoryId)));
    }

    escapeRegExp(text: string) {
        return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    }

    async searchIFrames(
        { search, limit, skip, ids }: ISearchIFramesBody,
        permissionsOfUserId: RequestWithPermissionsOfUserId['permissionsOfUserId'],
    ) {
        const allowedCategories = Object.keys(permissionsOfUserId.instances?.categories ?? {});

        const query: FilterQuery<IMongoIFrame> = {};
        if (search) {
            const searchRegex = { $regex: this.escapeRegExp(search), $options: 'i' };
            query.$or = [{ name: searchRegex }, { url: searchRegex }];
        }
        if (ids) query._id = { $in: ids.map((id) => new Types.ObjectId(id)) };
        const iFrames = await this.model
            .find(query, {}, { limit, skip, sort: ids ? {} : { createdAt: -1 } })
            .lean()
            .exec();

        const filteredIFrames = permissionsOfUserId.admin?.scope ? iFrames : this.filterIFramesWithPermissions(iFrames, allowedCategories);

        if (ids) return ids?.map((id) => filteredIFrames.find((iFrame) => iFrame._id.toString() === id)).filter(Boolean);

        return filteredIFrames;
    }

    async getIFrameById(iFrameId: string) {
        return this.model.findById(iFrameId).orFail(new ServiceError(StatusCodes.NOT_FOUND, 'IFrame not found')).lean().exec();
    }

    async createIFrame(iFrameData: Omit<IFrame, 'iconFileId'>, file?: UploadedFile) {
        let newIFrame: IFrame;
        if (file) {
            const newFileId = await this.storageService.uploadFile(file);
            newIFrame = { ...iFrameData, iconFileId: newFileId };
        } else newIFrame = { ...iFrameData, iconFileId: null };

        return this.model.create(newIFrame);
    }

    deleteIFrame(iFrameId: string) {
        return this.model.findByIdAndDelete(iFrameId).orFail(new ServiceError(StatusCodes.NOT_FOUND, 'IFrame not found')).lean().exec();
    }

    async update(
        id: string,
        updatedIFrame: Partial<IFrame> & {
            file?: string;
        },
    ) {
        return this.model
            .findByIdAndUpdate(id, updatedIFrame, { new: true, overwrite: true })
            .orFail(new ServiceError(StatusCodes.NOT_FOUND, 'IFrame not found'))
            .lean()
            .exec();
    }

    async updateIFrame(iFrameId: string, updatedData: Partial<IFrame> & { file?: string }, file?: UploadedFile) {
        const { iconFileId } = await this.getIFrameById(iFrameId);
        let updatedIFrame: IFrame;

        if (file) {
            if (iconFileId) {
                await this.storageService.deleteFile(iconFileId);
            }

            const newFileId = await this.storageService.uploadFile(file);

            updatedIFrame = await this.update(iFrameId, { ...updatedData, iconFileId: newFileId });
        } else if (iconFileId && !updatedData.iconFileId) {
            await this.storageService.deleteFile(iconFileId);

            updatedIFrame = await this.update(iFrameId, { ...updatedData, iconFileId: null });
        } else updatedIFrame = await this.update(iFrameId, updatedData);

        return updatedIFrame;
    }
}

export default IFrameManager;
