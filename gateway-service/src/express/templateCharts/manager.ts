import { InstancesService } from '../../externalServices/instanceService';
import { getMetaDataAxes } from '../../utils/templateCharts/getMetaDataAxes';
import { ForbiddenError } from '../error';
import {
    ChartsAndGenerator,
    IAxisField,
    IChart,
    IChartBody,
    IChartDocument,
    IChartType,
    IColumnOrLineMetaData,
    IPermission,
    IPieMetaData,
    ChartService,
} from '../../externalServices/dashboardService/chartService';
import TemplatesManager from '../templates/manager';
import { ISubCompactPermissions } from '../../externalServices/userService/interfaces/permissions/permissions';
import { IMongoEntityTemplatePopulated } from '../../externalServices/templates/entityTemplateService';
import DefaultManagerProxy from '../../utils/express/manager';

export class ChartManager extends DefaultManagerProxy<ChartService> {
    private instanceService: InstancesService;

    private templateManager: TemplatesManager;

    constructor(workspaceId: string) {
        super(new ChartService(workspaceId));
        this.instanceService = new InstancesService(workspaceId);
        this.templateManager = new TemplatesManager(workspaceId);
    }

    async getChartById(chartId: string) {
        return this.service.getChartById(chartId);
    }

    hasPermissionToRelatedTemplate(
        field: IAxisField,
        allowedEntityTemplates: IMongoEntityTemplatePopulated[],
        chartTemplate?: IMongoEntityTemplatePopulated,
    ) {
        if (typeof field === 'string') {
            const propertyTemplate = chartTemplate?.properties.properties[field];
            if (propertyTemplate?.format === 'relationshipReference') {
                const relatedTemplateId = propertyTemplate.relationshipReference?.relatedTemplateId!;
                return allowedEntityTemplates?.some((allowedEntityTemplate) => allowedEntityTemplate._id === relatedTemplateId);
            }
        }

        return true;
    }

    async validateAllowedRelatedTemplate(userId: string, permissionsOfUserId: ISubCompactPermissions, { type, metaData, templateId }: IChart) {
        const allowedEntityTemplates = await this.templateManager.getAllAllowedEntityTemplates(permissionsOfUserId, userId);
        const chartTemplate = allowedEntityTemplates.find((template) => template._id === templateId);

        switch (type) {
            case IChartType.Column:
            case IChartType.Line: {
                const {
                    xAxis: { field },
                } = metaData as IColumnOrLineMetaData;

                return this.hasPermissionToRelatedTemplate(field, allowedEntityTemplates, chartTemplate);
            }
            case IChartType.Pie: {
                const { dividedByField } = metaData as IPieMetaData;

                return this.hasPermissionToRelatedTemplate(dividedByField, allowedEntityTemplates, chartTemplate);
            }

            default:
                return true;
        }
    }

    async getChartsWithPermissions(charts: IChartDocument[], userId: string, permissionsOfUserId: ISubCompactPermissions) {
        const chartPermissionChecks = await Promise.all(
            charts.map(async (chart) => {
                const hasPermission =
                    chart.permission === IPermission.Protected || (chart.permission === IPermission.Private && userId === chart.createdBy);

                const isAllowedRelatedTemplate = await this.validateAllowedRelatedTemplate(userId, permissionsOfUserId, chart);

                return hasPermission && isAllowedRelatedTemplate ? chart : null;
            }),
        );

        return chartPermissionChecks.filter((chart): chart is IChartDocument => chart !== null);
    }

    async getChartsByTemplateId(templateId: string, textSearch?: string) {
        return this.service.getCharts(templateId, textSearch);
    }

    async getChartsOfTemplateId(
        templateId: string,
        userId: string,
        permissionsOfUserId: ISubCompactPermissions,
        textSearch?: string,
    ): Promise<ChartsAndGenerator[]> {
        const charts = await this.getChartsByTemplateId(templateId, textSearch);

        const allowedCharts = await this.getChartsWithPermissions(charts, userId, permissionsOfUserId);

        const chartsData: IChartBody[] = allowedCharts.map(({ _id, type, metaData, filter }) => ({
            _id,
            ...getMetaDataAxes(type, metaData, filter),
        }));

        const generatedCharts = await this.instanceService.getChartsOfTemplate(templateId, chartsData);

        const generatedChartsMap = new Map(generatedCharts.map(({ _id, chart }) => [_id, chart]));

        const GeneratedAndDataCharts: ChartsAndGenerator[] = allowedCharts.map((chart) => ({
            ...chart,
            chart: generatedChartsMap.get(chart._id.toString())!,
        }));

        return GeneratedAndDataCharts.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }

    async createChart(chartData: IChart, userId: string, permissionsOfUserId: ISubCompactPermissions) {
        const hasPermissionToRelatedTemplate = await this.validateAllowedRelatedTemplate(userId, permissionsOfUserId, chartData);
        if (!hasPermissionToRelatedTemplate) throw new ForbiddenError(`doesn't have permission to related Template`);

        return this.service.createChart(chartData);
    }

    async deleteChart(chartId: string) {
        return this.service.deleteChart(chartId);
    }

    async updateChart(chartId: string, updatedChart: IChart, userId?: string, permissionsOfUserId?: ISubCompactPermissions) {
        if (userId && permissionsOfUserId) {
            const hasPermissionToRelatedTemplate = await this.validateAllowedRelatedTemplate(userId, permissionsOfUserId, updatedChart);
            if (!hasPermissionToRelatedTemplate) throw new ForbiddenError(`doesn't have permission to related Template`);
        }

        const existingChart = await this.getChartById(chartId);

        return this.service.updateChart(chartId, { ...updatedChart, createdAt: existingChart?.createdAt });
    }
}
