import { Download } from '@mui/icons-material';
import { Box, CircularProgress, Grid } from '@mui/material';
import i18next from 'i18next';
import fileDownload from 'js-file-download';
import React, { useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { BlueTitle } from '../../common/BlueTitle';
import { ResetFilterButton } from '../../common/EntitiesPage/ResetFilterButton';
import EntitiesTableOfTemplate, { EntitiesTableOfTemplateRef } from '../../common/EntitiesTableOfTemplate';
import { TableButton } from '../../common/TableButton';
import { environment } from '../../globals';
import { TableMetaData } from '../../interfaces/dashboard';
import { IEntity } from '../../interfaces/entities';
import { IEntityTemplateMap } from '../../interfaces/entityTemplates';
import { exportEntitiesRequest } from '../../services/entitiesService';
import { useWorkspaceStore } from '../../stores/workspace';

const {
    loadExcel: { excelExtension },
} = environment;

const TableView: React.FC<{ metaData: TableMetaData }> = ({ metaData }) => {
    const entitiesTableRef = useRef<EntitiesTableOfTemplateRef<IEntity>>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const template = entityTemplates.get(metaData.templateId)!;

    const { metadata: agGridMetaData } = useWorkspaceStore((state) => state.workspace);
    const { defaultRowHeight, defaultFontSize } = agGridMetaData.agGrid;
    const { headlineTitleFontSize } = agGridMetaData.mainFontSizes;

    const { isLoading: isExportingTableToExcelFile, mutateAsync: exportTemplateToExcel } = useMutation(
        async () => {
            return exportEntitiesRequest({
                fileName: `${template.displayName}${excelExtension}`,
                templates: {
                    [template._id]: {
                        filter: metaData.filter && Object.keys(metaData.filter).length > 0 && JSON.parse(metaData.filter),
                        displayColumns: metaData.columns ?? [],
                    },
                },
            });
        },
        {
            onError() {
                toast.error(i18next.t('failedToExportTable'));
            },
            onSuccess(data) {
                fileDownload(data, `${template.displayName}${excelExtension}`);
            },
        },
    );

    const resizeChart = () => {
        if (!containerRef.current || !entitiesTableRef.current) return;
        const newHeight = containerRef.current.offsetHeight;

        entitiesTableRef.current.resizeTableHeight(newHeight - 80);
    };

    useEffect(() => {
        window.addEventListener('resize', resizeChart);
        return () => window.removeEventListener('resize', resizeChart);
    }, []);

    useEffect(() => {
        const observer = new ResizeObserver(resizeChart);
        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    const memorizedFilter = React.useMemo(() => {
        return metaData.filter && Object.keys(metaData.filter).length > 0 ? JSON.parse(metaData.filter) : undefined;
    }, [metaData.filter]);

    return (
        <Grid ref={containerRef} container item width="100%" height="100%" alignItems="center" justifyContent="center" paddingTop="20px">
            <Grid sx={{ width: '98%', height: '100%', borderRadius: '7px', border: '1px #CCCFE5', gap: 2 }}>
                <BlueTitle
                    title={metaData.name || ''}
                    component="h4"
                    variant="h4"
                    style={{ fontSize: headlineTitleFontSize, justifySelf: 'center' }}
                />

                <Grid display="flex">
                    <ResetFilterButton entitiesTableRef={entitiesTableRef} disableButton={false} />

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
                        showNavigateToRowButton={false}
                        editable={false}
                        defaultFilter={memorizedFilter}
                        columnsToShow={metaData.columns}
                        infiniteModeWithoutExpand
                    />
                </Box>
            </Grid>
        </Grid>
    );
};

export { TableView };
