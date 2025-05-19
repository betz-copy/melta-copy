import { ISearchIFramesBody, IFrame, IMongoIframe, UploadedFile } from '@microservices/shared';
import StorageService from '../../externalServices/storageService';
import { RequestWithPermissionsOfUserId } from '../../utils/authorizer';
import DefaultManagerProxy from '../../utils/express/manager';
import IFramesService from '../../externalServices/dashboardService/iframesService';

export class IFrameManager extends DefaultManagerProxy<IFramesService> {
    private storageService: StorageService;

    constructor(workspaceId: string) {
        super(new IFramesService(workspaceId));
        this.storageService = new StorageService(workspaceId);
    }

    private filterIFramesWithPermissions(allIFrames: IMongoIframe[], allowedCategories: string[]) {
        return allIFrames.filter((iFrame) => iFrame.categoryIds.every((categoryId) => allowedCategories.includes(categoryId)));
    }

    async searchIFrames(
        { search, limit, skip, ids }: ISearchIFramesBody,
        permissionsOfUserId: RequestWithPermissionsOfUserId['permissionsOfUserId'],
    ) {
        const allowedCategories = Object.keys(permissionsOfUserId.instances?.categories ?? {});

        const iFrames = await this.service.searchIFrames({ search, limit, skip, ids });

        const filteredIFrames = permissionsOfUserId.admin?.scope ? iFrames : this.filterIFramesWithPermissions(iFrames, allowedCategories);

        if (ids) return ids?.map((id) => filteredIFrames.find((iFrame) => iFrame._id.toString() === id)).filter(Boolean);

        return filteredIFrames;
    }

    async getIFrameById(iFrameId: string) {
        return this.service.getIFrameById(iFrameId);
    }

    async createIFrame(iFrameData: Omit<IFrame, 'iconFileId'>, file?: UploadedFile) {
        let newIFrame: IFrame;
        if (file) {
            const newFileId = await this.storageService.uploadFile(file);
            newIFrame = { ...iFrameData, iconFileId: newFileId };
        } else newIFrame = { ...iFrameData, iconFileId: null };

        return this.service.createIFrame(newIFrame);
    }

    deleteIFrame(iFrameId: string) {
        return this.service.deleteIFrame(iFrameId);
    }

    async update(
        id: string,
        updatedIFrame: Partial<IFrame> & {
            file?: string;
        },
    ) {
        return this.service.updateIFrame(id, updatedIFrame);
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
