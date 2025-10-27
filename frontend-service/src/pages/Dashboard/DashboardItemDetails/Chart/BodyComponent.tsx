import { Grid } from '@mui/material';
import i18next from 'i18next';
import React, { useMemo } from 'react';
import { useQueryClient } from 'react-query';
import { getDefaultFilterFromTemplate } from '../../../../common/EntitiesPage/TemplateTablesView';
import { StepComponentProps } from '../../../../common/wizards';
import { EntitiesTable } from '../../../../common/wizards/excel/excelSteps/EntitiesTable';
import { IChildTemplateMap, IChildTemplatePopulated } from '../../../../interfaces/childTemplates';
import { ChartForm } from '../../../../interfaces/dashboard';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { useUserStore } from '../../../../stores/user';
import { getFilterModal } from '../../../../utils/agGrid/agGridToSearchEntitiesOfTemplateRequest';
import { useDebouncedFilter } from '../../../../utils/dashboard/useDebouncedFilter';
import { ChartGenerator } from '../../../Charts/chartGenerator.tsx';

export const getRelevantEntityTemplate = (
    entityTemplates: IEntityTemplateMap,
    templateId: string,
    childTemplateId?: string,
): IChildTemplatePopulated | IMongoEntityTemplatePopulated => {
    const queryClient = useQueryClient();
    const childTemplates = queryClient.getQueryData<IChildTemplateMap>('getChildTemplates')!;

    const childEntityTemplate = childTemplateId ? childTemplates.get(childTemplateId) : undefined;
    const fatherEntityTemplate = entityTemplates.get(templateId)!;
    return childEntityTemplate || fatherEntityTemplate;
};

const BodyComponent: React.FC<StepComponentProps<ChartForm>> = ({ values }) => {
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const template = getRelevantEntityTemplate(entityTemplates, values.templateId, values.childTemplateId);

    const currentUser = useUserStore((state) => state.user);
    const currentUserKartoffelId = currentUser?.kartoffelId;

    const childTemplateDefaultFilters = useMemo(
        () => getDefaultFilterFromTemplate(template, !!values.childTemplateId, currentUserKartoffelId),
        [values.templateId, values.childTemplateId, currentUserKartoffelId],
    );
    const memoizedFilter = useDebouncedFilter(values, queryClient, 500);
    const allFilters = useMemo(() => getFilterModal(memoizedFilter, childTemplateDefaultFilters), [memoizedFilter, childTemplateDefaultFilters]);

    if (!values.templateId) return null;

    return (
        <Grid container direction="column" height="100%" alignContent="center">
            <Grid container flexGrow={1} alignItems="center" justifyContent="center">
                <ChartGenerator formikValues={values} template={template} />
            </Grid>
            <Grid width="98%" sx={{ mx: 'auto' }}>
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
