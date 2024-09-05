import { GridApi, IServerSideGetRowsRequest } from '@ag-grid-community/core';
import { AppRegistration as DefaultEntityTemplateIcon } from '@mui/icons-material';
import { Box, CircularProgress, Dialog, Grid, useTheme } from '@mui/material';
import i18next from 'i18next';
import fileDownload from 'js-file-download';
import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { useMutation } from 'react-query';
import { toast } from 'react-toastify';
import { environment } from '../../globals';
import { IEntity } from '../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { PermissionScope } from '../../interfaces/permissions';
import { exportEntitiesRequest } from '../../services/entitiesService';
import { useDraftIdStore, useDraftsStore } from '../../stores/drafts';
import { useUserStore } from '../../stores/user';
import { filterModelToFilterOfTemplate, sortModelToSortOfSearchRequest } from '../../utils/agGrid/agGridToSearchEntitiesOfTemplateRequest';
import { getEntityTemplateColor } from '../../utils/colors';
import { checkUserCategoryPermission } from '../../utils/permissions/instancePermissions';
import { BlueTitle } from '../BlueTitle';
import { CustomIcon } from '../CustomIcon';
import { CreateOrEditEntityDetails } from '../dialogs/entity/CreateOrEditEntityDialog';
import EntitiesTableOfTemplate, { EntitiesTableOfTemplateRef } from '../EntitiesTableOfTemplate';
import { EntityTemplateColor } from '../EntityTemplateColor';
import IconButtonWithPopover from '../IconButtonWithPopover';
import { ImageWithDisable } from '../ImageWithDisable';
import { AddEntityButton } from './AddEntityButton';
import { DraftCard } from './DraftCard';
import { ResetFilterButton } from './ResetFilterButton';

const { defaultRowHeight, defaultFontSize } = environment.agGrid;

export type TemplateTableRef = {
    getFilterModel: () => ReturnType<GridApi<IEntity>['getFilterModel']> | undefined;
    getSortModel: () => IServerSideGetRowsRequest['sortModel'] | undefined;
    updateRowDataClientSide: (entity: IEntity) => void;
};

const TemplateTable = forwardRef<
    TemplateTableRef,
    {
        template: IMongoEntityTemplatePopulated;
        quickFilterText: string;
        page: string;
        setUpdatedEntities: React.Dispatch<React.SetStateAction<IEntity[]>>;
    }
