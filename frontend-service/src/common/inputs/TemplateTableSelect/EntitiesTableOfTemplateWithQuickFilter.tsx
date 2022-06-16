import React, { useState } from 'react';
import { Box, Grid } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import _debounce from 'lodash.debounce';
import { IEntity } from '../../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import EntitiesTableOfTemplate from '../../EntitiesTableOfTemplate';
import SearchInput from '../SearchInput';

const EntitiesTableOfTemplateWithQuickFilter: React.FC<{
    entityTemplate: IMongoEntityTemplatePopulated;
    onRowSelected: (entity: IEntity) => void;
    hideNonPreview?: boolean;
}> = ({ entityTemplate, onRowSelected, hideNonPreview }) => {
    const [quickFilterText, setQuickFilterText] = useState('');
    const setQuickFilterTextDebounced = _debounce(setQuickFilterText, 1000);

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'stretch' }}>
            <div>
                <Grid container justifyContent="center">
                    <Grid item xs={8}>
                        <SearchInput onChange={setQuickFilterTextDebounced} endAdornmentChildren={<SearchIcon />} />
                    </Grid>
                </Grid>
            </div>
            <div>
                <EntitiesTableOfTemplate
                    template={entityTemplate}
                    showNavigateToRowButton={false}
                    onRowSelected={onRowSelected}
                    getRowId={(entity) => entity.properties._id}
                    getEntityPropertiesData={(entity) => entity.properties}
                    rowModelType="serverSide"
                    quickFilterText={quickFilterText}
                    height="250px"
                    rowHeight={25}
                    fontSize="14px"
                    minColumnWidth={200}
                    hideNonPreview={hideNonPreview}
                />
            </div>
        </Box>
    );
};

export default EntitiesTableOfTemplateWithQuickFilter;
