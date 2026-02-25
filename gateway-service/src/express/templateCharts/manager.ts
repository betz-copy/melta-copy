import {
    ChartsAndGenerator,
    IAxisField,
    IChart,
    IChartBody,
    IChartPermission,
    IChartType,
    IColumnOrLineMetaData,
    IMongoChart,
    IPieMetaData,
} from '@packages/chart';
import { getDefaultFilterFromChildTemplate, IChildTemplatePopulated } from '@packages/child-template';
import { ChartItem, DashboardItemType } from '@packages/dashboard';
import { getFilterModal, IPropertyValue, ISearchFilter } from '@packages/entity';
import { IMongoEntityTemplatePopulated } from '@packages/entity-template';
import { ISubCompactPermissions } from '@packages/permission';
import { IReqUser } from '@packages/user';
import ChartService from '../../externalServices/dashboardService/chartService';
import DashboardItemService from '../../externalServices/dashboardService/dashboardItemService';
import InstancesService from '../../externalServices/instanceService';
import UserService from '../../externalServices/userService';
import DefaultManagerProxy from '../../utils/express/manager';
import { getMetaDataAxes } from '../../utils/templateCharts/getMetaDataAxes';
import TemplatesManager from '../templates/manager';
import WorkspaceService from '../workspaces/service';

class ChartManager extends DefaultManagerProxy<ChartService> {
    private instanceService: InstancesService;

    private templateManager: TemplatesManager;

    private DashboardItemService: DashboardItemService;

    constructor(private workspaceId: string) {
        super(new ChartService(workspaceId));
        this.instanceService = new InstancesService(workspaceId);
        this.templateManager = new TemplatesManager(workspaceId);
        this.DashboardItemService = new DashboardItemService(workspaceId);
    }

    async getChartById(chartId: string) {
        const chart = await this.service.getChartById(chartId);
        const dashboardChartsItems = await this.DashboardItemService.getDashboardRelatedItems([chartId]);
        const usedInDashboard = (dashboardChartsItems[chartId] ?? []).length > 0;

        return { ...chart, usedInDashboard };
    }

    hasPermissionToRelatedTemplate(
        field: IAxisField,
        allowedEntityTemplates: (IChildTemplatePopulated | IMongoEntityTemplatePopulated)[],
        chartEntityTemplate?: IChildTemplatePopulated | IMongoEntityTemplatePopulated,
        isChildTemplate?: boolean,
    ) {
        if (typeof field === 'string') {
            const propertyTemplate = chartEntityTemplate?.properties.properties[field];
            if (propertyTemplate?.format === 'relationshipReference') {
                const { relatedTemplateId } = propertyTemplate.relationshipReference!;

                return allowedEntityTemplates.some((template) =>
                    isChildTemplate
                        ? (template as IChildTemplatePopulated).parentTemplate._id === relatedTemplateId
                        : (template as IMongoEntityTemplatePopulated)._id === relatedTemplateId,
                );
            }
        }

        return true;
    }

    async validateAllowedRelatedTemplate(
        user: IReqUser,
        permissionsOfUserId: ISubCompactPermissions,
        { type, metaData, templateId, childTemplateId }: IChart,
    ) {
        const allowedEntityTemplates = await this.templateManager.getAllAllowedEntityTemplates(permissionsOfUserId, user);
        const allowedChildTemplates = await this.templateManager.getAllowedChildEntitiesTemplates(permissionsOfUserId);

        const chartEntityTemplate = allowedEntityTemplates.find((template) => template._id === templateId);
        const chartChildTemplate = allowedChildTemplates.find((template) => template.parentTemplate._id === templateId);

        switch (type) {
            case IChartType.Column:
            case IChartType.Line: {
                const {
                    xAxis: { field },
                } = metaData as IColumnOrLineMetaData;

                return this.hasPermissionToRelatedTemplate(
                    field,
                    [...allowedChildTemplates, ...allowedEntityTemplates],
                    childTemplateId ? chartChildTemplate : chartEntityTemplate,
                    !!childTemplateId,
                );
            }
            case IChartType.Pie: {
                const { dividedByField } = metaData as IPieMetaData;

                return this.hasPermissionToRelatedTemplate(
                    dividedByField,
                    [...allowedChildTemplates, ...allowedEntityTemplates],
                    childTemplateId ? chartChildTemplate : chartEntityTemplate,
                    !!childTemplateId,
                );
            }

            default:
                return true;
        }
    }

