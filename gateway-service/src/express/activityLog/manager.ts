import ActivityLogService from '../../externalServices/activityLogService';
import { SearchParams } from '../../externalServices/activityLogService/interface';
import UserService from '../../externalServices/userService';
import DefaultManagerProxy from '../../utils/express/manager';

class ActivityLogManager extends DefaultManagerProxy<ActivityLogService> {
    constructor(workspaceId: string) {
        super(new ActivityLogService(workspaceId));
    }

    async getActivity(entityId: string, params: SearchParams) {
        const newParams: SearchParams & Partial<{ usersSearch: string[] }> = { ...params };

        if (params.searchText) {
            const { count } = await UserService.searchUsers({ limit: 2, search: params.searchText });

            if (count) {
                const { users } = await UserService.searchUsers({ limit: count, search: params.searchText });

                newParams.usersSearch = users.map((user) => user._id);
            }
        }

        return this.service.getActivity(entityId, newParams);
    }
}

export default ActivityLogManager;
