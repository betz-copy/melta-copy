import { DashboardItem, MongoDashboardItem, MongoDashboardItemPopulated } from '@microservices/shared';
import config from '../../config';
import DefaultExternalServiceApi from '../../utils/express/externalService';

const { url, baseRoute, requestTimeout, dashboard } = config.dashboardService;

class DashboardItemService extends DefaultExternalServiceApi {
    constructor(workspaceId: string) {
        super(workspaceId, { baseURL: `${url}${baseRoute}${dashboard.baseRoute}`, timeout: requestTimeout });
    }

    async getDashboardItemById(dashboardItemId: string): Promise<MongoDashboardItemPopulated> {
        const { data } = await this.api.get<MongoDashboardItemPopulated>(`/${dashboardItemId}`);
        return data;
    }

    async createDashboardItem(dashboardItem: DashboardItem): Promise<DashboardItem> {
        const { data } = await this.api.post('/', dashboardItem);
        return data;
    }

    async updateDashboardItem(dashboardItemId: string, updatedDashboardItem: MongoDashboardItemPopulated) {
        const { data } = await this.api.put<MongoDashboardItem>(`/${dashboardItemId}`, updatedDashboardItem);
        return data;
    }

    async searchDashboardItems(textSearch?: string): Promise<MongoDashboardItemPopulated[]> {
        const { data } = await this.api.post<MongoDashboardItemPopulated[]>('/search', { textSearch });
        return data;
    }

    async getDashboardRelatedItems(relatedIds: string[]): Promise<Record<string, MongoDashboardItemPopulated[]>> {
        const { data } = await this.api.post<Record<string, MongoDashboardItemPopulated[]>>('/relatedItems', { relatedIds });
        return data;
    }

    async deleteDashboardItemByRelatedItem(relatedId: string): Promise<MongoDashboardItemPopulated[]> {
        const { data } = await this.api.delete<MongoDashboardItemPopulated[]>(`/relatedItem/${relatedId}`);
        return data;
    }
}

export default DashboardItemService;
