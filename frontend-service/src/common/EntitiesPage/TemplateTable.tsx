import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Grid, Box, CircularProgress, Dialog } from '@mui/material';
import { ExpandLess, ExpandMore, AddCircle, VerticalAlignBottomOutlined as DownloadIcon } from '@mui/icons-material';
import i18next from 'i18next';
import { useQuery } from 'react-query';
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
import { exportEntitesTablesToExcelRequest } from '../../services/entitiesService';
import { EditEntityDetails } from '../../pages/Entity/components/EditEntityDetails';
import { IEntity } from '../../interfaces/entities';
import { environment } from '../../globals';

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
    const getFilterDataFromRef = () => {
        const filterModel = entitiesTableRef.current?.getFilterModel() || {};
        const sortModel = entitiesTableRef.current?.getSortModel() || [];

        return {
            filterModel,
            sortModel,
            quickFilter: quickFilterText || undefined,
        };
    };

    useImperativeHandle(ref, () => ({
        getFilterModel: () => entitiesTableRef.current?.getFilterModel(),
        getSortModel: () => entitiesTableRef.current?.getSortModel(),
    }));

    const { isFetching: isExportingTableToExcelFile, refetch: exportTemplateToExcel } = useQuery(
        ['exportTemplateToExcel', getFilterDataFromRef(), `${template.displayName}.xlsx`],
        () => {
            const filterRowsData = getFilterDataFromRef();
            return exportEntitesTablesToExcelRequest({ [template._id]: filterRowsData }, `${template.displayName}.xlsx`);
        },
        {
            enabled: false,
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

    return (
        <Grid container>
            <Grid container paddingLeft={3} justifyContent="space-between" width="100%">
                <Grid item container xs={5}>
                    <Grid item>{template.iconFileId && <CustomIcon iconUrl={template.iconFileId} height="30px" width="30px" color="#225AA7" />}</Grid>
                    <Grid item paddingLeft="10px">
                        <BlueTitle title={template.displayName} component="h5" variant="h5" />
                    </Grid>
                </Grid>
                <Grid>
                    <Grid item>
                        <IconButtonWithPopover
                            popoverText={isExpand ? i18next.t('entitiesTableOfTemplate.expandLess') : i18next.t('entitiesTableOfTemplate.expandMore')}
                            iconButtonProps={{
                                onClick: () => {
                                    setIsExpand(!isExpand);
                                },
                                size: 'medium',
                            }}
                        >
                            {isExpand ? <ExpandLess color="primary" fontSize="large" /> : <ExpandMore color="primary" fontSize="large" />}
                        </IconButtonWithPopover>
                        <ResetFilterButton entitiesTableRef={entitiesTableRef} disableButton={!isFiltered} />
                        <IconButtonWithPopover
                            popoverText={i18next.t('entitiesTableOfTemplate.downloadOneTable')}
                            iconButtonProps={{ onClick: () => exportTemplateToExcel(), size: 'medium' }}
                        >
                            {isExportingTableToExcelFile ? <CircularProgress size="24px" /> : <DownloadIcon color="primary" fontSize="medium" />}
                        </IconButtonWithPopover>
                        <AddEntityButton
                            initialStep={1}
                            disabled={template.disabled}
                            initialValues={{ template, properties: { disabled: false }, attachmentsProperties: {} }}
                        >
                            <AddCircle color={!template.disabled ? 'primary' : 'disabled'} fontSize="large" data-tour="create-entity" />
                        </AddEntityButton>
                    </Grid>
                </Grid>
            </Grid>
            <Box sx={{ marginBottom: '30px', width: '100%' }}>
                <EntitiesTableOfTemplate
                    ref={entitiesTableRef}
                    template={template}
                    showNavigateToRowButton
                    getRowId={(currentEntity) => currentEntity.properties._id}
                    getEntityPropertiesData={(currentEntity) => currentEntity.properties}
                    rowModelType="serverSide"
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
            <Dialog open={editDialog.isOpen}>
                <EditEntityDetails
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