    async getFullChartFilters(chart: IMongoChart, user: IReqUser): Promise<IMongoChart> {
        let childFilters: ISearchFilter | undefined;
        if (chart.childTemplateId) {
            const [childTemplate, workspaceHierarchyIds] = await Promise.all([
                this.templateManager.getChildTemplateById(chart.childTemplateId),
                WorkspaceService.getWorkspaceHierarchyIds(this.workspaceId),
            ]);

            childFilters = getDefaultFilterFromChildTemplate(childTemplate, user, {
                id: this.workspaceId,
                hierarchyIds: workspaceHierarchyIds,
            });
        }

        const chartFilterObj = chart.filter ? JSON.parse(chart.filter) : undefined;
        const filter = childFilters || chartFilterObj ? JSON.stringify(getFilterModal([childFilters, chartFilterObj])) : undefined;
        return { ...chart, filter };
    }

    async getChartsWithPermissions(charts: IMongoChart[], user: IReqUser, permissionsOfUserId: ISubCompactPermissions) {
        const chartPermissionChecks = await Promise.all(
            charts.map(async (chart) => {
                const hasPermission =
                    chart.permission === IChartPermission.Protected ||
                    (chart.permission === IChartPermission.Private && user._id === chart.createdBy);
                const isAllowedRelatedTemplate = await this.validateAllowedRelatedTemplate(user, permissionsOfUserId, chart);

                return hasPermission && isAllowedRelatedTemplate ? await this.getFullChartFilters(chart, user) : null;
            }),
        );

        return chartPermissionChecks.filter((chart) => chart !== null);
    }

    async getChartsByTemplateId(templateId: string, textSearch?: string, childTemplateId?: string) {
        return this.service.getChartsByTemplateId(templateId, textSearch, childTemplateId);
    }

    async generateCharts(allowedCharts: IMongoChart[], templateId: string, user: IReqUser, childTemplateId?: string) {
        const chartsData: IChartBody[] = await Promise.all(
            allowedCharts.map(async (chart) => {
                const { _id, type, metaData, filter } = await this.getFullChartFilters(chart, user);

                return {
                    _id,
                    ...getMetaDataAxes(type, metaData, filter),
                };
            }),
        );

        const units = await UserService.getUnits({ workspaceIds: [this.workspaceId] });

        const generatedCharts = (await this.instanceService.getChartsOfTemplate(templateId, { chartsData, childTemplateId }, units)) as {
            _id: string;
            chart: { x: IPropertyValue; y: number }[];
        }[];

        const generatedChartsMap = new Map(generatedCharts.map(({ _id, chart }) => [_id, chart]));

        const dashboardChartsItems =
            allowedCharts.length > 0 ? await this.DashboardItemService.getDashboardRelatedItems(allowedCharts.map(({ _id }) => _id)) : {};

        const generatedAndDataCharts: ChartsAndGenerator[] = allowedCharts.map((chart) => ({
            ...chart,
            usedInDashboard: (dashboardChartsItems[chart._id] ?? []).length > 0,
            chart: generatedChartsMap.get(chart._id.toString())!,
        }));

        return generatedAndDataCharts;
    }

    async getChartsOfTemplateId(
        templateId: string,
        user: IReqUser,
        permissionsOfUserId: ISubCompactPermissions,
        { textSearch, childTemplateId }: { textSearch?: string; childTemplateId?: string },
    ): Promise<ChartsAndGenerator[]> {
        const charts = await this.getChartsByTemplateId(templateId, textSearch, childTemplateId);

        const allowedCharts = await this.getChartsWithPermissions(charts, user, permissionsOfUserId);

        const generatedAndDataCharts = await this.generateCharts(allowedCharts, templateId, user, childTemplateId);

        return generatedAndDataCharts.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }

    async searchChartByUserId(templateId: string, userId: string, body: { textSearch?: string; childTemplateId?: string }) {
        const { textSearch, childTemplateId } = body;
        const charts = await this.getChartsByTemplateId(templateId, textSearch, childTemplateId);

        return charts.filter((chart) => chart.createdBy === userId && chart.permission === IChartPermission.Protected);
    }

    async createChart(chartData: IChart, toDashboard: boolean = false) {
        const createdChart = await this.service.createChart(chartData);

        if (toDashboard)
            await this.DashboardItemService.createDashboardItem({ type: DashboardItemType.Chart, metaData: createdChart._id } as ChartItem);

        return createdChart;
    }

    async updateChart(chartId: string, updatedChart: IChart, deleteReferenceDashboardItems: boolean = false) {
        if (deleteReferenceDashboardItems) {
            await this.DashboardItemService.deleteDashboardItemByRelatedItem(chartId);
        }
        return this.service.updateChart(chartId, updatedChart);
    }

    async deleteChart(chartId: string, deleteReferenceDashboardItems: boolean = false) {
        if (deleteReferenceDashboardItems) {
            await this.DashboardItemService.deleteDashboardItemByRelatedItem(chartId);
        }
        return this.service.deleteChart(chartId);
    }
}

export default ChartManager;
