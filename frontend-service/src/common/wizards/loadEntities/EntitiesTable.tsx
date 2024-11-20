import { Accordion, AccordionDetails, AccordionSummary, CircularProgress, Grid, Typography } from '@mui/material';
import React from 'react';
import { Download, ExpandMore } from '@mui/icons-material';
import i18next from 'i18next';
import { v4 as uuid } from 'uuid';
import EntitiesTableOfTemplate from '../../EntitiesTableOfTemplate';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { environment } from '../../../globals';
import { TableButton } from '../../TableButton';
import { IEntity } from '../../../interfaces/entities';

const { defaultRowHeight, defaultFontSize } = environment.agGrid;

export const EntitiesTable: React.FC<{
    rowData?: IEntity[];
    template: IMongoEntityTemplatePopulated;
    defaultExpanded: boolean;
    icon: React.JSX.Element;
    title: string;
    description?: string;
    download?: { onDownload: (brokenRulesEntities?: boolean) => Promise<any>; isLoading: boolean };
}> = ({ rowData, template, defaultExpanded, icon, title, description, download }) => {
    return (
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
            defaultExpanded={defaultExpanded}
        >
            <AccordionSummary
                sx={{
                    display: 'flex',
                    flexDirection: 'row-reverse',
                    gap: '10px',
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
                    {icon}
                    <Typography color="#1E2775" fontFamily="Rubik" fontWeight={400} fontSize="14px">
                        {title}
                    </Typography>
                    {description && defaultExpanded && (
                        <Typography color="#787C9E" fontFamily="Rubik" fontWeight={400} fontSize="12px">
                            {description}
                        </Typography>
                    )}
                    {download && defaultExpanded && (
                        <TableButton
                            iconButtonWithPopoverProps={{
                                popoverText: i18next.t('entitiesTableOfTemplate.downloadOneTable'),
                                iconButtonProps: {
                                    onClick: (e) => {
                                        e.preventDefault();
                                        download.onDownload(false);
                                    },
                                },
                            }}
                            icon={download.isLoading ? <CircularProgress size="24px" /> : <Download fontSize="small" />}
                            text={download.isLoading ? '' : i18next.t('entitiesTableOfTemplate.downloadOneTableTitle')}
                        />
                    )}
                </Grid>
            </AccordionSummary>
            <AccordionDetails>
                <EntitiesTableOfTemplate
                    template={template}
                    getRowId={(currentEntity) => currentEntity.properties._id || uuid()}
                    getEntityPropertiesData={(currentEntity) => currentEntity.properties}
                    rowModelType="clientSide"
                    rowHeight={defaultRowHeight}
                    fontSize={`${defaultFontSize}px`}
                    rowData={rowData}
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
                    showNavigateToRowButton={false}
                />
            </AccordionDetails>
        </Accordion>
    );
};
