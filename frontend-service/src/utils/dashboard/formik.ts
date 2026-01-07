import i18next from 'i18next';
import { QueryClient } from 'react-query';
import * as Yup from 'yup';
import { filtersSchema } from '../../common/wizards/entityTemplate/AddFields';
import { IFilterTemplate } from '../../common/wizards/entityTemplate/commonInterfaces';
import { filterTemplateToSearchFilter } from '../../common/wizards/entityTemplate/RelationshipReference/TemplateFilterToBackend';
import { IChartType, IColumnOrLineMetaData, IPermission } from '../../interfaces/charts';
import { IChildTemplateMap } from '../../interfaces/childTemplates';
import { ChartForm, DashboardItemType, TableForm, TableItemToBackend } from '../../interfaces/dashboard';
import { FilterLogicalOperator } from '../../interfaces/entities';
import { IEntityTemplateMap } from '../../interfaces/entityTemplates';
import { IFrame } from '../../interfaces/iFrames';

export const tableDetailsSchema = Yup.object().shape({
    name: Yup.string().required(i18next.t('validation.required')),
    description: Yup.string(),
    templateId: Yup.string().required(i18next.t('validation.required')),
});

export const tableFilterDetailsSchema = Yup.object().shape({
    columns: Yup.array().of(Yup.string()).min(1, i18next.t('validation.atLeastOne')).required(i18next.t('validation.required')),
    filter: filtersSchema,
});

export const dashboardInitialValues = {
    table: { _id: undefined, templateId: '', name: '', description: '', columns: [] } as TableForm,
    iframe: { name: '', url: '' } as IFrame,
    chart: {
        _id: '',
        name: '',
        description: '',
        type: IChartType.Line,
        metaData: {
            xAxis: { field: '', title: '' },
            yAxis: { field: '', title: '' },
        } as IColumnOrLineMetaData,
        permission: IPermission.Private,
        createdBy: '',
        templateId: '',
    } as ChartForm,
};

export const getTemplateProperties = (entityTemplates: IEntityTemplateMap | IChildTemplateMap, templateId: string | null) => {
    const entityTemplate = entityTemplates.get(templateId!);
    const entityTemplateFields = entityTemplate && Object.keys(entityTemplate.properties.properties);
    return entityTemplateFields || [];
};

export const tableMetaDataToBackend = (tableData: TableForm, queryClient: QueryClient): TableItemToBackend => {
    const { childTemplateId, _id, ...restTableData } = tableData;
    return {
        type: DashboardItemType.Table,
        metaData: {
            ...restTableData,
            childTemplateId: childTemplateId || undefined,
            filter: tableData.filter ? filterTemplateToSearchFilter(tableData.filter, tableData.templateId, queryClient) : undefined,
        },
    };
};

export const filterDocumentToFilterBackend = (
    templateId: string,
    filter: IFilterTemplate[] | undefined,
    queryClient: QueryClient,
    andOr: FilterLogicalOperator = FilterLogicalOperator.AND,
) => (filter ? filterTemplateToSearchFilter(filter, templateId, queryClient, andOr) : undefined);
