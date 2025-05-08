import React, { useMemo } from 'react';
import { Card, Grid } from '@mui/material';
import { useQueryClient } from 'react-query';
import { StepComponentProps } from '../../../common/wizards';
import { TableMetaData } from '../../../interfaces/dashboard';
import { BlueTitle } from '../../../common/BlueTitle';
import { useWorkspaceStore } from '../../../stores/workspace';
import EntitiesTableOfTemplate, { EntitiesTableOfTemplateRef } from '../../../common/EntitiesTableOfTemplate';
import { IEntity } from '../../../interfaces/entities';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { filterModelToFilterOfGraph } from '../../Graph/GraphFilterToBackend';

const BodyComponent: React.FC<StepComponentProps<TableMetaData>> = ({ values }) => {
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const entitiesTableRef = React.useRef<EntitiesTableOfTemplateRef<IEntity>>(null);

    const { metadata } = useWorkspaceStore((state) => state.workspace);
    const { defaultRowHeight, defaultFontSize } = metadata.agGrid;
    const { headlineTitleFontSize } = metadata.mainFontSizes;

    const memoizedFilter = useMemo(() => {
        const { filter, templateId } = values;

        if (!templateId || !filter || Object.keys(filter).length === 0) return undefined;

        const graphFilters = filterModelToFilterOfGraph(filter);
        return graphFilters?.[templateId]?.filter;
    }, [values.templateId, values.filter]);

    return (
        <Grid item container width="100%" height="70%" alignItems="center" justifyContent="center" paddingTop="20px">
            {values.templateId && (
                <Card sx={{ width: '98%', height: 'fit-content', borderRadius: '7px', border: '1px #CCCFE5', gap: 2 }}>
                    <BlueTitle
                        title={values.name || ''}
                        component="h4"
                        variant="h4"
                        style={{ fontSize: headlineTitleFontSize, justifySelf: 'center', padding: '20px' }}
                    />
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
                        defaultFilter={memoizedFilter}
                        disableFilter
                    />
                </Card>
            )}
        </Grid>
    );
};

export { BodyComponent };
