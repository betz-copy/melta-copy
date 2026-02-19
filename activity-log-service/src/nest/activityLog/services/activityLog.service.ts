import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { IActivityLog, IMongoActivityLog } from '@packages/activity-log';
import { ClsService, DefaultMongoService, MongoError, MongoModelFactory, MongoQueryBuilder } from '@packages/utils';
import { Connection } from 'mongoose';
import config from '../../../config';
import { GetActivityQueryDto } from '../dto/activityLog.dto';
import { ActivityLog, ActivityLogSchema } from '../schemas/activityLog.schema';

const { activitiesCollectionName, mongoDuplicateKeyErrorCode, mongoDuplicateErrorName } = config.mongo;

@Injectable()
export class ActivityLogService extends DefaultMongoService<ActivityLog> {
    constructor(@InjectConnection() connection: Connection, cls: ClsService, mongoModelFactory: MongoModelFactory) {
        super(connection, cls, activitiesCollectionName, ActivityLogSchema, mongoModelFactory, ActivityLog.name);
    }

    public async getActivity(entityId: string, queryDto: GetActivityQueryDto): Promise<IMongoActivityLog[]> {
        const { limit, skip, fieldsSearch, usersSearch, actions, searchText, startDateRange, endDateRange } = queryDto;

        const queryBuilder = new MongoQueryBuilder();
        queryBuilder
            .where('entityId', entityId)
            .whereIn('action', actions, Boolean(actions?.length))
            .searchText(searchText, undefined, Boolean(searchText))
            .orWhere(
                [
                    {
                        'metadata.updatedFields': {
                            $elemMatch: { fieldName: { $in: fieldsSearch } },
                        },
                    },
                ],
                Boolean(fieldsSearch?.length),
            )
            .orWhere([{ userId: { $in: usersSearch } }], Boolean(usersSearch?.length))
            .whereGreaterThanOrEqual('timestamp', startDateRange, Boolean(startDateRange))
            .whereLessThanOrEqual('timestamp', endDateRange, Boolean(endDateRange));

        const query = queryBuilder.build();

        return this.model.find(query).limit(limit).skip(skip).lean<IMongoActivityLog[]>().exec();
    }

    public async createActivity(activityLog: IActivityLog): Promise<ActivityLog | null> {
        try {
            return await this.model.create(activityLog);
        } catch (error) {
            const mongoError = error as MongoError;
            if (mongoError.name === mongoDuplicateErrorName && mongoError.code === mongoDuplicateKeyErrorCode)
                return this.model.findOne({ entityId: activityLog.entityId, action: new RegExp(activityLog.action) }).exec();

            throw error;
        }
    }
}
