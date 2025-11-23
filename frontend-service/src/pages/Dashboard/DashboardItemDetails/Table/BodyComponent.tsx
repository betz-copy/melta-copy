import { Card, Grid, Typography, useTheme } from '@mui/material';
import React, { useMemo } from 'react';
import { useQueryClient } from 'react-query';
import { getDefaultFilterFromTemplate } from '../../../../common/EntitiesPage/TemplateTablesView';
import EntitiesTableOfTemplate, { EntitiesTableOfTemplateRef } from '../../../../common/EntitiesTableOfTemplate';
import { StepComponentProps } from '../../../../common/wizards';
import { TableForm } from '../../../../interfaces/dashboard';
import { IEntity } from '../../../../interfaces/entities';
import { IEntityTemplateMap } from '../../../../interfaces/entityTemplates';
import { useUserStore } from '../../../../stores/user';
import { useWorkspaceStore } from '../../../../stores/workspace';
import { getFilterModal } from '../../../../utils/agGrid/agGridToSearchEntitiesOfTemplateRequest';
import { useDebouncedFilter } from '../../../../utils/dashboard/useDebouncedFilter';
import { isWorkspaceAdmin } from '../../../../utils/permissions/instancePermissions';
import { isChildTemplate } from '../../../../utils/templates';
import { getRelevantEntityTemplate } from '../Chart/BodyComponent';

const BodyComponent: React.FC<StepComponentProps<TableForm & { _id?: string }>> = ({ values }) => {
    const theme = useTheme();
    const queryClient = useQueryClient();

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const entitiesTableRef = React.useRef<EntitiesTableOfTemplateRef<IEntity>>(null);

    const currentUser = useUserStore((state) => state.user);
    const workspace = useWorkspaceStore((state) => state.workspace);
    const isAdmin = isWorkspaceAdmin(currentUser?.permissions?.[workspace._id]);
    const currentUserKartoffelId = currentUser?.kartoffelId;
    const { defaultRowHeight, defaultFontSize } = workspace.metadata.agGrid;

    const template = getRelevantEntityTemplate(entityTemplates, values.templateId, values.childTemplateId);

    const childTemplateDefaultFilters = useMemo(
        () => getDefaultFilterFromTemplate(template, isChildTemplate(template), currentUserKartoffelId, currentUser.units, isAdmin),
        [values.templateId, values.childTemplateId, currentUserKartoffelId, currentUser.units, isAdmin, template],
    );
    const memoizedFilter = useDebouncedFilter(values, queryClient, 500);
    const allFilters = useMemo(() => getFilterModal(memoizedFilter, childTemplateDefaultFilters), [memoizedFilter, childTemplateDefaultFilters]);

    return (
        <Grid container width="100%" height="70%" alignItems="center" justifyContent="center" paddingTop="20px">
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
                        template={template}
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
                        externalId={values._id ? { id: values._id, type: 'dashboard' } : undefined}
                    />
                </Card>
            )}
        </Grid>
    );
};

export default BodyComponent;
