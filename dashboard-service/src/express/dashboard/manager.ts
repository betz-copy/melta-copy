import { StatusCodes } from 'http-status-codes';
// import { FilterQuery } from 'mongoose';
import { FilterQuery } from 'mongoose';
import config from '../../config';
import { DefaultManagerMongo } from '../../utils/mongo/manager';
import { NotFoundError, ServiceError } from '../error';
import { DashboardItem } from './interface';
import DashboardItemSchema from './model';
import { escapeRegExp } from '../../utils';
import { ChartManager } from '../charts/manager';
import IFrameManager from '../iFrames/manager';

require('../charts/model'); // This registers the 'charts' model

export class DashboardManager extends DefaultManagerMongo<DashboardItem> {
    chartsManager: ChartManager;

    iframeManager: IFrameManager;

    constructor(workspaceId: string) {
        super(workspaceId, config.mongo.dashboardCollectionName, DashboardItemSchema);
        // required define them for populate must know the other db
        this.chartsManager = new ChartManager(workspaceId);
        this.iframeManager = new IFrameManager(workspaceId);
    }

    async getDashboardItemById(dashboardItemId: string) {
        return this.model
            .findById(dashboardItemId)
            .populate('metaData')
            .orFail(new NotFoundError(`Dashboard item with id ${dashboardItemId} not found`))
            .lean()
            .exec();
    }

    async searchDashboardItems(textSearch?: string) {
        const query: FilterQuery<DashboardItem> = {};

        if (textSearch) {
            const regex = new RegExp(escapeRegExp(textSearch), 'i');
            query.$or = [{ 'metaData.name': { $regex: regex } }, { 'metaData.description': { $regex: regex } }];
        }

        const pipeLine = [
            {
                $lookup: {
                    from: 'charts',
                    localField: 'metaData',
                    foreignField: '_id',
                    as: 'chartMetaData',
                },
            },
            {
                $lookup: {
                    from: 'iframes',
                    localField: 'metaData',
                    foreignField: '_id',
                    as: 'iframeMetaData',
                },
            },
            {
                $addFields: {
                    metaData: {
                        $ifNull: [
                            {
                                $arrayElemAt: ['$chartMetaData', 0],
                            },
                            {
                                $ifNull: [
                                    {
                                        $arrayElemAt: ['$iframeMetaData', 0],
                                    },
                                    '$metaData',
                                ],
                            },
                        ],
                    },
                },
            },
            {
                $match: {
                    ...query,
                },
            },
            {
                $project: {
                    chartMetaData: 0,
                    iframeMetaData: 0,
                },
            },
        ];

        return this.model.aggregate(pipeLine).exec();
    }

    async createDashboardItem(dashboardItem: DashboardItem) {
        return this.model.create(dashboardItem);
    }

    async editDashboardItem(dashboardItemId: string, updatedDashboardItem: DashboardItem) {
        const existingChart = await this.model.findById(dashboardItemId);

        return this.model
            .findOneAndReplace({ _id: dashboardItemId }, { ...updatedDashboardItem, createdAt: existingChart?.createdAt }, { new: true })
            .orFail(new ServiceError(StatusCodes.NOT_FOUND, 'dashboard not found'))
            .lean()
            .exec();
    }

    async deleteDashboardItem(dashboardItemId: string) {
        return this.model.findByIdAndDelete(dashboardItemId).lean().exec();
    }
}
