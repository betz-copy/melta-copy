import i18next from 'i18next';
import * as Yup from 'yup';
import React from 'react';
import { DashboardItem, DashboardItemType, TableMetaData } from '../../interfaces/dashboard';
import { IEntityTemplateMap } from '../../interfaces/entityTemplates';
import { filterModelToFilterOfGraph } from '../../pages/Graph/GraphFilterToBackend';
import { IGraphFilterBodyBatch } from '../../interfaces/entities';

export const tableDetailsSchema = Yup.object().shape({
    name: Yup.string().required(i18next.t('validation.required')),
    description: Yup.string().required(i18next.t('validation.required')),
});

export const ashboardInitialVlaues = (entityTemplates: IEntityTemplateMap, templateId?: string) => {
    const entityTemplate = entityTemplates.get(templateId!);
    const entityTemplateFields = entityTemplate && Object.keys(entityTemplate.properties.properties);

    return { table: { templateId: '', name: '', description: '', columns: [], columnsOrder: [], filter: {} } as TableMetaData };
};

export const getTemplateProperties = (entityTemplates: IEntityTemplateMap, templateId: string | null) => {
    const entityTemplate = entityTemplates.get(templateId!);
    const entityTemplateFields = entityTemplate && Object.keys(entityTemplate.properties.properties);
    return entityTemplateFields || [];
};

export const dashboardInitialValues = {
    table: { templateId: '', name: '', description: '', columns: [], columnsOrder: [], filter: {} } as TableMetaData,
};

export const tableMetaDataToBackend = (tableData: TableMetaData): DashboardItem => ({
    type: DashboardItemType.Table,
    metaData: {
        ...tableData,
        filter:
            tableData.filter && Object.keys(tableData.filter).length > 0
                ? JSON.stringify(filterModelToFilterOfGraph(tableData.filter)[tableData.templateId].filter)
                : undefined,
    },
});

export const filterDocumentToFilterBackend = (templateId: string, filter?: IGraphFilterBodyBatch) =>
    filter && Object.keys(filter).length > 0 ? JSON.stringify(filterModelToFilterOfGraph(filter)[templateId].filter) : undefined;

// export const tableMetaDataToBackend = (tableData: TableMetaData): DashboardItem => {
//     console.log({ tableFilter: tableData.filter, hasfilter: tableData.filter && Object.keys(tableData.filter).length > 0 });

//     const resolvedFilter =
//         tableData.filter && Object.keys(tableData.filter).length > 0
//             ? filterModelToFilterOfGraph(tableData.filter)[tableData.templateId]?.filter
//             : undefined;

//     console.log({ resolvedFilter });

//     return {
//         type: DashboardItemType.Table,
//         metaData: {
//             ...tableData,
//             filter: resolvedFilter,
//         },
//     };
// };
