import {
    AddCircle,
    AppRegistration as DefaultEntityTemplateIcon,
    CloseFullscreenRounded,
    Download,
    Expand,
    TableRowsOutlined,
} from '@mui/icons-material';
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
import { EntityWizardValues } from '../dialogs/entity';
import { CreateOrEditEntityDetails, ICreateOrUpdateWithRuleBreachDialogState } from '../dialogs/entity/CreateOrEditEntityDialog';
import EntitiesTableOfTemplate, { EntitiesTableOfTemplateRef } from '../EntitiesTableOfTemplate';
import { EntityTemplateColor } from '../EntityTemplateColor';
import { TableButton } from '../TableButton';
import { AddEntityButton } from './AddEntityButton';
import { DraftCard } from './DraftCard';
import { ResetFilterButton } from './ResetFilterButton';

const { defaultRowHeight, defaultFontSize } = environment.agGrid;

export type TemplateTableRef = EntitiesTableOfTemplateRef<IEntity>;

const TemplateTable = forwardRef<
    EntitiesTableOfTemplateRef<IEntity>,
    {
        template: IMongoEntityTemplatePopulated;
        quickFilterText: string;
        page: string;
    }
>(({ template, quickFilterText, page }, ref) => {
    const currentUser = useUserStore((state) => state.user);

    const theme = useTheme();

    const entitiesTableRef = useRef<EntitiesTableOfTemplateRef<IEntity>>(null);

    useImperativeHandle(ref, () => entitiesTableRef.current!);

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
    const [externalErrors, setExternalErrors] = useState({ files: false, unique: {} });
    const [editDialog, setEditDialog] = useState<{
        isOpen: boolean;
        isEditMode: boolean;
        entity?: IEntity;
        wizardValues?: EntityWizardValues;
    }>({
        isOpen: false,
        isEditMode: true,
    });
    const [createOrUpdateWithRuleBreachDialogState, setCreateOrUpdateWithRuleBreachDialogState] = useState<ICreateOrUpdateWithRuleBreachDialogState>({
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
                    <TableButton
                        iconButtonWithPopoverProps={{
                            popoverText: i18next.t('entitiesTableOfTemplate.columns'),
                            iconButtonProps: { onClick: () => entitiesTableRef.current?.showSideBar() },
                        }}
                        icon={<TableRowsOutlined fontSize="small" />}
                        text={i18next.t('entitiesTableOfTemplate.columns')}
                    />

                    <TableButton
                        iconButtonWithPopoverProps={{
                            popoverText: isExpand ? i18next.t('entitiesTableOfTemplate.expandLess') : i18next.t('entitiesTableOfTemplate.expandMore'),
                            iconButtonProps: {
                                onClick: () => {
                                    setIsExpand(!isExpand);
                                },
                            },
                        }}
                        icon={isExpand ? <CloseFullscreenRounded fontSize="small" /> : <Expand fontSize="small" />}
                        text={i18next.t(`entitiesTableOfTemplate.expand${isExpand ? 'Less' : 'More'}Title`)}
                    />

                    <ResetFilterButton entitiesTableRef={entitiesTableRef} disableButton={!isFiltered} />

                    <TableButton
                        iconButtonWithPopoverProps={{
                            popoverText: i18next.t('entitiesTableOfTemplate.downloadOneTable'),
                            iconButtonProps: { onClick: () => exportTemplateToExcel() },
                        }}
                        icon={isExportingTableToExcelFile ? <CircularProgress size="24px" /> : <Download fontSize="small" />}
                        text={isExportingTableToExcelFile ? '' : i18next.t('entitiesTableOfTemplate.downloadOneTableTitle')}
                    />
                </Grid>

                <Grid container item flexGrow={1} width={0} justifyContent="flex-end" alignItems="center">
                    <AddEntityButton
                        initialStep={1}
                        disabled={!userHasWritePermissions}
                        initialValues={{ template, properties: { disabled: false }, attachmentsProperties: {} }}
                        style={{
                            display: 'flex',
                            gap: '0.25rem',
                            borderRadius: '5px',
                            fontSize: '0.75rem',
                            color: theme.palette.primary.main,
                        }}
                        onSuccessCreate={() => entitiesTableRef.current?.refreshServerSide()}
                    >
                        <AddCircle fontSize="small" sx={{ opacity: !userHasWritePermissions ? 0.3 : 1 }} />
                        {i18next.t('entitiesTableOfTemplate.addEntityTitle')}
                    </AddEntityButton>
                </Grid>
            </Grid>
            <Grid
                container
                direction="row"
                wrap="wrap"
                sx={{
                    overflowY: 'auto',
                    marginBottom: '0.5rem',
                    width: '100%',
                    maxHeight: 180,
                }}
            >
                {drafts[template.category._id]?.[template._id]
                    ?.sort((a, b) => {
                        if (a.entityId && !b.entityId) return -1;
                        if (!a.entityId && b.entityId) return 1;
                        return 0;
                    })
                    .map((draft) => (
                        <Grid item key={draft.uniqueId} sx={{ flex: '0 0 auto', minWidth: '200px' }}>
                            <DraftCard
                                draft={draft}
                                openEditDialog={() => {
                                    setDraftId(draft.uniqueId);
                                    setExternalErrors({ files: false, unique: {} });
                                    setEditDialog({
                                        isOpen: true,
                                        isEditMode: false,
                                        wizardValues: {
                                            template,
                                            properties: { ...draft.properties, _id: draft.entityId!, createdAt: '', updatedAt: '', disabled: false },
                                            attachmentsProperties: draft.attachmentsProperties,
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
                                isEditMode: true,
                                entity: currEntity,
                            });
                            setExternalErrors({ files: false, unique: {} });
                            setCreateOrUpdateWithRuleBreachDialogState({ isOpen: false });
                            toast.dismiss();
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
                    isEditMode={editDialog.isEditMode}
                    entityTemplate={template}
                    initialCurrValues={editDialog.wizardValues}
                    entityToUpdate={editDialog.entity!}
                    onError={(currEntityValues) => setEditDialog((prev) => ({ ...prev, isOpen: true, wizardValues: currEntityValues }))}
                    onSuccessUpdate={(entity) => {
                        if (editDialog.isEditMode) entitiesTableRef.current?.updateRowDataClientSide(entity);
                        else entitiesTableRef.current?.refreshServerSide();
                        setEditDialog((prev) => ({ ...prev, isOpen: false }));
                        setExternalErrors({ files: false, unique: {} });
                    }}
                    handleClose={() => {
                        setEditDialog((prev) => ({ ...prev, isOpen: false }));
                    }}
                    externalErrors={externalErrors}
                    setExternalErrors={setExternalErrors}
                    createOrUpdateWithRuleBreachDialogState={createOrUpdateWithRuleBreachDialogState}
                    setCreateOrUpdateWithRuleBreachDialogState={setCreateOrUpdateWithRuleBreachDialogState}
                />
            </Dialog>
        </Grid>
    );
});

export { TemplateTable };
