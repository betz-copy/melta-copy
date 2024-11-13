import { Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { ISteps } from '.';
import { environment } from '../../../globals';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import EntitiesTableOfTemplate from '../../EntitiesTableOfTemplate';

const { defaultRowHeight, defaultFontSize } = environment.agGrid;

export const AllEntities: React.FC<{
    allEntities: { properties: Record<string, any> }[];
    template: IMongoEntityTemplatePopulated;
    steps: ISteps;
}> = ({ allEntities, template, steps }) => {
    if (steps.status === 'stepsAfterFileUpload')
        return (
            <Grid container direction="column" padding="5px">
                <Grid sx={{ marginTop: '10px', marginBottom: '30px', width: '100%' }}>
                    <EntitiesTableOfTemplate
                        template={template}
                        getRowId={(currentEntity) => currentEntity.properties._id}
                        getEntityPropertiesData={(currentEntity) => currentEntity.properties}
                        rowModelType="clientSide"
                        rowHeight={defaultRowHeight}
                        fontSize={`${defaultFontSize}px`}
                        rowData={allEntities}
                        saveStorageProps={{
                            shouldSaveFilter: false,
                            shouldSaveWidth: false,
                            shouldSaveVisibleColumns: false,
                            shouldSaveSorting: false,
                            shouldSaveColumnOrder: false,
                            shouldSavePagination: false,
                            shouldSaveScrollPosition: false,
                        }}
                    />
                </Grid>
            </Grid>
        );

    return <Typography>{i18next.t('wizard.entity.LoadEntitiesFromExcel.tableApproved')}</Typography>;
};
