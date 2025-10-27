import config from '../../config';
import DefaultExternalServiceApi from '../../utils/express/externalService';
import { IActivityLog } from './interface';

const {
    activityLogService: { url, requestTimeout, baseRoute },
} = config;

class ActivityLogService extends DefaultExternalServiceApi {
    constructor(workspaceId: string) {
        super(workspaceId, { baseURL: url, timeout: requestTimeout });
    }

    async getActivity(
        entityId: string,
        params: Partial<{
            limit: number;
            skip: number;
            actions: string[];
            searchText: string;
            fieldsSearch: string[];
            usersSearch: string[];
            startDateRange: Date;
            endDateRange: Date;
        }>,
    ): Promise<IActivityLog[]> {
        const { data } = await this.api.get<IActivityLog[]>(`${baseRoute}/${entityId}`, {
            params,
        });

        return data;
    }
}

export default ActivityLogService;
