import { CircularProgress, Grid, Typography } from '@mui/material';
import React from 'react';
import { Check, Close, Download, Gavel } from '@mui/icons-material';
import i18next from 'i18next';
import { UseMutateAsyncFunction } from 'react-query';
import EntitiesTableOfTemplate from '../../EntitiesTableOfTemplate';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { environment } from '../../../globals';
import { TableButton } from '../../TableButton';
import { ITablesData } from '.';

const { defaultRowHeight, defaultFontSize } = environment.agGrid;

export const LoadEntitiesTable: React.FC<{
    tablesData: ITablesData;
    template: IMongoEntityTemplatePopulated;
    onDownload: UseMutateAsyncFunction<any, unknown, void, unknown>;
    isDownloadLoading: boolean;
}> = ({ tablesData, template, onDownload, isDownloadLoading }) => {
    return (
        <Grid container direction="column" padding="5px">
            <Grid container direction="row" alignItems="center" gap="10px">
                <Check sx={{ color: '#4FC318' }} />
                <Typography color="#1E2775" fontFamily="Rubik" fontWeight={400} fontSize="14px">
                    {i18next.t('wizard.entity.LoadEntitiesFromExcel.succeededEntities')}
                </Typography>
            </Grid>
            <Grid sx={{ marginTop: '10px', marginBottom: '30px', width: '100%' }}>
                <EntitiesTableOfTemplate
                    template={template}
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
            <Grid container direction="column">
                <Grid container direction="row" alignItems="center" gap="10px">
                    <Close sx={{ color: '#A40000' }} />
                    <Typography color="#1E2775" fontFamily="Rubik" fontWeight={400} fontSize="14px">
                        {i18next.t('wizard.entity.LoadEntitiesFromExcel.failedEntities')}
                    </Typography>
                    <Typography color="#787C9E" fontFamily="Rubik" fontWeight={400} fontSize="12px">
                        {i18next.t('wizard.entity.LoadEntitiesFromExcel.failedEntitiesDescription')}
                    </Typography>
                    <TableButton
                        iconButtonWithPopoverProps={{
                            popoverText: i18next.t('entitiesTableOfTemplate.downloadOneTable'),
                            iconButtonProps: { onClick: () => onDownload() },
                        }}
                        icon={isDownloadLoading ? <CircularProgress size="24px" /> : <Download fontSize="small" />}
                        text={isDownloadLoading ? '' : i18next.t('entitiesTableOfTemplate.downloadOneTableTitle')}
                    />
                </Grid>
                <Grid sx={{ marginTop: '10px', marginBottom: '30px', width: '100%' }}>
                    <EntitiesTableOfTemplate
                        template={template}
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
                        showErrors
                    />
                </Grid>
            </Grid>
            <Grid container direction="column">
                <Grid container direction="row" alignItems="center" gap="10px">
                    <Gavel style={{ color: '#FFAC2F' }} />
                    <Typography color="#1E2775" fontFamily="Rubik" fontWeight={400} fontSize="14px">
                        {i18next.t('wizard.entity.LoadEntitiesFromExcel.brokenRulesEntities')}
                    </Typography>
                </Grid>
                <Grid sx={{ marginTop: '10px', marginBottom: '30px', width: '100%' }}>
                    <EntitiesTableOfTemplate
                        template={template}
                        showNavigateToRowButton={false}
                        getRowId={(currentEntity) => currentEntity.properties._id}
                        getEntityPropertiesData={(currentEntity) => currentEntity.properties}
                        rowModelType="clientSide"
                        rowHeight={defaultRowHeight}
                        fontSize={`${defaultFontSize}px`}
                        rowData={tablesData.brokenRulesEntities?.entities || []}
                        saveStorageProps={{
                            shouldSaveFilter: false,
                            shouldSaveWidth: false,
                            shouldSaveVisibleColumns: false,
                            shouldSaveSorting: false,
                            shouldSaveColumnOrder: false,
                            shouldSavePagination: false,
                            shouldSaveScrollPosition: false,
                        }}
                        showErrors
                    />
                </Grid>
            </Grid>
        </Grid>
    );
};
