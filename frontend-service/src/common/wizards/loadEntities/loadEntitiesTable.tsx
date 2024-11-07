import { Grid, Typography } from '@mui/material';
import React from 'react';
import { Check, Close } from '@mui/icons-material';
import i18next from 'i18next';
import { FormikProps } from 'formik';
import EntitiesTableOfTemplate from '../../EntitiesTableOfTemplate';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { environment } from '../../../globals';

const { defaultRowHeight, defaultFontSize } = environment.agGrid;

export const LoadEntitiesTable: React.FC<{
    tablesData: {
        succeededEntities: { templateId: string; properties: Record<string, any> }[];
        failedEntities: { type: string; message: string; properties: Record<string, any> }[];
    };
    template: IMongoEntityTemplatePopulated;
    formikProps: FormikProps<T>;
}> = ({ tablesData, template, formikProps }) => {
    return (
        <Grid container direction="column" padding="5px">
            <Grid container direction="row" alignItems="center" gap="20px">
                <Check sx={{ color: '#4FC318' }} />
                <Typography color="#1E2775" fontFamily="Rubik" fontWeight={400} fontSize="14px">
                    {i18next.t('wizard.entity.LoadEntitiesFromExcel.succeededEntities')}
                </Typography>
            </Grid>
            <Grid sx={{ marginTop: '10px', marginBottom: '30px', width: '100%' }}>
                <EntitiesTableOfTemplate
                    template={template}
                    showNavigateToRowButton
                    getRowId={(currentEntity) => currentEntity.properties._id}
                    getEntityPropertiesData={(currentEntity) => currentEntity.properties}
                    rowModelType="clientSide"
                    rowHeight={defaultRowHeight}
                    fontSize={`${defaultFontSize}px`}
                    rowData={tablesData.succeededEntities}
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
            {tablesData.failedEntities.length > 0 && (
                <Grid container direction="column">
                    <Grid container direction="row" alignItems="center" gap="20px">
                        <Close sx={{ color: '#A40000' }} />
                        <Typography color="#1E2775" fontFamily="Rubik" fontWeight={400} fontSize="14px">
                            {i18next.t('wizard.entity.LoadEntitiesFromExcel.failedEntities')}
                        </Typography>
                        <Typography color="#787C9E" fontFamily="Rubik" fontWeight={400} fontSize="12px">
                            {i18next.t('wizard.entity.LoadEntitiesFromExcel.failedEntitiesDescription')}
                        </Typography>
                    </Grid>
                    <Grid sx={{ marginTop: '10px', marginBottom: '30px', width: '100%' }}>
                        <EntitiesTableOfTemplate
                            template={template}
                            showNavigateToRowButton
                            getRowId={(currentEntity) => currentEntity.properties._id}
                            getEntityPropertiesData={(currentEntity) => currentEntity.properties}
                            rowModelType="clientSide"
                            rowHeight={defaultRowHeight}
                            fontSize={`${defaultFontSize}px`}
                            rowData={tablesData.failedEntities}
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
            )}
            <Grid>
                {/* <StepperActions handleBack={() => {}} isLastStep isFirstStep={false} isLoading={isLoading || block} formikProps={formikProps} /> */}
            </Grid>
        </Grid>
    );
};
