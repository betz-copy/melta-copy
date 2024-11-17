import { Accordion, AccordionDetails, AccordionSummary, CircularProgress, Grid, Typography } from '@mui/material';
import React from 'react';
import { Check, Close, Download, ExpandMore, Gavel } from '@mui/icons-material';
import i18next from 'i18next';
import EntitiesTableOfTemplate from '../../EntitiesTableOfTemplate';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { environment } from '../../../globals';
import { TableButton } from '../../TableButton';
import { ITablesResults } from '.';

const { defaultRowHeight, defaultFontSize } = environment.agGrid;

export const LoadEntitiesTable: React.FC<{
    tablesData: ITablesResults;
    template: IMongoEntityTemplatePopulated;
    onDownload: (brokenRulesEntities?: boolean) => Promise<any>;
    isDownloadLoading: boolean;
}> = ({ tablesData, template, onDownload, isDownloadLoading }) => {
    return (
        <Grid container direction="column" gap="20px" padding="5px" paddingY="15px">
            <Accordion
                sx={{
                    '&.MuiPaper-root': {
                        boxShadow: 'none',
                        border: 'none',
                    },
                    '&:before': {
                        display: 'none',
                    },
                }}
            >
                <AccordionSummary
                    sx={{
                        display: 'flex',
                        flexDirection: 'row-reverse',
                        gap: '20px',
                        '& .MuiAccordionSummary-expandIconWrapper': {
                            transition: 'transform 0.3s',
                            transform: 'rotate(90deg)',
                        },
                        '&.Mui-expanded .MuiAccordionSummary-expandIconWrapper': {
                            transform: 'rotate(0deg)',
                        },
                    }}
                    expandIcon={<ExpandMore style={{ color: '#787C9E', width: '20px', height: '20px' }} />}
                >
                    <Grid container direction="row" alignItems="center" gap="10px">
                        <Check sx={{ color: '#4FC318' }} />
                        <Typography color="#1E2775" fontFamily="Rubik" fontWeight={400} fontSize="14px">
                            {`${tablesData.succeededEntities.length} ${i18next.t('wizard.entity.loadEntities.succeededEntities')}`}
                        </Typography>
                    </Grid>
                </AccordionSummary>
                <AccordionDetails>
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
                </AccordionDetails>
            </Accordion>
            <Accordion
                sx={{
                    '&.MuiPaper-root': {
                        boxShadow: 'none',
                        border: 'none',
                    },
                    '&:before': {
                        display: 'none',
                    },
                }}
                defaultExpanded={tablesData.failedEntities.length > 0}
            >
                <AccordionSummary
                    sx={{
                        display: 'flex',
                        flexDirection: 'row-reverse',
                        gap: '20px',
                        '& .MuiAccordionSummary-expandIconWrapper': {
                            transition: 'transform 0.3s',
                            transform: 'rotate(90deg)',
                        },
                        '&.Mui-expanded .MuiAccordionSummary-expandIconWrapper': {
                            transform: 'rotate(0deg)',
                        },
                    }}
                    expandIcon={<ExpandMore style={{ color: '#787C9E', width: '20px', height: '20px' }} />}
                >
                    <Grid container direction="row" alignItems="center" gap="10px">
                        <Gavel style={{ color: '#FFAC2F' }} />
                        <Typography color="#1E2775" fontFamily="Rubik" fontWeight={400} fontSize="14px">
                            {`${tablesData.brokenRulesEntities?.entities.length || 0} ${i18next.t('wizard.entity.loadEntities.brokenRulesEntities')}`}
                        </Typography>
                        <Typography color="#787C9E" fontFamily="Rubik" fontWeight={400} fontSize="12px">
                            {i18next.t('wizard.entity.loadEntities.brokenRulesEntitiesDescription')}
                        </Typography>
                        <TableButton
                            iconButtonWithPopoverProps={{
                                popoverText: i18next.t('entitiesTableOfTemplate.downloadOneTable'),
                                iconButtonProps: { onClick: () => onDownload(true) },
                            }}
                            icon={isDownloadLoading ? <CircularProgress size="24px" /> : <Download fontSize="small" />}
                            text={isDownloadLoading ? '' : i18next.t('entitiesTableOfTemplate.downloadOneTableTitle')}
                        />
                    </Grid>
                </AccordionSummary>
                <AccordionDetails>
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
                </AccordionDetails>
            </Accordion>
            <Accordion
                sx={{
                    '&.MuiPaper-root': {
                        boxShadow: 'none',
                        border: 'none',
                    },
                    '&:before': {
                        display: 'none',
                    },
                }}
                defaultExpanded={tablesData.failedEntities.length > 0}
            >
                <AccordionSummary
                    sx={{
                        display: 'flex',
                        flexDirection: 'row-reverse',
                        gap: '20px',
                        '& .MuiAccordionSummary-expandIconWrapper': {
                            transition: 'transform 0.3s',
                            transform: 'rotate(90deg)',
                        },
                        '&.Mui-expanded .MuiAccordionSummary-expandIconWrapper': {
                            transform: 'rotate(0deg)',
                        },
                    }}
                    expandIcon={<ExpandMore style={{ color: '#787C9E', width: '20px', height: '20px' }} />}
                >
                    <Grid container direction="row" alignItems="center" gap="10px">
                        <Close sx={{ color: '#A40000' }} />
                        <Typography color="#1E2775" fontFamily="Rubik" fontWeight={400} fontSize="14px">
                            {`${tablesData.failedEntities.length} ${i18next.t('wizard.entity.loadEntities.failedEntities')}`}
                        </Typography>
                        <Typography color="#787C9E" fontFamily="Rubik" fontWeight={400} fontSize="12px">
                            {i18next.t('wizard.entity.loadEntities.failedEntitiesDescription')}
                        </Typography>
                        <TableButton
                            iconButtonWithPopoverProps={{
                                popoverText: i18next.t('entitiesTableOfTemplate.downloadOneTable'),
                                iconButtonProps: { onClick: () => onDownload(false) },
                            }}
                            icon={isDownloadLoading ? <CircularProgress size="24px" /> : <Download fontSize="small" />}
                            text={isDownloadLoading ? '' : i18next.t('entitiesTableOfTemplate.downloadOneTableTitle')}
                        />
                    </Grid>
                </AccordionSummary>
                <AccordionDetails>
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
                </AccordionDetails>
            </Accordion>
        </Grid>
    );
};
