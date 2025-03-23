import { StatusCodes } from 'http-status-codes';
import { FilterQuery } from 'mongoose';
import config from '../../config';
import { InstancesService } from '../../externalServices/instanceService';
import { ISubCompactPermissions } from '../../externalServices/userService/interfaces/permissions/permissions';
import { getMetaDataAxes } from '../../utils/templateCharts/getMetaDataAxes';
import { DefaultManagerMongo } from '../../utils/mongo/manager';
import { ServiceError } from '../error';
import { ChartsAndGenerator, IChart, IChartBody, IChartDocument, IPermission } from './interface';
import ChartSchema from './model';

export class ChartManager extends DefaultManagerMongo<IChartDocument> {
    private instanceService: InstancesService;

    constructor(workspaceId: string) {
        super(workspaceId, config.mongo.chartCollectionName, ChartSchema);
        this.instanceService = new InstancesService(workspaceId);
    }

    async getChartById(chartId: string) {
        return this.model.findById(chartId).orFail(new ServiceError(StatusCodes.NOT_FOUND, 'chart not found')).lean().exec();
    }

    getChartsWithPermissions(charts: IChartDocument[], userId: string) {
        return charts.filter(
            (chart) => chart.permission === IPermission.Protected || (chart.permission === IPermission.Private && userId === chart.createdBy),
        );
    }

    escapeRegExp(text: string) {
        return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    }

    async getChartsByTemplateId(templateId: string, permissionsOfUserId: ISubCompactPermissions, userId: string, textSearch?: string) {
        const query: FilterQuery<IChartDocument> = {
            templateId,
            ...(textSearch && {
                $or: [
                    { name: { $regex: this.escapeRegExp(textSearch), $options: 'i' } },
                    { description: { $regex: this.escapeRegExp(textSearch), $options: 'i' } },
                ],
            }),
        };

        const allChartsOfTemplateId = await this.model.find(query).lean().exec();

        return permissionsOfUserId.admin?.scope ? allChartsOfTemplateId : this.getChartsWithPermissions(allChartsOfTemplateId, userId);
    }

    async getChartsOfTemplateId(
        templateId: string,
        permissionsOfUserId: ISubCompactPermissions,
        userId: string,
        textSearch?: string,
    ): Promise<ChartsAndGenerator[]> {
        const charts = await this.getChartsByTemplateId(templateId, permissionsOfUserId, userId, textSearch);

        const chartsData: IChartBody[] = charts.map(({ _id, type, metaData, filter }) => ({
            _id,
            ...getMetaDataAxes(type, metaData, filter),
        }));

        const generatedCharts = await this.instanceService.getChartsOfTemplate(templateId, chartsData);

        const generatedChartsMap = new Map(generatedCharts.map(({ _id, chart }) => [_id, chart]));

        const GeneratedAndDataCharts: ChartsAndGenerator[] = charts.map((chart) => ({
            ...chart,
            chart: generatedChartsMap.get(chart._id.toString())!,
        }));

        return GeneratedAndDataCharts.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }

    async createChart(chartData: IChart) {
        return this.model.create(chartData);
    }

    async deleteChart(chartId: string) {
        return this.model.findByIdAndDelete(chartId).orFail(new ServiceError(StatusCodes.NOT_FOUND, 'chart not found')).lean().exec();
    }

    async updateChart(chartId: string, updatedChart: IChart) {
        const existingChart = await this.model.findById(chartId);

        return this.model
            .findOneAndReplace({ _id: chartId }, { ...updatedChart, createdAt: existingChart?.createdAt }, { new: true })
            .orFail(new ServiceError(StatusCodes.NOT_FOUND, 'chart not found'))
            .lean()
            .exec();
    }
}
