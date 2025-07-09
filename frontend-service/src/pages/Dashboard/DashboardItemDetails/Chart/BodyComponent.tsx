import { Grid } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { useQueryClient } from 'react-query';
import { StepComponentProps } from '../../../../common/wizards';
import { EntitiesTable } from '../../../../common/wizards/excel/excelSteps/EntitiesTable';
import { ChartForm } from '../../../../interfaces/dashboard';
import { IEntityTemplateMap } from '../../../../interfaces/entityTemplates';
import { useDebouncedFilter } from '../../../../utils/dashboard/useDebouncedFilter';
import { ChartGenerator } from '../../../Charts/chartGenerator.tsx';
import { ICategoryMap } from '../../../../interfaces/categories';
import { IEntityChildTemplateMap } from '../../../../interfaces/entityChildTemplates';
import { transformChild } from '../../../Category';
import { getDefaultFilterFromTemplate } from '../../../../common/EntitiesPage/TemplateTablesView';
import { getFilterModal } from '../../../../utils/agGrid/agGridToSearchEntitiesOfTemplateRequest';

export const getRelevantEntityTemplate = (entityTemplates, templateId: string, childTemplateId?: string) => {
    const queryClient = useQueryClient();
    const categories = queryClient.getQueryData<ICategoryMap>('getCategories')!;
    const childEntityTemplates = queryClient.getQueryData<IEntityChildTemplateMap>('getChildEntityTemplates')!;

    const childEntityTemplate = childTemplateId ? childEntityTemplates.get(childTemplateId) : undefined;
    const fatherEntityTemplate = entityTemplates.get(templateId)!;
    return childEntityTemplate
        ? transformChild(childEntityTemplate, fatherEntityTemplate, categories.get(childEntityTemplate.categories[0])!)
        : fatherEntityTemplate;
};

const BodyComponent: React.FC<StepComponentProps<ChartForm>> = ({ values }) => {
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const template = getRelevantEntityTemplate(entityTemplates, values.templateId, values.childTemplateId);

    const memoizedFilter = useDebouncedFilter(values, queryClient, 500);
    const childTemplateFilter = getDefaultFilterFromTemplate(template, !!values.childTemplateId);
    const allFilters = getFilterModal(memoizedFilter, childTemplateFilter);

    if (!values.templateId) return null;

    return (
        <Grid container direction="column" height="100%" alignContent="center">
            <Grid container item flexGrow={1} alignItems="center" justifyContent="center">
                <ChartGenerator formikValues={values} template={template} />
            </Grid>
            <Grid item width="98%" sx={{ mx: 'auto' }}>
                <EntitiesTable
                    rowModelType="infinite"
                    template={template}
                    defaultExpanded={false}
                    title={i18next.t('charts.viewData')}
                    defaultFilter={allFilters}
                    infiniteModeWithoutExpand
                    disableFilter
                    overrideSx={{
                        '&.MuiPaper-root': {
                            boxShadow: '0px -2px 10.15px 0px #1E277533',
                            borderRadius: '13px 13px 0 0',
                        },
                    }}
                    ignoreType={false}
                />
            </Grid>
        </Grid>
    );
};

export default BodyComponent;
