import { FilterQuery, Types } from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import config from '../../config';
import { ISearchIFramesBody } from '../../externalServices/iFramesService';
import { StorageService } from '../../externalServices/storageService';
import { RequestWithPermissionsOfUserId } from '../../utils/authorizer';
import { DefaultManagerMongo } from '../../utils/mongo/manager';
import { ServiceError } from '../error';
import { IFrame, IFrameDocument } from './interface';
import IFrameSchema from './model';
import { UploadedFile } from '../../utils/busboy/interface';
import { escapeRegExp } from '../../utils/regex';

export class IFrameManager extends DefaultManagerMongo<IFrameDocument> {
    private storageService: StorageService;

    constructor(workspaceId: string) {
        super(workspaceId, config.mongo.iFramesCollectionName, IFrameSchema);
        this.storageService = new StorageService(workspaceId);
    }

    private filterIFramesWithPermissions(allIFrames: IFrameDocument[], allowedCategories: string[]) {
        return allIFrames.filter((iFrame) => iFrame.categoryIds.every((categoryId) => allowedCategories.includes(categoryId)));
    }

    async searchIFrames(
        { search, limit, skip, ids }: ISearchIFramesBody,
        permissionsOfUserId: RequestWithPermissionsOfUserId['permissionsOfUserId'],
    ) {
        const allowedCategories = Object.keys(permissionsOfUserId.instances?.categories ?? {});

        const query: FilterQuery<IFrameDocument> = {};
        if (search) {
            const searchRegex = { $regex: escapeRegExp(search), $options: 'i' };
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
