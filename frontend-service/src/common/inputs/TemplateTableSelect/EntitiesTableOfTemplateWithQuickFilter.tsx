import { Box, Grid, TextField } from '@mui/material';
import i18next from 'i18next';
import React, { useState } from 'react';
import { IEntity } from '../../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import EntitiesTableOfTemplate from '../../EntitiesTableOfTemplate';

const EntitiesTableOfTemplateWithQuickFilter: React.FC<{
    entityTemplate: IMongoEntityTemplatePopulated;
    onRowSelected: (entity: IEntity) => void;
}> = ({ entityTemplate, onRowSelected }) => {
    const [quickFilterText, setQuickFilterText] = useState('');

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'stretch' }}>
            <div>
                <Grid container justifyContent="center">
                    <Grid item xs={8}>
                        <TextField
                            value={quickFilterText}
                            onChange={(e) => setQuickFilterText(e.target.value)}
                            placeholder={i18next.t('searchLabel')}
                            variant="outlined"
                            fullWidth
                        />
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
                    minColumnWidth={50}
                />
            </div>
        </Box>
    );
};

export default EntitiesTableOfTemplateWithQuickFilter;
