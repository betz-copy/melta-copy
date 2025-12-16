import { IEntity, IEntityTemplateMap, TableMetaData } from '@microservices/shared';
import { Download } from '@mui/icons-material';
import { Box, CircularProgress, Grid, Typography, useTheme } from '@mui/material';
import i18next from 'i18next';
import fileDownload from 'js-file-download';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { ResetFilterButton } from '../../../common/EntitiesPage/ResetFilterButton';
import EntitiesTableOfTemplate, { EntitiesTableOfTemplateRef, ExternalIdType } from '../../../common/EntitiesTableOfTemplate';
import BlueTitle from '../../../common/MeltaDesigns/BlueTitle';
import { TableButton } from '../../../common/TableButton';
import { environment } from '../../../globals';
import { exportEntitiesRequest } from '../../../services/entitiesService';
import { useWorkspaceStore } from '../../../stores/workspace';
import { filterModelToFilterOfTemplate, getFilterModal } from '../../../utils/agGrid/agGridToSearchEntitiesOfTemplateRequest';
import { isChildTemplate } from '../../../utils/templates';
import { getRelevantEntityTemplate } from '../DashboardItemDetails/Chart/BodyComponent';

const { excelExtension } = environment.loadExcel;

export const CardTitle = ({ title, description }: { title: string; description?: string }) => {
    const { metadata: agGridMetaData } = useWorkspaceStore((state) => state.workspace);
    const { headlineTitleFontSize } = agGridMetaData.mainFontSizes;
    const theme = useTheme();

    return (
        <>
            <BlueTitle
                title={title}
                component="h4"
                variant="h4"
                style={{
                    fontSize: headlineTitleFontSize,
                    textAlign: 'center',
                }}
            />

            <Typography variant="subtitle1" color={theme.palette.primary.main} sx={{ textAlign: 'center', minHeight: '1.5em' }}>
                {description || ''}
            </Typography>
        </>
    );
};

const TableCard: React.FC<{ metaData: TableMetaData & { _id: string } }> = ({ metaData }) => {
    const titleSectionHeight = 80;

    const entitiesTableRef = useRef<EntitiesTableOfTemplateRef<IEntity>>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const template = getRelevantEntityTemplate(entityTemplates, metaData.templateId, metaData.childTemplateId);

    const [isFiltered, setIsFiltered] = useState(false);
    const memorizedFilter = useMemo(() => (metaData.filter ? JSON.parse(metaData.filter) : undefined), [metaData.filter]);

    const workspace = useWorkspaceStore((state) => state.workspace);
    const { defaultRowHeight, defaultFontSize } = workspace.metadata.agGrid;

    const resizeTable = () => {
        if (!containerRef.current || !entitiesTableRef.current) return;
        const newHeight = containerRef.current.offsetHeight;

        entitiesTableRef.current.resizeTableHeight(newHeight - titleSectionHeight);
    };

    const { isLoading: isExportingTableToExcelFile, mutateAsync: exportTemplateToExcel } = useMutation(
        async () =>
            exportEntitiesRequest({
                fileName: `${template.displayName}${excelExtension}`,
                templates: {
                    [template._id]: {
                        filter: getFilterModal(
                            filterModelToFilterOfTemplate(entitiesTableRef.current?.getFilterModel()!, template),
                            metaData.filter && JSON.parse(metaData.filter),
                        ),
                        displayColumns: metaData.columns,
                        isChildTemplate: isChildTemplate(template),
                    },
                },
            }),
        {
            onError() {
                toast.error(i18next.t('failedToExportTable'));
            },
            onSuccess(data) {
                fileDownload(data, `${template.displayName}${excelExtension}`);
            },
        },
    );

    useEffect(() => {
        window.addEventListener('resize', resizeTable);
        return () => window.removeEventListener('resize', resizeTable);
    }, []);

    useEffect(() => {
        const observer = new ResizeObserver(resizeTable);
        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <Grid ref={containerRef} container width="100%" height="100%" alignItems="center" justifyContent="center">
            <Grid sx={{ width: '98%', height: '100%', borderRadius: '7px', border: '1px #CCCFE5', gap: 2 }}>
                <CardTitle title={metaData.name} description={metaData.description} />

                <Grid display="flex">
                    <ResetFilterButton entitiesTableRef={entitiesTableRef} disableButton={!isFiltered} />

                    <TableButton
                        iconButtonWithPopoverProps={{
                            popoverText: i18next.t('entitiesTableOfTemplate.downloadOneTable'),
                            iconButtonProps: {
                                onClick: () => exportTemplateToExcel(),
                            },
                        }}
                        icon={isExportingTableToExcelFile ? <CircularProgress size="24px" /> : <Download fontSize="small" />}
                        text={isExportingTableToExcelFile ? '' : i18next.t('entitiesTableOfTemplate.downloadOneTableTitle')}
                    />
                </Grid>

                <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                    <EntitiesTableOfTemplate
                        ref={entitiesTableRef}
                        template={template}
                        getRowId={(currentEntity) => currentEntity.properties._id}
                        getEntityPropertiesData={(currentEntity) => currentEntity.properties}
                        rowHeight={defaultRowHeight}
                        fontSize={`${defaultFontSize}px`}
                        rowModelType="infinite"
                        saveStorageProps={{
                            shouldSaveFilter: false,
                            shouldSaveWidth: false,
                            shouldSaveVisibleColumns: false,
                            shouldSaveSorting: false,
                            shouldSaveColumnOrder: false,
                            shouldSavePagination: false,
                            shouldSaveScrollPosition: false,
                        }}
                        showNavigateToRowButton
                        actionsColumnWidth={125}
                        editable={false}
                        defaultFilter={memorizedFilter}
                        columnsToShow={metaData.columns}
                        infiniteModeWithoutExpand
                        onFilter={() => setIsFiltered(entitiesTableRef.current?.isFiltered() ?? false)}
                        externalId={{ id: metaData._id, type: ExternalIdType.dashboard }}
                    />
                </Box>
            </Grid>
        </Grid>
    );
};

export default TableCard;
