import axios from 'axios';
import config from '../config';

const {
    activityLog: { uri, baseRoute, requestTimeout },
} = config;

export interface IUpdatedFields {
    fieldName: string;
    oldValue: any;
    newValue: any;
}

interface IBaseActivityLog {
    timestamp: Date;
    entityId: string;
    userId: string;
    _id: string;
}

interface IEmptyMetadata extends IBaseActivityLog {
    action: 'CREATE_ENTITY' | 'DISABLE_ENTITY' | 'ACTIVATE_ENTITY';
    metadata: {};
}

interface IRelationshipMetadata extends IBaseActivityLog {
    action: 'DELETE_RELATIONSHIP' | 'CREATE_RELATIONSHIP';
    metadata: { relationshipId: string; relationshipTemplateId: string; entityId: string };
}

interface IUpdateEntityMetadata extends IBaseActivityLog {
    action: 'UPDATE_ENTITY';
    metadata: { updatedFields: IUpdatedFields[] };
}

export type IActivityLog = IEmptyMetadata | IRelationshipMetadata | IUpdateEntityMetadata;

export class ActivityLogManagerService {
    private static ActivityLogManagerApi = axios.create({ baseURL: uri, timeout: requestTimeout });

    static async createActivityLog(activityLog: Omit<IActivityLog, '_id'>) {
        const { data } = await this.ActivityLogManagerApi.post(baseRoute, activityLog);
        return data;
    }
}
