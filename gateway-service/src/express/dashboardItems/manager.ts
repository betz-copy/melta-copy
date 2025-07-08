import { ChartItemPopulated, DashboardItemType, ISubCompactPermissions, MongoBaseFields, MongoDashboardItemPopulated } from '@microservices/shared';
import { flatten, groupBy, keyBy, map, partition, sortBy } from 'lodash';
import DashboardItemService from '../../externalServices/dashboardService/dashboardItemService';
import DefaultManagerProxy from '../../utils/express/manager';
import ChartManager from '../templateCharts/manager';
import TemplatesManager from '../templates/manager';

class DashboardManager extends DefaultManagerProxy<DashboardItemService> {
    templateManager: TemplatesManager;

    constructor(private workspaceId: string) {
        super(new DashboardItemService(workspaceId));
        this.templateManager = new TemplatesManager(workspaceId);
    }

    // todo shir: check that its ok after itay refactor
    private isItemAllowed(
        dashboardItem: MongoDashboardItemPopulated,
        allowedTemplateIds: Set<string>,
        allowedCategoryIds: Set<string>,
        userId: string,
        permissionsOfUserId: ISubCompactPermissions,
        chartManager: ChartManager,
    ) {
        switch (dashboardItem.type) {
            case DashboardItemType.Chart:
                return (
                    allowedTemplateIds.has(dashboardItem.metaData.templateId) &&
                    chartManager.validateAllowedRelatedTemplate(userId, permissionsOfUserId, dashboardItem.metaData)
                );
            case DashboardItemType.Iframe:
                return permissionsOfUserId.admin?.scope
                    ? true
                    : dashboardItem.metaData.categoryIds.every((categoryId: string) => allowedCategoryIds.has(categoryId));
            case DashboardItemType.Table:
                return allowedTemplateIds.has(dashboardItem.metaData.templateId);
            default:
                return false;
        }
    }

    private async processChartItems(chartItems: (ChartItemPopulated & MongoBaseFields)[], chartManager: ChartManager) {
        const chartMetaList = map(chartItems, 'metaData');
        const [childChartsItems, parentChartItems] = partition(chartMetaList, (item) => !!item.childTemplateId);

        const chartsByTemplateId = groupBy(parentChartItems, 'templateId');
        const chartsByChildTemplateId = groupBy(childChartsItems, 'childTemplateId');

        const generatedCharts = flatten(
            await Promise.all(map(chartsByTemplateId, (charts, templateId) => chartManager.generateCharts(charts, templateId))),
        );

        const generatedChildCharts = flatten(
            await Promise.all(map(chartsByChildTemplateId, (charts, childTemplateId) => chartManager.generateCharts(charts, childTemplateId, true))),
        );

        const allGeneratedCharts = [...generatedCharts, ...generatedChildCharts];

        const generatedChartsMap = keyBy(allGeneratedCharts, '_id');

        return chartItems.map((chartItem) => ({
            ...chartItem,
            metaData: generatedChartsMap[chartItem.metaData._id] || chartItem.metaData,
        }));
    }

    private sortItemsByCreatedDate(items: MongoDashboardItemPopulated[]) {
        return sortBy(items, (item) => new Date(item.createdAt).getTime());
    }

    async searchDashboardItems(userId: string, permissionsOfUserId: ISubCompactPermissions, textSearch?: string) {
        const chartManager = new ChartManager(this.workspaceId);
        const allowedCategories = Object.keys(permissionsOfUserId.instances?.categories ?? {});
        const allowedEntityTemplates = await this.templateManager.getAllAllowedEntityTemplates(permissionsOfUserId, userId);

        const allowedTemplateIds = new Set(map(allowedEntityTemplates, '_id'));
        const allowedCategoryIds = new Set(allowedCategories);

        const dashboardItems = await this.service.searchDashboardItems(textSearch);

        console.dir({ dashboardItems }, { depth: null });

        const allowedItems = dashboardItems.filter((item) =>
            this.isItemAllowed(item, allowedTemplateIds, allowedCategoryIds, userId, permissionsOfUserId, chartManager),
        );

        const [chartItems, nonChartItems] = partition(allowedItems, (item) => item.type === DashboardItemType.Chart);

        if (chartItems.length === 0) return this.sortItemsByCreatedDate(nonChartItems);

        const processedCharts = await this.processChartItems(chartItems, chartManager);
        const allItems = [...processedCharts, ...nonChartItems];

        return this.sortItemsByCreatedDate(allItems);
    }
}

export default DashboardManager;
