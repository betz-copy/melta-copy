import { ISearchFilter } from '@packages/entity';
import { DashboardItemType, MongoDashboardItemPopulated } from './types';

const getDashboardFilters = (dashboard: MongoDashboardItemPopulated): ISearchFilter | undefined => {
    if (dashboard.type === DashboardItemType.Iframe) return undefined;
    return dashboard.metaData.filter ? JSON.parse(dashboard.metaData.filter) : undefined;
};

export { getDashboardFilters };
