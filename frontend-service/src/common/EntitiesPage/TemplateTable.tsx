import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Grid, Box, CircularProgress, Dialog, Icon } from '@mui/material';
import { ExpandLess, ExpandMore, AddCircle, VerticalAlignBottomOutlined as DownloadIcon } from '@mui/icons-material';
import i18next from 'i18next';
import { useMutation } from 'react-query';
import { toast } from 'react-toastify';
import fileDownload from 'js-file-download';
import { GridApi, IServerSideGetRowsRequest } from '@ag-grid-community/core';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { AddEntityButton } from './AddEntityButton';
import EntitiesTableOfTemplate, { EntitiesTableOfTemplateRef } from '../EntitiesTableOfTemplate';
import { BlueTitle } from '../BlueTitle';
import { ResetFilterButton } from './ResetFilterButton';
import IconButtonWithPopover from '../IconButtonWithPopover';
import { CustomIcon } from '../CustomIcon';
import { exportEntitiesRequest } from '../../services/entitiesService';
import { EditEntityDetails } from '../../pages/Entity/components/EditEntityDetails';
import { IEntity } from '../../interfaces/entities';
import { environment } from '../../globals';
import { filterModelToFilterOfTemplate, sortModelToSortOfSearchRequest } from '../../utils/agGrid/agGridToSearchEntitiesOfTemplateRequest';
import { lightTheme } from '../../theme';
import { getEntityTemplateColor } from '../../utils/colors';

const { expandedRowCount } = environment.agGrid;

export type TemplateTableRef = {
    getFilterModel: () => ReturnType<GridApi<IEntity>['getFilterModel']> | undefined;
    getSortModel: () => IServerSideGetRowsRequest['sortModel'] | undefined;
};

const TemplateTable = forwardRef<
    TemplateTableRef,
    {
        template: IMongoEntityTemplatePopulated;
        quickFilterText: string;
        page: string;
    }
