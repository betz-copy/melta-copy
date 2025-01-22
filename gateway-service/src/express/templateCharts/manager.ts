import { StatusCodes } from 'http-status-codes';
import config from '../../config';
import { InstancesService } from '../../externalServices/instanceService';
import { DefaultManagerMongo } from '../../utils/mongo/manager';
import { ServiceError } from '../error';
import { ChartsAndGenerator, IChart, IChartDocument, IChartType, IColumnOrLineMetaData, INUmberMetaData, IPieMetaData } from './interface';
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

    async getChartsByTemplateId(templateId: string) {
        return this.model.find({ templateId }).lean().exec();
    }

    async getChartsOfTemplateId(templateId: string): Promise<ChartsAndGenerator[]> {
        const charts = await this.getChartsByTemplateId(templateId);
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

        return templatesChart;
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
