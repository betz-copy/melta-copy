import { FilterQuery } from 'mongoose';
import config from '../../config';
import { DefaultManagerMongo } from '../../utils/mongo/manager';
import { IActivityLog } from './interface';
import { ActivityLogSchema } from './model';

export default class ActivityLogManager extends DefaultManagerMongo<IActivityLog> {
    constructor(workspaceId: string) {
        super(workspaceId, config.mongo.activitiesCollectionName, ActivityLogSchema);
    }

    async getActivity(
        entityId: string,
        limit: number,
        skip: number,
        fieldsSearch: string[],
        actions?: string[],
        searchText?: string,
        startDateRange?: Date,
        endDateRange?: Date,
    ) {
        const regActions = actions?.map((action) => new RegExp(action));
        const searchRegex = { $regex: searchText, $options: 'i' };
        const query: FilterQuery<IActivityLog> = {};

        if (actions) {
            query.action = { $in: regActions };
        }

        if (searchText && searchText !== '') {
            query['metadata.updatedFields'] = {
                $elemMatch: {
                    $or: [{ fieldName: searchRegex }, { oldValue: searchRegex }, { newValue: searchRegex }],
                },
            };
        }

        if (fieldsSearch.length) {
            if (query['metadata.updatedFields']) {
                query['metadata.updatedFields'].$elemMatch.$or.push({ fieldName: { $in: fieldsSearch } });
            } else {
                query['metadata.updatedFields'] = {
                    $elemMatch: {
                        fieldName: { $in: fieldsSearch },
                    },
                };
            }
        }

        if (startDateRange && endDateRange) {
            query.timestamp = { $gte: startDateRange, $lte: endDateRange };
        } else {
            if (startDateRange) query.timestamp = { $gte: startDateRange };
            if (endDateRange) query.timestamp = { $lte: endDateRange };
        }

        return this.model
            .find({ entityId, ...query })
            .limit(limit)
            .skip(skip)
            .exec();
    }

    async createActivity(activityLog: IActivityLog) {
        let createValue;
        try {
            createValue = await this.model.create(activityLog);
        } catch (error: any) {
            if (error.name === 'MongoServerError' && (error as any).code === 11000) {
                return this.model.findOne({ entityId: activityLog.entityId, action: new RegExp(activityLog.action) });
            }
            throw error;
        }
        return createValue;
    }
}
