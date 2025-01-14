import { StatusCodes } from 'http-status-codes';
import { DefaultManagerMongo } from '../../utils/mongo/manager';
import { ServiceError } from '../error';
import { IChart, IChartDocument } from './interface';
import config from '../../config';
import ChartSchema from './model';

export class ChartManager extends DefaultManagerMongo<IChartDocument> {
    constructor(workspaceId: string) {
        super(workspaceId, config.mongo.chartCollectionName, ChartSchema);
    }

    async getChartById(chartId: string) {
        return this.model.findById(chartId).orFail(new ServiceError(StatusCodes.NOT_FOUND, 'chart not found')).lean().exec();
    }

    async getChartsByTemplateId(templateId: string) {
        return this.model.find({ templateId }).orFail(new ServiceError(StatusCodes.NOT_FOUND, 'chart not found')).lean().exec();
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