>(({ template, quickFilterText, page }, ref) => {
    const entitiesTableRef = useRef<EntitiesTableOfTemplateRef<IEntity>>(null);

    useImperativeHandle(ref, () => ({
        getFilterModel: () => entitiesTableRef.current?.getFilterModel(),
        getSortModel: () => entitiesTableRef.current?.getSortModel(),
    }));

    const { isLoading: isExportingTableToExcelFile, mutateAsync: exportTemplateToExcel } = useMutation(
        async () => {
            return exportEntitiesRequest({
                fileName: `${template.displayName}.xlsx`,
                textSearch: quickFilterText,
                templates: {
                    [template._id]: {
                        filter: filterModelToFilterOfTemplate(entitiesTableRef.current?.getFilterModel() ?? {}, template),
                        sort: sortModelToSortOfSearchRequest(entitiesTableRef.current?.getSortModel() ?? []),
                    },
                },
            });
        },
        {
            onError(error) {
                console.log('Failed to export table', error);
                toast.error(i18next.t('failedToExportTable'));
            },
            onSuccess(data) {
                fileDownload(data, `${template.displayName}.xlsx`);
            },
        },
    );

    const [isFiltered, setIsFiltered] = useState(false);

    const [editDialog, setEditDialog] = useState<{
        isOpen: boolean;
        entity?: IEntity;
    }>({
        isOpen: false,
    });
    const [isExpand, setIsExpand] = useState(false);

    const entityTemplateColor = getEntityTemplateColor(template);

    return (
        <Grid container minWidth="fit-content">
            <Grid container justifyContent="space-between" width="fit-content" minWidth="fit-content">
                <Grid item container xs={5} alignItems="center" minWidth="fit-content">
                    <Grid item minWidth="fit-content">
                        <div
                            style={{
                                height: '30px',
                                width: '3px',
                                backgroundColor: entityTemplateColor,
                                borderRadius: '20px',
                            }}
                        />
                    </Grid>
                    <Grid item minWidth="fit-content">
                        {template.iconFileId && (
                            <CustomIcon iconUrl={template.iconFileId} height="30px" width="30px" color={lightTheme.palette.primary.main} />
                        )}
                    </Grid>
                    <Grid item paddingLeft="10px" minWidth="fit-content" style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
                        <BlueTitle
                            style={{ minWidth: 'fit-content', whiteSpace: 'nowrap', overflow: 'hidden', fontWeight: '500', fontSize: '20px' }}
                            title={template.displayName}
                            component="h5"
                            variant="h5"
                        />
                    </Grid>
                </Grid>
                <Grid>
                    <Grid item>
                        {/* <IconButtonWithPopover
                            popoverText={isExpand ? i18next.t('entitiesTableOfTemplate.expandLess') : i18next.t('entitiesTableOfTemplate.expandMore')}
                            iconButtonProps={{
                                onClick: () => {
                                    setIsExpand(!isExpand);
                                },
                                size: 'medium',
                            }}
                        >
                            {isExpand ? <ExpandLess color="primary" fontSize="large" /> : <ExpandMore color="primary" fontSize="large" />}
                        </IconButtonWithPopover> */}
                        {/* <ResetFilterButton entitiesTableRef={entitiesTableRef} disableButton={!isFiltered} /> */}
                        {/* <IconButtonWithPopover
                            popoverText={i18next.t('entitiesTableOfTemplate.downloadOneTable')}
                            iconButtonProps={{ onClick: () => exportTemplateToExcel(), size: 'medium' }}
                        >
                            {isExportingTableToExcelFile ? <CircularProgress size="24px" /> : <DownloadIcon color="primary" fontSize="medium" />}
                        </IconButtonWithPopover> */}
                        {/* <AddEntityButton
                            initialStep={1}
                            disabled={template.disabled}
                            initialValues={{ template, properties: { disabled: false }, attachmentsProperties: {} }}
                        >
                            <AddCircle color={!template.disabled ? 'primary' : 'disabled'} fontSize="large" data-tour="create-entity" />
                        </AddEntityButton> */}
                    </Grid>
                </Grid>
            </Grid>

            <Grid container flexDirection="row" alignItems="center">
                <Grid container item flexGrow={1} width={0} justifyContent="flex-start" alignItems="center">
                    <IconButtonWithPopover
                        popoverText={isExpand ? i18next.t('entitiesTableOfTemplate.expandLess') : i18next.t('entitiesTableOfTemplate.expandMore')}
                        iconButtonProps={{
                            onClick: () => {
                                setIsExpand(!isExpand);
                            },
                            size: 'small',
                        }}
                        style={{ borderRadius: '5px' }}
                    >
                        {isExpand ? <img src="/icons/reduce-table.svg" /> : <img src="/icons/expans-table.svg" />}
                    </IconButtonWithPopover>
                    <ResetFilterButton entitiesTableRef={entitiesTableRef} disableButton={!isFiltered} />
                    <IconButtonWithPopover
                        popoverText={i18next.t('entitiesTableOfTemplate.downloadOneTable')}
                        iconButtonProps={{ onClick: () => exportTemplateToExcel(), size: 'medium' }}
                        style={{ borderRadius: '5px' }}
                    >
                        {isExportingTableToExcelFile ? <CircularProgress size="24px" /> : <img src="/icons/download.svg" />}
                    </IconButtonWithPopover>
                </Grid>

                <Grid container item flexGrow={1} width={0} justifyContent="flex-end" alignItems="center">
                    <img src="/icons/load-file.svg" />
                    <AddEntityButton
                        initialStep={1}
                        disabled={template.disabled}
                        initialValues={{ template, properties: { disabled: false }, attachmentsProperties: {} }}
                        style={{ borderRadius: '5px' }}
                    >
                        {/* <AddCircle color={!template.disabled ? 'primary' : 'disabled'} fontSize="large" data-tour="create-entity" /> */}
                        <img src="/icons/add-entity.svg" />
                    </AddEntityButton>
                </Grid>
            </Grid>

            <Box sx={{ marginBottom: '30px', width: '100%' }}>
                <EntitiesTableOfTemplate
                    ref={entitiesTableRef}
                    template={template}
                    showNavigateToRowButton
                    getRowId={(currentEntity) => currentEntity.properties._id}
                    getEntityPropertiesData={(currentEntity) => currentEntity.properties}
                    rowModelType={isExpand ? 'infinite' : 'serverSide'}
                    quickFilterText={quickFilterText}
                    rowHeight={50}
                    pageRowCount={isExpand ? expandedRowCount : undefined}
                    fontSize="16px"
                    minColumnWidth={200}
                    filterStorageProps={{ shouldSaveFilter: true, pageType: page }}
                    editRowButtonProps={{
                        onClick: (currEntity) => {
                            setEditDialog({
                                isOpen: true,
                                entity: currEntity,
                            });
                        },
                    }}
                    onFilter={() => {
                        setIsFiltered(entitiesTableRef.current?.isFiltered() ?? false);
                    }}
                />
            </Box>
            <Dialog open={editDialog.isOpen} maxWidth="md">
                <EditEntityDetails
                    wasOpenFromTable
                    entityTemplate={template}
                    entity={editDialog.entity!}
                    onSuccessUpdate={(entity) => {
                        entitiesTableRef.current?.updateRowDataClientSide(entity);
                        setEditDialog((prev) => ({ ...prev, isOpen: false }));
                    }}
                    onCancelUpdate={() => setEditDialog((prev) => ({ ...prev, isOpen: false }))}
                />
            </Dialog>
        </Grid>
    );
});

export { TemplateTable };
