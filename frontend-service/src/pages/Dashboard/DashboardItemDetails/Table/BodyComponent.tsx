import { Card, Grid, Typography, useTheme } from '@mui/material';
import React from 'react';
import { useQueryClient } from 'react-query';
import EntitiesTableOfTemplate, { EntitiesTableOfTemplateRef } from '../../../../common/EntitiesTableOfTemplate';
import { StepComponentProps } from '../../../../common/wizards';
import { TableForm } from '../../../../interfaces/dashboard';
import { IEntity } from '../../../../interfaces/entities';
import { IEntityTemplateMap } from '../../../../interfaces/entityTemplates';
import { useWorkspaceStore } from '../../../../stores/workspace';
import { getDefaultFilterFromTemplate } from '../../../../common/EntitiesPage/TemplateTablesView';
import { getRelevantEntityTemplate } from '../Chart/BodyComponent';
import { useDebouncedFilter } from '../../../../utils/dashboard/useDebouncedFilter';
import { getFilterModal } from '../../../../utils/agGrid/agGridToSearchEntitiesOfTemplateRequest';

const BodyComponent: React.FC<StepComponentProps<TableForm>> = ({ values }) => {
    const theme = useTheme();
    const queryClient = useQueryClient();

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const entitiesTableRef = React.useRef<EntitiesTableOfTemplateRef<IEntity>>(null);

    const { metadata } = useWorkspaceStore((state) => state.workspace);
    const { defaultRowHeight, defaultFontSize } = metadata.agGrid;

    const template = getRelevantEntityTemplate(entityTemplates, values.templateId, values.childTemplateId);

    const childTemplateFilter = getDefaultFilterFromTemplate(template, !!values.childTemplateId);
    const memoizedFilter = useDebouncedFilter(values, queryClient, 500);
    const allFilters = getFilterModal(memoizedFilter, childTemplateFilter);

    return (
        <Grid item container width="100%" height="70%" alignItems="center" justifyContent="center" paddingTop="20px">
            {values.templateId && (
                <Card sx={{ width: '98%', height: 'fit-content', borderRadius: '7px', border: '1px #CCCFE5', gap: 2 }}>
                    <Typography variant="h5" fontWeight="450" color={theme.palette.primary.main} sx={{ textAlign: 'center', padding: '20px' }}>
                        {values.name || ''}
                    </Typography>

                    {values.description && (
                        <Typography variant="subtitle1" color={theme.palette.primary.main} sx={{ textAlign: 'center', mb: 2 }}>
                            {values.description}
                        </Typography>
                    )}

                    <EntitiesTableOfTemplate
                        ref={entitiesTableRef}
                        template={entityTemplates.get(values.templateId)!}
                        getRowId={(currentEntity) => currentEntity.properties._id}
                        getEntityPropertiesData={(currentEntity) => currentEntity.properties}
                        rowHeight={defaultRowHeight}
                        fontSize={`${defaultFontSize}px`}
                        rowModelType="infinite"
                        saveStorageProps={{
                            shouldSaveFilter: false,
                            shouldSaveWidth: false,
                            shouldSaveVisibleColumns: false,
                            shouldSaveSorting: false,
                            shouldSaveColumnOrder: false,
                            shouldSavePagination: false,
                            shouldSaveScrollPosition: false,
                        }}
                        showNavigateToRowButton={false}
                        editable={false}
                        defaultFilter={allFilters}
                        disableFilter
                        columnsToShow={values.columns}
                    />
                </Card>
            )}
        </Grid>
    );
};

export default BodyComponent;
