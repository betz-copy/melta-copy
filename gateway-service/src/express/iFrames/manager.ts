import { ISearchIFramesBody, IFrame, IMongoIframe, UploadedFile, DashboardItemType, IframeItem } from '@microservices/shared';
import StorageService from '../../externalServices/storageService';
import { RequestWithPermissionsOfUserId } from '../../utils/authorizer';
import DefaultManagerProxy from '../../utils/express/manager';
import IFramesService from '../../externalServices/dashboardService/iframesService';
import DashboardItemService from '../../externalServices/dashboardService/dashboardItemService';

export class IFrameManager extends DefaultManagerProxy<IFramesService> {
    private storageService: StorageService;

    private dashboardItemService: DashboardItemService;

    constructor(workspaceId: string) {
        super(new IFramesService(workspaceId));
        this.storageService = new StorageService(workspaceId);
        this.dashboardItemService = new DashboardItemService(workspaceId);
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

        const dashboardIframesItems =
            filteredIFrames.length > 0 ? await this.dashboardItemService.getDashboardRelatedItems(filteredIFrames.map(({ _id }) => _id)) : {};

        const allFilteredIframes = filteredIFrames.map((iframe) => ({
            ...iframe,
            usedInDashboard: (dashboardIframesItems[iframe._id] ?? []).length > 0,
        }));

        if (ids) return ids?.map((id) => allFilteredIframes.find((iFrame) => iFrame._id.toString() === id)).filter(Boolean);

        return allFilteredIframes;
    }

    async getIFrameById(iFrameId: string) {
        const iframe = await this.service.getIFrameById(iFrameId);
        const dashboardIframesItems = await this.dashboardItemService.getDashboardRelatedItems([iFrameId]);
        const usedInDashboard = (dashboardIframesItems[iFrameId] ?? []).length > 0;
        return { ...iframe, usedInDashboard };
    }

    async createIFrame(iFrameData: Omit<IFrame, 'iconFileId'>, file?: UploadedFile, toDashboard: boolean = false) {
        let newIFrame: IFrame;
        if (file) {
            const newFileId = await this.storageService.uploadFile(file);
            newIFrame = { ...iFrameData, iconFileId: newFileId };
        } else newIFrame = { ...iFrameData, iconFileId: null };

        const createdIframe = await this.service.createIFrame(newIFrame);

        if (toDashboard)
            await this.dashboardItemService.createDashboardItem({ type: DashboardItemType.Iframe, metaData: createdIframe._id } as IframeItem);

        return createdIframe;
    }

    async deleteIFrame(iFrameId: string, deleteReferenceDashboardItems: boolean = false) {
        if (deleteReferenceDashboardItems) {
            await this.dashboardItemService.deleteDashboardItemByRelatedItem(iFrameId);
        }
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
