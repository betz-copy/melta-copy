import { IMongoActivityLog } from '@microservices/shared-interfaces';
import axios from '../axios';
import { environment } from '../globals';

const { activityLog } = environment.api;

const getActivityLogRequest = async (entityId: string, limit: number, skip: number, actions?: string[]) => {
    const { data } = await axios.get<IMongoActivityLog[]>(`${activityLog}/${entityId}`, { params: { limit, skip, actions } });
    return data;
};

export { getActivityLogRequest };
