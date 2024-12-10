import { Box, Grid } from '@mui/material';
import React from 'react';
import { useHistoryState } from 'wouter/use-browser-location';
import EntitiesTableOfTemplate from '../../common/EntitiesTableOfTemplate';
import { environment } from '../../globals';

const { defaultRowHeight, defaultFontSize } = environment.agGrid;

const ChartPage: React.FC = () => {
    const state = useHistoryState();

    return (
        <Grid container marginTop={80}>
            <Box sx={{ marginBottom: '30px', width: '180%' }}>
                <EntitiesTableOfTemplate
                    template={state.entityTemplate}
                    getRowId={(currentEntity) => currentEntity.properties._id}
                    getEntityPropertiesData={(currentEntity) => currentEntity.properties}
                    rowModelType="infinite"
                    rowHeight={defaultRowHeight}
                    fontSize={`${defaultFontSize}px`}
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
                />
            </Box>
        </Grid>
    );
};

export default ChartPage;
