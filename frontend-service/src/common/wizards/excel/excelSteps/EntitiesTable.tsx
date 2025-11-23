import { Download, ExpandMore } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionSummary, CircularProgress, Grid, Typography, useTheme } from '@mui/material';
import i18next from 'i18next';
import React, { useState } from 'react';
import { v4 as uuid } from 'uuid';
import { IEntity, ISearchFilter } from '../../../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { IFailedEntity } from '../../../../interfaces/excel';
import { useWorkspaceStore } from '../../../../stores/workspace';
import EntitiesTableOfTemplate, { TablePageType } from '../../../EntitiesTableOfTemplate';
import { TableButton } from '../../../TableButton';

export const EntitiesTable: React.FC<{
    rowData?: IEntity[] | IFailedEntity[];
    rowModelType?: 'serverSide' | 'clientSide' | 'infinite';
    template: IMongoEntityTemplatePopulated;
    defaultExpanded: boolean;
    icon?: React.JSX.Element;
    title: string;
    description?: string;
    download?: { onDownload: (brokenRulesEntities?: boolean) => Promise<any>; isLoading: boolean };
    defaultFilter?: ISearchFilter;
    overrideSx?: object;
    infiniteModeWithoutExpand?: boolean;
    disableFilter?: boolean;
    ignoreType?: boolean;
    relatedTemplateProperties?: string;
    pageType?: TablePageType;
    scrollId?: string;
    onRowSelected?: (data: IEntity | IFailedEntity) => void;
    usePagination?: boolean;
}> = ({
    rowData,
    rowModelType = 'clientSide',
    template,
    defaultExpanded,
    icon,
    title,
    description,
    download,
    defaultFilter,
    overrideSx,
    infiniteModeWithoutExpand,
    disableFilter,
    ignoreType = true,
    relatedTemplateProperties,
    pageType,
    scrollId,
    onRowSelected,
    usePagination = true,
}) => {
    const theme = useTheme();
    const workspace = useWorkspaceStore((state) => state.workspace);
    const { defaultRowHeight, defaultFontSize } = workspace.metadata.agGrid;
    const [expanded, setExpanded] = useState(defaultExpanded);

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
                ...overrideSx,
            }}
            expanded={expanded}
            onChange={() => setExpanded((prev) => !prev)}
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
                    {icon && icon}
                    <Typography color={theme.palette.mode === 'dark' ? '#FFFFFF' : '#1E2775'} fontFamily="Rubik" fontWeight={400} fontSize="14px">
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
            <AccordionDetails sx={{ display: expanded ? 'block' : 'none' }}>
                <EntitiesTableOfTemplate
                    template={template}
                    getRowId={(currentEntity) => currentEntity.properties._id || uuid()}
                    getEntityPropertiesData={(currentEntity) => currentEntity.properties}
                    rowHeight={defaultRowHeight}
                    fontSize={`${defaultFontSize}px`}
                    rowData={rowData as (IEntity | IFailedEntity)[]}
                    rowModelType={rowModelType}
                    saveStorageProps={{
                        shouldSaveFilter: false,
                        shouldSaveWidth: false,
                        shouldSaveVisibleColumns: false,
                        shouldSaveSorting: false,
                        shouldSaveColumnOrder: false,
                        shouldSavePagination: false,
                        shouldSaveScrollPosition: false,
                        pageType,
                    }}
                    ignoreType={ignoreType}
                    showNavigateToRowButton={false}
                    editable={false}
                    infiniteModeWithoutExpand={infiniteModeWithoutExpand}
                    defaultFilter={defaultFilter}
                    disableFilter={disableFilter}
                    addRelationshipReferenceButtonProps={relatedTemplateProperties}
                    scrollToId={scrollId}
                    onRowSelected={onRowSelected}
                    usePagination={usePagination}
                />
            </AccordionDetails>
        </Accordion>
    );
};
