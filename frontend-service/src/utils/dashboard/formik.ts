import i18next from 'i18next';
import * as Yup from 'yup';
import { IChartType, IColumnOrLineMetaData, IPermission } from '../../interfaces/charts';
import { ChartForm, DashboardItem, DashboardItemType, TableForm } from '../../interfaces/dashboard';
import { IGraphFilterBodyBatch } from '../../interfaces/entities';
import { IEntityTemplateMap } from '../../interfaces/entityTemplates';
import { IFrame } from '../../interfaces/iFrames';
import { filterModelToFilterOfGraph } from '../../pages/Graph/GraphFilterToBackend';

export const tableDetailsSchema = Yup.object().shape({
    name: Yup.string().required(i18next.t('validation.required')),
    description: Yup.string().required(i18next.t('validation.required')),
});

export const dashboardInitialValues = {
    table: { templateId: '', name: '', description: '', columns: [] } as TableForm,
    iframe: { name: '', url: '' } as IFrame,
    chart: {
        name: '',
        description: '',
        type: IChartType.Line,
        metaData: {
            xAxis: { field: '', title: '' },
            yAxis: { field: '', title: '' },
        } as IColumnOrLineMetaData,
        permission: IPermission.Private,
    } as ChartForm,
};

export const getTemplateProperties = (entityTemplates: IEntityTemplateMap, templateId: string | null) => {
    const entityTemplate = entityTemplates.get(templateId!);
    const entityTemplateFields = entityTemplate && Object.keys(entityTemplate.properties.properties);
    return entityTemplateFields || [];
};

export const tableMetaDataToBackend = (tableData: TableForm): DashboardItem => ({
    type: DashboardItemType.Table,
    metaData: {
        ...tableData,
        filter:
            tableData.filter && Object.keys(tableData.filter).length > 0
                ? filterModelToFilterOfGraph(tableData.filter)[tableData.templateId].filter
                : undefined,
    },
});

export const filterDocumentToFilterBackend = (templateId: string, filter?: IGraphFilterBodyBatch) =>
    filter && Object.keys(filter).length > 0 ? filterModelToFilterOfGraph(filter)[templateId].filter : undefined;
