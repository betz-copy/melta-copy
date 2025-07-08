import { DefaultManagerMongo, IChart, IMongoChart, NotFoundError, ServiceError } from '@microservices/shared';
import { StatusCodes } from 'http-status-codes';
import { FilterQuery } from 'mongoose';
import config from '../../config';
import { escapeRegExp } from '../../utils';
import ChartSchema from './model';

class ChartManager extends DefaultManagerMongo<IMongoChart> {
    constructor(workspaceId: string) {
        super(workspaceId, config.mongo.chartsCollectionName, ChartSchema);
    }

    async getChartById(chartId: string) {
        return this.model.findById(chartId).orFail(new NotFoundError('Chart not found')).lean().exec();
    }

    async getChartsByTemplateId(templateId: string, textSearch?: string, isChildTemplate?: boolean) {
        const query: FilterQuery<IMongoChart> = {
            ...(isChildTemplate
                ? { childTemplateId: templateId }
                : {
                      templateId,
                      $or: [{ childTemplateId: { $exists: false } }, { childTemplateId: null }],
                  }),
            ...(textSearch && {
                $or: [
                    { name: { $regex: escapeRegExp(textSearch), $options: 'i' } },
                    { description: { $regex: escapeRegExp(textSearch), $options: 'i' } },
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

    async updateChart(chartId: string, updatedChart: IChart) {
        const existingChart = await this.model.findById(chartId);

        return this.model
            .findOneAndReplace({ _id: chartId }, { ...updatedChart, createdAt: existingChart?.createdAt }, { new: true })
            .orFail(new ServiceError(StatusCodes.NOT_FOUND, 'chart not found'))
            .lean()
            .exec();
    }
}

export default ChartManager;
