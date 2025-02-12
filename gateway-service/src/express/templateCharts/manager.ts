import { StatusCodes } from 'http-status-codes';
import { FilterQuery } from 'mongoose';
import config from '../../config';
import { InstancesService } from '../../externalServices/instanceService';
import { DefaultManagerMongo } from '../../utils/mongo/manager';
import { ServiceError } from '../error';
import {
    ChartsAndGenerator,
    IChart,
    IChartDocument,
    IChartType,
    IColumnOrLineMetaData,
    INUmberMetaData,
    IPermission,
    IPieMetaData,
} from './interface';
import ChartSchema from './model';
import { ISubCompactPermissions } from '../../externalServices/userService/interfaces/permissions/permissions';

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
        const templatesChart: ChartsAndGenerator[] = [];

        const chartPromises = charts.map(async (chartData) => {
            const { type, metaData, filter } = chartData;

            let xAxis;
            let yAxis;

            switch (type) {
                case IChartType.Column:
                case IChartType.Line: {
                    const chartMetaData = metaData as IColumnOrLineMetaData;
                    xAxis = chartMetaData.xAxis.field;
                    yAxis = chartMetaData.yAxis.field;
                    break;
                }
                case IChartType.Pie: {
                    const { dividedByField, aggregationType } = metaData as IPieMetaData;
                    xAxis = dividedByField;
                    yAxis = aggregationType;
                    break;
                }
                case IChartType.Number: {
                    const { accumulator } = metaData as INUmberMetaData;
                    xAxis = accumulator;
                    break;
                }
                default:
                    throw new Error(`Unsupported chart type: ${type}`);
            }

            const appliedFilter = filter ?? {
                $and: [
                    {
                        disabled: {
                            $in: ['false'],
                        },
                    },
                ],
            };

            const chart = await this.instanceService.getChartOfTemplate(xAxis, yAxis, templateId, appliedFilter);

            templatesChart.push({ chart, ...chartData });
        });

        await Promise.all(chartPromises);

        console.dir({ charts, templatesChart });

        return templatesChart.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }

    async createChart(chartData: IChart) {
        return this.model.create(chartData);
    }

    async deleteChart(chartId: string) {
        return this.model.findByIdAndDelete(chartId).orFail(new ServiceError(StatusCodes.NOT_FOUND, 'chart not found')).lean().exec();
    }

    async updateChart(chartId: string, updatedChart: IChart) {
        return this.model
            .findByIdAndUpdate(chartId, updatedChart, { new: true, overwrite: true })
            .orFail(new ServiceError(StatusCodes.NOT_FOUND, 'chart not found'))
            .lean()
            .exec();
    }
}
