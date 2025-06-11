import { Grid } from '@mui/material';
import i18next from 'i18next';
import React, { useMemo } from 'react';
import { useQueryClient } from 'react-query';
import { StepComponentProps } from '../../../common/wizards';
import { EntitiesTable } from '../../../common/wizards/excel/excelSteps/EntitiesTable';
import { ChartForm } from '../../../interfaces/dashboard';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { ChartGenerator } from '../../Charts/chartGenerator.tsx';
import { filterModelToFilterOfGraph } from '../../Graph/GraphFilterToBackend';

const BodyComponent: React.FC<StepComponentProps<ChartForm>> = ({ values }) => {
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const memoizedFilter = useMemo(() => {
        const { filter, templateId } = values;

        if (!templateId || !filter || Object.keys(filter).length === 0) return undefined;

        const graphFilters = filterModelToFilterOfGraph(filter);
        return graphFilters?.[templateId]?.filter;
    }, [values.templateId, values.filter]);

    if (!values.templateId) return null;

    return (
        <>
            <Grid container item height="100%" alignItems="center" justifyContent="center">
                <ChartGenerator formikValues={values} template={entityTemplates.get(values.templateId)!} filterRecord={values.filter} />
            </Grid>
            <Grid item width="98%">
                <EntitiesTable
                    rowModelType="infinite"
                    template={entityTemplates.get(values.templateId)!}
                    defaultExpanded={false}
                    title={i18next.t('charts.viewData')}
                    defaultFilter={memoizedFilter}
                    infiniteModeWithoutExpand
                    disableFilter
                    overrideSx={{
                        '&.MuiPaper-root': {
                            boxShadow: '0px -2px 10.15px 0px #1E277533',
                            borderTopLeftRadius: '13px',
                            borderTopRightRadius: '13px',
                        },
                    }}
                    ignoreType={false}
                />
            </Grid>
        </>
    );
};

export { BodyComponent };
