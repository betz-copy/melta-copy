import { DefaultManagerMongo, IActivityLog } from '@microservices/shared';
import { FilterQuery } from 'mongoose';
import config from '../../config';
import ActivityLogSchema from './model';

export default class ActivityLogManager extends DefaultManagerMongo<IActivityLog> {
    constructor(workspaceId: string) {
        super(workspaceId, config.mongo.activitiesCollectionName, ActivityLogSchema);
    }

    async getActivity(
        entityId: string,
        limit: number,
        skip: number,
        fieldsSearch: string[],
        usersSearch: string[],
        actions?: string[],
        searchText?: string,
        startDateRange?: Date,
        endDateRange?: Date,
    ) {
        const regActions = actions?.map((action) => new RegExp(action));
        const searchRegex = { $regex: searchText, $options: 'i' };
        const query: FilterQuery<IActivityLog> = {};
        const isSearchTextNotEmpty = searchText && searchText !== '';

        if (actions) {
            query.action = { $in: regActions };
        }

        if (isSearchTextNotEmpty || fieldsSearch.length || usersSearch.length) query.$or = [];

        if (isSearchTextNotEmpty) {
            query.$or!.push({
                'metadata.updatedFields': {
                    $elemMatch: {
                        $or: [{ fieldName: searchRegex }, { oldValue: searchRegex }, { newValue: searchRegex }],
                    },
                },
            });
        }

        if (fieldsSearch.length) {
            const elemMatch = { fieldName: { $in: fieldsSearch } };

            if (query.$or![0] && query.$or![0]['metadata.updatedFields']) {
                query.$or![0]['metadata.updatedFields'].$elemMatch.$or.push(elemMatch);
            } else {
                query.$or!.push({
                    'metadata.updatedFields': {
                        $elemMatch: elemMatch,
                    },
                });
            }
        }

        if (usersSearch.length) {
            query.$or!.push({ userId: { $in: usersSearch } });
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
