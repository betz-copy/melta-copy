import { DashboardItemType, MongoDashboardItemPopulated } from '../interfaces/dashboard';
import { ISearchFilter } from '../interfaces/entity';

const getDashboardFilters = (dashboard: MongoDashboardItemPopulated): ISearchFilter | undefined => {
    if (dashboard.type === DashboardItemType.Iframe) return undefined;
    return dashboard.metaData.filter ? JSON.parse(dashboard.metaData.filter) : undefined;
};

export { getDashboardFilters };
