import { FilterQuery } from 'mongoose';
import { IChart, IMongoChart } from './interface';
import { DefaultManagerMongo } from '../../utils/mongo/manager';
import ChartSchema from './model';
import config from '../../config';
import { NotFoundError } from '../error';

export class ChartManager extends DefaultManagerMongo<IMongoChart> {
    constructor(workspaceId: string) {
        super(workspaceId, config.mongo.chartsCollectionName, ChartSchema);
    }

    async getChartById(chartId: string) {
        return this.model.findById(chartId).orFail(new NotFoundError('Chart not found')).lean().exec();
    }

    escapeRegExp(text: string) {
        return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    }

    async getChartsByTemplateId(templateId: string, textSearch?: string) {
        const query: FilterQuery<IMongoChart> = {
            templateId,
            ...(textSearch && {
                $or: [
                    { name: { $regex: this.escapeRegExp(textSearch), $options: 'i' } },
                    { description: { $regex: this.escapeRegExp(textSearch), $options: 'i' } },
                ],
            }),
        };
        return this.model.find(query).lean().exec();
    }

    async createChart(chartData: IChart) {
        return this.model.create(chartData);
    }

    async deleteChart(chartId: string) {
        return this.model.findByIdAndDelete(chartId).orFail(new NotFoundError('Chart not found')).lean().exec();
    }

    async updateChart(chartId: string, chartData: Partial<IChart> & { createdAt?: string }) {
        return this.model
            .findByIdAndUpdate(chartId, chartData, { new: true, overwrite: true })
            .orFail(new NotFoundError('Chart not found'))
            .lean()
            .exec();
    }
}
