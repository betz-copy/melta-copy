import { Download, ExpandMore } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionSummary, CircularProgress, Grid, Typography, useTheme } from '@mui/material';
import i18next from 'i18next';
import React, { useRef } from 'react';
import { v4 as uuid } from 'uuid';
import EntitiesTableOfTemplate, { EntitiesTableOfTemplateRef } from '../../../EntitiesTableOfTemplate';
import { IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { TableButton } from '../../../TableButton';
import { EntityData, IEntity, ISearchFilter } from '../../../../interfaces/entities';
import { useWorkspaceStore } from '../../../../stores/workspace';
import { IFailedEntity } from '../../../../interfaces/excel';

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
}) => {
    const theme = useTheme();
    const entitiesTableRef = useRef<EntitiesTableOfTemplateRef<EntityData>>(null);
    const workspace = useWorkspaceStore((state) => state.workspace);
    const { defaultRowHeight, defaultFontSize } = workspace.metadata.agGrid;

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
            <AccordionDetails>
                <EntitiesTableOfTemplate
                    ref={entitiesTableRef}
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
                    }}
                    ignoreType
                    showNavigateToRowButton={false}
                    editable={false}
                    infiniteModeWithoutExpand={infiniteModeWithoutExpand}
                    defaultFilter={defaultFilter}
                    disableFilter={disableFilter}
                />
            </AccordionDetails>
        </Accordion>
    );
};
