import {
    DashboardItem,
    DashboardItemType,
    DefaultManagerMongo,
    IMongoChart,
    IMongoIframe,
    MongoDashboardItem,
    NotFoundError,
    ServiceError,
} from '@microservices/shared';
import { StatusCodes } from 'http-status-codes';
import groupBy from 'lodash.groupby';
import { FilterQuery, Types } from 'mongoose';
import config from '../../config';
import { escapeRegExp } from '../../utils';
import ChartManager from '../charts/manager';
import IFrameManager from '../iFrames/manager';
import DashboardItemSchema from './model';

class DashboardManager extends DefaultManagerMongo<MongoDashboardItem> {
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

    async getDashboardRelatedItems(relatedIds: string[]) {
        const objectIds = relatedIds.map((id) => new Types.ObjectId(id));

        const items = await this.model
            .find({ metaData: { $in: objectIds } })
            .populate('metaData')
            .lean()
            .exec();

        return groupBy(items, (item) => {
            const { type, metaData } = item;

            if (type === DashboardItemType.Chart || type === DashboardItemType.Iframe) {
                return (metaData as unknown as IMongoChart | IMongoIframe)._id.toString();
            }

            return metaData.templateId.toString();
        });
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
                $match: { ...query },
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

    async deleteDashboardItemByRelatedItem(dashboardItemId: string) {
        const objectId = new Types.ObjectId(dashboardItemId);

        return this.model.deleteMany({ metaData: objectId }).lean().exec();
    }
}

export default DashboardManager;
