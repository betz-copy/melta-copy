import config from '../../config';
import { DefaultManagerMongo } from '../../utils/mongo/manager';
import { NotFoundError } from '../error';
import { DashboardItem } from './interface';
import DashboardItemSchema from './model';

export class DashboardManager extends DefaultManagerMongo<DashboardItem> {
    constructor(workspaceId: string) {
        super(workspaceId, config.mongo.dashboardCollectionName, DashboardItemSchema);
    }

    async getDashboardItemById(dashboardItemId: string) {
        return (
            this.model
                .findById(dashboardItemId)
                // .populate({
                //     path: 'metaData.chartId',
                //     // get error:
                //     // {
                //     //     "type": "MissingSchemaError",
                //     //     "message": "Schema hasn't been registered for model \"iFrames\".\nUse mongoose.model(name, schema)"
                //     // }

                //     model: config.mongo.chartsCollectionName,
                //     options: { lean: true },
                // })
                .populate('metaData.iframeId')
                .orFail(new NotFoundError(`Dashboard item with id ${dashboardItemId} not found`))
                .lean()
                .exec()
        );
    }

    async createDashboardItem(dashboardItem: DashboardItem) {
        return this.model.create(dashboardItem);
    }

    async deleteDashboardItem(dashboardItemId: string) {
        return this.model.findByIdAndDelete(dashboardItemId).lean().exec();
    }
}
