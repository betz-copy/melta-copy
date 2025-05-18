import { DashboardItem, DashboardItemService } from '../../externalServices/dashboardService/dashboardItemService';
import { ISubCompactPermissions } from '../../externalServices/userService/interfaces/permissions/permissions';
import DefaultManagerProxy from '../../utils/express/manager';

export class DashboardManager extends DefaultManagerProxy<DashboardItemService> {
    constructor(workspaceId: string) {
        super(new DashboardItemService(workspaceId));
    }

    async createDashboardItem(dashboardItem: DashboardItem) {
        return this.service.createDashboardItem(dashboardItem);
    }

    async searchDashboardItems(userId: string, permissionsOfUserId: ISubCompactPermissions, textSearch?: string) {
        console.log({ userId, permissionsOfUserId });

        const dashboardItems = this.service.searchDashboardItems(textSearch);
        return dashboardItems;
    }
}
