import { DashboardItemType, MongoDashboardItemPopulated } from '../interfaces/dashboard';
import { ISearchFilter } from '../interfaces/entity';

const getDashboardFilters = (dashboard: MongoDashboardItemPopulated): ISearchFilter | undefined => {
    switch (dashboard.type) {
        case DashboardItemType.Table:
        case DashboardItemType.Chart:
            return dashboard.metaData.filter ? JSON.parse(dashboard.metaData.filter) : undefined;
        default:
            return undefined;
    }
};

export { getDashboardFilters };