>(({ template, quickFilterText, page, setUpdatedEntities }, ref) => {
    const currentUser = useUserStore((state) => state.user);

    const theme = useTheme();

    const entitiesTableRef = useRef<EntitiesTableOfTemplateRef<IEntity>>(null);

    useImperativeHandle(ref, () => ({
        getFilterModel: () => entitiesTableRef.current?.getFilterModel(),
        getSortModel: () => entitiesTableRef.current?.getSortModel(),
        updateRowDataClientSide: (entity: IEntity) => entitiesTableRef.current?.updateRowDataClientSide(entity),
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
            onError() {
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

    const userHasWritePermissions = checkUserCategoryPermission(currentUser.currentWorkspacePermissions, template.category, PermissionScope.write);

    const drafts = useDraftsStore((state) => state.drafts);

    const setDraftId = useDraftIdStore((state) => state.setDraftId);

    return (
        <Grid container minWidth="fit-content">
            <Grid container justifyContent="space-between" width="fit-content" minWidth="fit-content">
                <Grid item container xs={5} alignItems="center" minWidth="fit-content" gap="10px">
                    <Grid item minWidth="fit-content">
                        <EntityTemplateColor entityTemplateColor={entityTemplateColor} />
                    </Grid>
                    <Grid item minWidth="fit-content" sx={{ display: 'flex', justifyContent: 'center', alignContent: 'center' }}>
                        {template.iconFileId ? (
                            <CustomIcon
                                iconUrl={template.iconFileId}
                                height={environment.iconSize.height}
                                width={environment.iconSize.width}
                                color={theme.palette.primary.main}
                            />
                        ) : (
                            <DefaultEntityTemplateIcon
                                sx={{ color: theme.palette.primary.main, height: environment.iconSize.height, width: environment.iconSize.width }}
                            />
                        )}
                    </Grid>
                    <Grid item minWidth="fit-content" style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
                        <BlueTitle
                            style={{ minWidth: 'fit-content', whiteSpace: 'nowrap', overflow: 'hidden', fontWeight: '500', fontSize: '20px' }}
                            title={template.displayName}
                            component="h5"
                            variant="h5"
                        />
                    </Grid>
                </Grid>
            </Grid>

            <Grid container flexDirection="row" alignItems="center">
                <Grid container item flexGrow={1} width={0} justifyContent="flex-start" alignItems="center">
                    <IconButtonWithPopover
                        popoverText={i18next.t('entitiesTableOfTemplate.columns')}
                        iconButtonProps={{ onClick: () => entitiesTableRef.current?.showSideBar() }}
                        style={{ borderRadius: '5px' }}
                    >
                        <img src="/icons/columns-settings.svg" />
                    </IconButtonWithPopover>
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
                    <AddEntityButton
                        initialStep={1}
                        disabled={!userHasWritePermissions}
                        initialValues={{ template, properties: { disabled: false }, attachmentsProperties: {} }}
                        style={{ borderRadius: '5px' }}
                    >
                        <ImageWithDisable srcPath="/icons/add-entity.svg" disabled={!userHasWritePermissions} />
                    </AddEntityButton>
                </Grid>
            </Grid>

            <Grid container direction="row" width="90vw" wrap="nowrap" sx={{ overflowX: 'auto', marginBottom: '0.5rem' }}>
                {drafts[template.category._id]?.[template._id]
                    ?.sort((a, b) => {
                        if (a.entityId && !b.entityId) return -1;
                        if (!a.entityId && b.entityId) return 1;
                        return 0;
                    })
                    .map((draft) => (
                        <Grid item key={draft.uniqueId}>
                            <DraftCard
                                draft={draft}
                                openEditDialog={() => {
                                    setDraftId(draft.uniqueId);
                                    setEditDialog({
                                        isOpen: true,
                                        entity: {
                                            templateId: draft.template._id,
                                            properties: { ...draft.properties, _id: draft.entityId!, createdAt: '', updatedAt: '', disabled: false },
                                        },
                                    });
                                }}
                            />
                        </Grid>
                    ))}
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
                    rowHeight={defaultRowHeight}
                    fontSize={`${defaultFontSize}px`}
                    saveStorageProps={{
                        shouldSaveFilter: true,
                        shouldSaveWidth: true,
                        shouldSaveVisibleColumns: true,
                        shouldSaveSorting: true,
                        shouldSaveColumnOrder: true,
                        shouldSavePagination: true,
                        pageType: page,
                    }}
                    editRowButtonProps={{
                        onClick: (currEntity) => {
                            setDraftId('');
                            setEditDialog({
                                isOpen: true,
                                entity: currEntity,
                            });
                        },
                        popoverText: i18next.t(
                            !userHasWritePermissions ? 'permissions.dontHaveWritePermissions' : 'entitiesTableOfTemplate.editEntity',
                        ),
                        disabledButton: !userHasWritePermissions,
                    }}
                    onFilter={() => {
                        setIsFiltered(entitiesTableRef.current?.isFiltered() ?? false);
                    }}
                />
            </Box>
            <Dialog open={editDialog.isOpen} maxWidth={template.documentTemplatesIds?.length ? 'lg' : 'md'}>
                <CreateOrEditEntityDetails
                    isEditMode
                    entityTemplate={template}
                    entityToUpdate={editDialog.entity!}
                    onSuccessUpdate={(entity) => {
                        entitiesTableRef.current?.updateRowDataClientSide(entity.updatedEntity);
                        setUpdatedEntities(entity.updatedEntities);
                    }}
                    handleClose={() => setEditDialog((prev) => ({ ...prev, isOpen: false }))}
                />
            </Dialog>
        </Grid>
    );
});

export { TemplateTable };
