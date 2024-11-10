import { Button, CircularProgress, Grid, Typography, useTheme } from '@mui/material';
import React from 'react';
import { Check, Close, Download } from '@mui/icons-material';
import i18next from 'i18next';
import EntitiesTableOfTemplate from '../../EntitiesTableOfTemplate';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { environment } from '../../../globals';
import { TableButton } from '../../TableButton';

const { defaultRowHeight, defaultFontSize } = environment.agGrid;

export const LoadEntitiesTable: React.FC<{
    tablesData: {
        succeededEntities: { templateId: string; properties: Record<string, any> }[];
        failedEntities: { type: string; message: string; properties: Record<string, any> }[];
    };
    template: IMongoEntityTemplatePopulated;
    handleClose: () => void;
    onDownload: Promise<void>;
    isDownloadLoading: boolean;
}> = ({ tablesData, template, handleClose, onDownload, isDownloadLoading }) => {
    const theme = useTheme();

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
            {tablesData.failedEntities.length > 0 && (
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
                                iconButtonProps: { onClick: onDownload },
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
            )}
            <Grid display="flex" justifyContent="flex-end">
                <Button
                    type="submit"
                    variant="contained"
                    style={{ background: theme.palette.primary.main, borderRadius: '7px', width: '93px', height: '35px' }}
                    onClick={handleClose}
                >
                    <Typography fontSize={14} style={{ fontWeight: '400', padding: '0 5px', color: 'white' }}>
                        {i18next.t('wizard.finish')}
                    </Typography>
                </Button>
            </Grid>
        </Grid>
    );
};
