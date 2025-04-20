import { ActivityLogService } from '../../externalServices/activityLogService';
import { UserService } from '../../externalServices/userService';
import DefaultManagerProxy from '../../utils/express/manager';

export class ActivityLogManager extends DefaultManagerProxy<ActivityLogService> {
    constructor(workspaceId: string) {
        super(new ActivityLogService(workspaceId));
    }

    async getActivity(
        entityId: string,
        params: Partial<{
            limit: number;
            skip: number;
            actions: string[];
            searchText: string;
            fieldsSearch: string[];
            startDateRange: Date;
            endDateRange: Date;
        }>,
    ) {
        const newParams: Partial<{
            limit: number;
            skip: number;
            actions: string[];
            searchText: string;
            fieldsSearch: string[];
            usersSearch: string[];
            startDateRange: Date;
            endDateRange: Date;
        }> = { ...params };
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
