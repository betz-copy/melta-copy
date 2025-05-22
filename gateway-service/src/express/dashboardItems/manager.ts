import _ from 'lodash';
import { DashboardItem, DashboardItemService, DashboardItemType } from '../../externalServices/dashboardService/dashboardItemService';
import { ISubCompactPermissions } from '../../externalServices/userService/interfaces/permissions/permissions';
import DefaultManagerProxy from '../../utils/express/manager';
import { ChartManager } from '../templateCharts/manager';
import TemplatesManager from '../templates/manager';

export class DashboardManager extends DefaultManagerProxy<DashboardItemService> {
    templateManager: TemplatesManager;

    constructor(private workspaceId: string) {
        super(new DashboardItemService(workspaceId));
        this.templateManager = new TemplatesManager(workspaceId);
    }

    async createDashboardItem(dashboardItem: DashboardItem) {
        return this.service.createDashboardItem(dashboardItem);
    }

    async searchDashboardItems(userId: string, permissionsOfUserId: ISubCompactPermissions, textSearch?: string) {
        const chartManager = new ChartManager(this.workspaceId);
        // const allowedCategories = Object.keys(permissionsOfUserId.instances?.categories ?? {});
        const allowedEntityTemplates = await this.templateManager.getAllAllowedEntityTemplates(permissionsOfUserId, userId);

        const dashboardItems = await this.service.searchDashboardItems(textSearch);

        const allowedItems = dashboardItems.filter((dashboardItem) => {
            switch (dashboardItem.type) {
                case DashboardItemType.Chart:
                    return (
                        allowedEntityTemplates.find((item) => item._id === dashboardItem.metaData.templateId) &&
                        chartManager.validateAllowedRelatedTemplate(userId, permissionsOfUserId, dashboardItem.metaData)
                    );
                case DashboardItemType.Iframe:
                    // return dashboardItem.metaData.categoryIds.every((categoryId) => allowedCategories.includes(categoryId));
                    return true;
                case DashboardItemType.Table:
                    return allowedEntityTemplates.find((item) => item._id === dashboardItem.metaData.templateId);

                default:
                    return false;
            }
        });

        const [chartItems, nonChartItems] = _.partition(allowedItems, (item) => item.type === DashboardItemType.Chart);

        const chartMetaList = chartItems.map((item) => item.metaData);

        const chartsByTemplateId = _.groupBy(chartMetaList, 'templateId');

        const generatedCharts = (
            await Promise.all(Object.entries(chartsByTemplateId).map(([templateId, charts]) => chartManager.generateCharts(charts, templateId)))
        ).flat();

        const goodCharts = chartItems.map((chartItem) => ({
            ...chartItem,
            metaData: generatedCharts.find((item) => item._id === chartItem.metaData._id),
        }));

        const allItems = [...goodCharts, ...nonChartItems];

        return allItems.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
}
