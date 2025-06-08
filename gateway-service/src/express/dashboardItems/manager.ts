import _, { flatten, groupBy, keyBy, map, partition } from 'lodash';
import { ISubCompactPermissions } from '@microservices/shared';
import { DashboardItemService, DashboardItemType, MongoDashboardItemPopulated } from '../../externalServices/dashboardService/dashboardItemService';
import DefaultManagerProxy from '../../utils/express/manager';
import ChartManager from '../templateCharts/manager';
import TemplatesManager from '../templates/manager';

class DashboardManager extends DefaultManagerProxy<DashboardItemService> {
    templateManager: TemplatesManager;

    constructor(private workspaceId: string) {
        super(new DashboardItemService(workspaceId));
        this.templateManager = new TemplatesManager(workspaceId);
    }

    private isItemAllowed(
        dashboardItem: any,
        allowedTemplateIds: Set<string>,
        allowedCategoryIds: Set<string>,
        userId: string,
        permissionsOfUserId: ISubCompactPermissions,
        chartManager: ChartManager,
    ) {
        const itemTypePermissions = {
            [DashboardItemType.Chart]: () =>
                allowedTemplateIds.has(dashboardItem.metaData.templateId) &&
                chartManager.validateAllowedRelatedTemplate(userId, permissionsOfUserId, dashboardItem.metaData),

            [DashboardItemType.Iframe]: () =>
                permissionsOfUserId.admin?.scope
                    ? true
                    : dashboardItem.metaData.categoryIds.every((categoryId: string) => allowedCategoryIds.has(categoryId)),

            [DashboardItemType.Table]: () => allowedTemplateIds.has(dashboardItem.metaData.templateId),
        };

        const validator = itemTypePermissions[dashboardItem.type];
        return validator ? validator() : false;
    }

    private async processChartItems(chartItems: any[], chartManager: ChartManager) {
        const chartMetaList = map(chartItems, 'metaData');
        const chartsByTemplateId = groupBy(chartMetaList, 'templateId');

        const generatedCharts = flatten(
            await Promise.all(map(chartsByTemplateId, (charts, templateId) => chartManager.generateCharts(charts, templateId))),
        );

        const generatedChartsMap = keyBy(generatedCharts, '_id');

        return chartItems.map((chartItem) => ({
            ...chartItem,
            metaData: generatedChartsMap[chartItem.metaData._id] || chartItem.metaData,
        }));
    }

    private sortItemsByCreatedDate(items: MongoDashboardItemPopulated[]) {
        return _.sortBy(items, (item) => new Date(item.createdAt).getTime());
    }

    async searchDashboardItems(userId: string, permissionsOfUserId: ISubCompactPermissions, textSearch?: string) {
        const chartManager = new ChartManager(this.workspaceId);
        const allowedCategories = Object.keys(permissionsOfUserId.instances?.categories ?? {});
        const allowedEntityTemplates = await this.templateManager.getAllAllowedEntityTemplates(permissionsOfUserId, userId);

        const allowedTemplateIds = new Set(map(allowedEntityTemplates, '_id'));
        const allowedCategoryIds = new Set(allowedCategories);

        const dashboardItems = await this.service.searchDashboardItems(textSearch);

        const allowedItems = dashboardItems.filter((item) =>
            this.isItemAllowed(item, allowedTemplateIds, allowedCategoryIds, userId, permissionsOfUserId, chartManager),
        );

        const [chartItems, nonChartItems] = partition(allowedItems, (item) => item.type === DashboardItemType.Chart);

        if (chartItems.length === 0) return this.sortItemsByCreatedDate(nonChartItems);

        const enrichedChartItems = await this.processChartItems(chartItems, chartManager);
        const allItems = [...enrichedChartItems, ...nonChartItems];

        return this.sortItemsByCreatedDate(allItems);
    }
}

export default DashboardManager;
