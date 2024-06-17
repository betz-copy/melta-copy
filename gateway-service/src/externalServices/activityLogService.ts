import config from '../config';
import DefaultExternalServiceApi from '../utils/express/externalService';

const {
    activityLogService: { url, baseRoute, requestTimeout },
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
    action: 'CREATE_ENTITY' | 'DISABLE_ENTITY' | 'ACTIVATE_ENTITY' | 'VIEW_ENTITY';
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

export class ActivityLogService extends DefaultExternalServiceApi {
    constructor(dbName: string) {
        super(dbName, { baseURL: `${url}${baseRoute}`, timeout: requestTimeout });
    }

    async createActivityLog(activityLog: Omit<IActivityLog, '_id'>) {
        const { data } = await this.api.post('/', activityLog);
        return data;
    }
}
