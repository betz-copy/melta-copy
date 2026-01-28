import { IMongoActivityLog } from '@packages/activity-log';
import config from '../../config';
import DefaultExternalServiceApi from '../../utils/express/externalService';

const { url, requestTimeout, baseRoute } = config.activityLogService;

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
    ): Promise<IMongoActivityLog[]> {
        const { data } = await this.api.get<IMongoActivityLog[]>(`${baseRoute}/${entityId}`, {
            params,
        });

        return data;
    }
}

export default ActivityLogService;
