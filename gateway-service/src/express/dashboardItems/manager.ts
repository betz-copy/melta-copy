import { DashboardItem, DashboardItemService } from '../../externalServices/dashboardService/dashboardItemService';
import DefaultManagerProxy from '../../utils/express/manager';

export class DashboardManager extends DefaultManagerProxy<DashboardItemService> {
    constructor(workspaceId: string) {
        super(new DashboardItemService(workspaceId));
    }

    async createDashboardItem(dashboardItem: DashboardItem) {
        
        return this.service.createDashboardItem(dashboardItem);
    }
}
