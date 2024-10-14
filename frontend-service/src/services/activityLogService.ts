import axios from '../axios';
import { environment } from '../globals';

const { activityLog } = environment.staticConfigs.api;

interface IBaseActivityLog {
    _id: string;
    timestamp: Date;
    entityId: string;
    userId: string;
}

interface IEmptyMetadata extends IBaseActivityLog {
    action: 'CREATE_ENTITY' | 'DISABLE_ENTITY' | 'ACTIVATE_ENTITY' | 'VIEW_ENTITY';
    metadata: {};
}

interface IRelationshipMetadata extends IBaseActivityLog {
    action: 'DELETE_RELATIONSHIP' | 'CREATE_RELATIONSHIP';
    metadata: { relationshipId: string; relationshipTemplateId: string; entityId: string };
}

interface IDuplicateEntityMetadata extends IBaseActivityLog {
    action: 'DUPLICATE_ENTITY';
    metadata: { entityIdDuplicatedFrom: string };
}

interface IUpdateEntityMetadata extends IBaseActivityLog {
    action: 'UPDATE_ENTITY';
    metadata: { updatedFields: [{ fieldName: string; oldValue: any; newValue: any }] };
}

export type IActivityLog = IEmptyMetadata | IRelationshipMetadata | IDuplicateEntityMetadata | IUpdateEntityMetadata;

const getActivityLogRequest = async (entityId: string, limit: number, skip: number, actions?: string[]) => {
    const { data } = await axios.get<IActivityLog[]>(`${activityLog}/${entityId}`, { params: { limit, skip, actions } });
    return data;
};

export { getActivityLogRequest };
