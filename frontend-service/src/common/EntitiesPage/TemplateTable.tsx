import { FilterModel } from '@ag-grid-community/core';
import { useMatomo } from '@datapunt/matomo-tracker-react';
import {
    AddCircle,
    BarChart,
    CloseFullscreenRounded,
    AppRegistration as DefaultEntityTemplateIcon,
    Download,
    EditNote,
    Expand,
    LibraryAddCheckOutlined as SelectMultipleIcon,
    TableRowsOutlined,
    Upload,
} from '@mui/icons-material';
import { Box, CircularProgress, Dialog, Grid, useTheme } from '@mui/material';
import i18next from 'i18next';
import fileDownload from 'js-file-download';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useMutation } from 'react-query';
import { toast } from 'react-toastify';
import { useLocation } from 'wouter';
import { environment } from '../../globals';
import { IMongoChildTemplatePopulated } from '../../interfaces/childTemplates';
import { ICreateOrUpdateWithRuleBreachDialogState } from '../../interfaces/CreateOrEditEntityDialog';
import { IEntity } from '../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { PermissionScope } from '../../interfaces/permissions';
import { ActionTypes } from '../../interfaces/ruleBreaches/actionMetadata';
import { IKartoffelUser } from '../../interfaces/users';
import { exportEntitiesRequest } from '../../services/entitiesService';
import { useClientSideUserStore } from '../../stores/clientSideUser';
import { useDraftIdStore, useDraftsStore } from '../../stores/drafts';
import { UserState, useUserStore } from '../../stores/user';
import { useWorkspaceStore } from '../../stores/workspace';
import { filterModelToFilterOfTemplate, sortModelToSortOfSearchRequest } from '../../utils/agGrid/agGridToSearchEntitiesOfTemplateRequest';
import { getEntityTemplateColor } from '../../utils/colors';
import { checkUserTemplatePermission } from '../../utils/permissions/instancePermissions';
import { isChildTemplate } from '../../utils/templates';
import { CustomIcon } from '../CustomIcon';
import { EntityWizardValues } from '../dialogs/entity';
import { CreateOrEditEntityDetails } from '../dialogs/entity/CreateOrEditEntityDialog';
import EntitiesTableOfTemplate, { EntitiesTableOfTemplateRef, TablePageType } from '../EntitiesTableOfTemplate';
import { EntityTemplateColor } from '../EntityTemplateColor';
import BlueTitle from '../MeltaDesigns/BlueTitle';
import { TableButton } from '../TableButton';
import { AddEntityButton } from './Buttons/AddEntity';
import { EditExcelButton } from './Buttons/EditExcel';
import { LoadExcelButton } from './Buttons/LoadExcel';
import { DraftCard } from './DraftCard';
import { ResetFilterButton } from './ResetFilterButton';

const {
    loadExcel: { excelExtension },
} = environment;

export type TemplateTableRef = EntitiesTableOfTemplateRef<IEntity>;

export const isUserHasWritePermissions = (
    currentClientSideUser: IKartoffelUser | IEntity,
    currentUser: UserState['user'],
    template: IMongoEntityTemplatePopulated | IMongoChildTemplatePopulated,
) =>
    Object.keys(currentClientSideUser).length > 0 ||
    checkUserTemplatePermission(currentUser.currentWorkspacePermissions, template.category._id, template._id, PermissionScope.write);

const TemplateTable = forwardRef<
    EntitiesTableOfTemplateRef<IEntity>,
    {
        template: IMongoEntityTemplatePopulated | IMongoChildTemplatePopulated;
        quickFilterText: string;
        page: TablePageType;
        setUpdatedEntities?: React.Dispatch<React.SetStateAction<IEntity[]>>;
        defaultFilter?: FilterModel;
        setUpdatedTemplateIds?: React.Dispatch<React.SetStateAction<string[]>>;
    }
>(({ template, quickFilterText, page, setUpdatedEntities, defaultFilter, setUpdatedTemplateIds }, ref) => {
    const [_, navigate] = useLocation();
    const workspace = useWorkspaceStore((state) => state.workspace);
    const { defaultRowHeight, defaultFontSize, defaultExpandedTableHeight } = workspace.metadata.agGrid;
    const { height, width } = workspace.metadata.iconSize;

    const currentUser = useUserStore((state) => state.user);

    const currentClientSideUser = useClientSideUserStore((state) => state.clientSideUser);

    const theme = useTheme();
    const drafts = useDraftsStore((state) => state.drafts);

    const setDraftId = useDraftIdStore((state) => state.setDraftId);
    const { trackEvent } = useMatomo();

    const entitiesTableRef = useRef<EntitiesTableOfTemplateRef<IEntity>>(null);

    const [isExpand, setIsExpand] = useState(() => sessionStorage.getItem(`isExpand-${template._id}`) === 'true');
    const [multipleSelect, setMultipleSelect] = useState(false);
    const [isFiltered, setIsFiltered] = useState(false);
    const initializedExternalErrors = { files: false, unique: {}, action: '' };
    const [externalErrors, setExternalErrors] = useState(initializedExternalErrors);
    const [createOrUpdateWithRuleBreachDialogState, setCreateOrUpdateWithRuleBreachDialogState] = useState<ICreateOrUpdateWithRuleBreachDialogState>({
        isOpen: false,
    });
    const [editDialog, setEditDialog] = useState<{
        isOpen: boolean;
        isEditMode: boolean;
        entity?: IEntity;
        wizardValues?: EntityWizardValues;
    }>({
        isOpen: false,
        isEditMode: true,
    });

    useImperativeHandle(ref, () => entitiesTableRef.current!);

    useEffect(() => {
        sessionStorage.setItem(`isExpand-${template._id}`, isExpand.toString());
    }, [isExpand, template._id]);

    const handleExpandClick = useCallback(() => {
        setIsExpand((prevExpand) => {
            const newExpandState = !prevExpand;
            sessionStorage.setItem(`isExpand-${template._id}`, newExpandState.toString());
            sessionStorage.setItem(`currentPage-${page}-${template._id}`, '0');
            sessionStorage.setItem(`scrollPosition-${template._id}`, '0');
            sessionStorage.setItem(`resizeHeight-${template._id}`, JSON.stringify(defaultExpandedTableHeight));
            return newExpandState;
        });

        if (multipleSelect) setMultipleSelect(false);
    }, [multipleSelect, template._id, page, defaultExpandedTableHeight]);

    const { isLoading: isExportingTableToExcelFile, mutateAsync: exportTemplateToExcel } = useMutation(
        async () => {
            return exportEntitiesRequest({
                fileName: `${template.displayName}${excelExtension}`,
                textSearch: quickFilterText,
                templates: {
                    [template._id]: {
                        filter: filterModelToFilterOfTemplate(entitiesTableRef.current?.getFilterModel() ?? {}, template),
                        sort: sortModelToSortOfSearchRequest(entitiesTableRef.current?.getSortModel() ?? []),
                        displayColumns: entitiesTableRef.current?.getDisplayColumns() ?? [],
                        isChildTemplate: isChildTemplate(template),
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

    const entityTemplateColor = getEntityTemplateColor(template);

    // TODO: what about categories?
    const userHasWritePermissions = isUserHasWritePermissions(currentClientSideUser, currentUser, template);

    useEffect(() => {
        sessionStorage.setItem(`isExpand-${template._id}`, isExpand.toString());
    }, [isExpand, template._id]);

    const handleDownloadClick = () => {
        exportTemplateToExcel();

        trackEvent({
            category: 'template-action',
            action: 'download template click',
            name: template.displayName,
        });
    };

    const checkIfLoadExcelIsDisabled = () => {
        const { properties } = template.properties;
        const requiredProperties = new Set(template.properties.required);

        return Object.entries(properties).some(([key, property]) => {
            return property.format && ['fileId', 'relationshipReference'].includes(property.format) && requiredProperties.has(key);
        });
    };

    const isLoadExcelDisabled = !userHasWritePermissions || checkIfLoadExcelIsDisabled();
    const loadExcelTooltip = isLoadExcelDisabled
        ? i18next.t(!userHasWritePermissions ? 'permissions.dontHaveWritePermissionsToTemplate' : 'wizard.entity.loadEntities.tableCantLoadEntities')
        : undefined;

    const checkIfEditExcelIsDisabled = () => {
        const { properties } = template.properties;
        return Object.values(properties).some((property) => property.identifier);
    };

    const isEditExcelDisabled = !userHasWritePermissions || !checkIfEditExcelIsDisabled();
    const editExcelTooltip = isEditExcelDisabled
        ? i18next.t(!userHasWritePermissions ? 'permissions.dontHaveWritePermissionsToTemplate' : 'wizard.entity.loadEntities.tableCantEditExcel')
        : undefined;

    return (
        <Grid container minWidth="fit-content" width="100%">
            <Grid container direction="column" width="100%" minWidth="fit-content">
                <Grid container size={{ xs: 5 }} justifyContent="start" alignItems="center" minWidth="fit-content" gap="10px">
                    <Grid minWidth="fit-content">
                        <EntityTemplateColor entityTemplateColor={entityTemplateColor} />
                    </Grid>
                    <Grid minWidth="fit-content" sx={{ display: 'flex', justifyContent: 'center', alignContent: 'center' }}>
                        {template.iconFileId ? (
                            <CustomIcon iconUrl={template.iconFileId} height={height} width={width} color={theme.palette.primary.main} />
                        ) : (
                            <DefaultEntityTemplateIcon
                                sx={{
                                    color: theme.palette.primary.main,
                                    height,
                                    width,
                                }}
                            />
                        )}
                    </Grid>
                    <Grid minWidth="fit-content" style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
                        <BlueTitle
                            style={{
                                minWidth: 'fit-content',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                fontWeight: '500',
                                fontSize: workspace.metadata.mainFontSizes.entityTemplateTitleFontSize,
                            }}
                            title={template.displayName}
                            component="h5"
                            variant="h5"
                        />
                    </Grid>
                </Grid>

                <Grid container direction="row" alignItems="center" justifyContent="space-between">
                    <Grid container>
                        <TableButton
                            iconButtonWithPopoverProps={{
                                popoverText: i18next.t('entitiesTableOfTemplate.columns'),
                                iconButtonProps: {
                                    onClick: () => {
                                        entitiesTableRef.current?.showSideBar();

                                        trackEvent({
                                            category: 'template-action',
                                            action: 'show sidebar click',
                                        });
                                    },
                                },
                            }}
                            icon={<TableRowsOutlined fontSize="small" />}
                            text={i18next.t('entitiesTableOfTemplate.columns')}
                        />

                        <TableButton
                            iconButtonWithPopoverProps={{
                                popoverText: i18next.t(`entitiesTableOfTemplate.expand${isExpand ? 'Less' : 'More'}`),
                                iconButtonProps: {
                                    onClick: () => {
                                        handleExpandClick();
                                        trackEvent({
                                            category: 'template-action',
                                            action: isExpand ? 'off' : 'on',
                                        });
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
                                iconButtonProps: {
                                    onClick: () => {
                                        handleDownloadClick();
                                    },
                                },
                            }}
                            icon={isExportingTableToExcelFile ? <CircularProgress size="24px" /> : <Download fontSize="small" />}
                            text={isExportingTableToExcelFile ? '' : i18next.t('entitiesTableOfTemplate.downloadOneTableTitle')}
                        />

                        <TableButton
                            iconButtonWithPopoverProps={{
                                popoverText: i18next.t('entitiesTableOfTemplate.multipleSelect'),
                                iconButtonProps: {
                                    onClick: () => {
                                        setMultipleSelect(!multipleSelect);
                                        if (!(isExpand && !multipleSelect)) setIsExpand(!isExpand);
                                    },
                                },
                            }}
                            icon={<SelectMultipleIcon fontSize="small" />}
                            text={i18next.t('entitiesTableOfTemplate.multipleSelect')}
                            disableButton={!userHasWritePermissions || !!template.walletTransfer}
                        />
                        <TableButton
                            iconButtonWithPopoverProps={{
                                popoverText: i18next.t('pages.charts'),
                                iconButtonProps: { onClick: () => navigate(`/charts/${template._id}`) },
                            }}
                            icon={<BarChart fontSize="small" />}
                            text={i18next.t('pages.charts')}
                        />
                    </Grid>

                    <Grid container>
                        {page !== TablePageType.clientSide && (
                            <EditExcelButton
                                disabled={isEditExcelDisabled}
                                initialValues={{ template, properties: { disabled: false }, attachmentsProperties: {} }}
                                onSuccessCreate={() => entitiesTableRef.current?.refreshServerSide()}
                                popoverText={editExcelTooltip}
                            >
                                <EditNote
                                    fontSize="small"
                                    sx={{
                                        opacity: isEditExcelDisabled ? 0.3 : 1,
                                        pointerEvents: isEditExcelDisabled ? 'none' : 'auto',
                                    }}
                                />
                                {i18next.t('entitiesTableOfTemplate.editExcelTitle')}
                            </EditExcelButton>
                        )}
                        <LoadExcelButton
                            disabled={isLoadExcelDisabled}
                            initialValues={{ template, properties: { disabled: false }, attachmentsProperties: {} }}
                            onSuccessCreate={() => entitiesTableRef.current?.refreshServerSide()}
                            popoverText={loadExcelTooltip}
                        >
                            <Upload
                                fontSize="small"
                                sx={{
                                    opacity: isLoadExcelDisabled ? 0.3 : 1,
                                    pointerEvents: isLoadExcelDisabled ? 'none' : 'auto',
                                }}
                            />
                            {i18next.t('entitiesTableOfTemplate.loadEntitiesTitle')}
                        </LoadExcelButton>
                        <AddEntityButton
                            initialStep={1}
                            disabled={!userHasWritePermissions || template.disabled}
                            initialValues={{ template, properties: { disabled: false }, attachmentsProperties: {} }}
                            style={{
                                display: 'flex',
                                gap: '0.25rem',
                                borderRadius: '5px',
                                fontSize: '0.75rem',
                                color: theme.palette.primary.main,
                            }}
                            popoverText={template.disabled ? i18next.t('permissions.EntityTemplateDisplay') : undefined}
                            onSuccessCreate={() => {
                                entitiesTableRef.current?.refreshServerSide();

                                trackEvent({
                                    category: 'template-action',
                                    action: 'add entity click',
                                });
                            }}
                            setUpdatedEntities={setUpdatedEntities}
                            setUpdatedTemplateIds={setUpdatedTemplateIds}
                        >
                            <AddCircle fontSize="small" sx={{ opacity: !userHasWritePermissions ? 0.3 : 1 }} />
                            {i18next.t('entitiesTableOfTemplate.addEntityTitle')}
                        </AddEntityButton>
                    </Grid>
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
                        <Grid key={draft.uniqueId} sx={{ flex: '0 0 auto', minWidth: '200px' }}>
                            <DraftCard
                                draft={draft}
                                openEditDialog={() => {
                                    setDraftId(draft.uniqueId);
                                    setExternalErrors(initializedExternalErrors);
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
                    multipleSelect={multipleSelect}
                    defaultFilter={defaultFilter}
                    saveStorageProps={{
                        shouldSaveFilter: true,
                        shouldSaveWidth: true,
                        shouldSaveVisibleColumns: true,
                        shouldSaveSorting: true,
                        shouldSaveColumnOrder: true,
                        shouldSavePagination: true,
                        shouldSaveScrollPosition: true,
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
                            setExternalErrors(initializedExternalErrors);
                            setCreateOrUpdateWithRuleBreachDialogState({ isOpen: false });
                            toast.dismiss();
                        },
                        popoverText: i18next.t(
                            !userHasWritePermissions ? 'permissions.dontHaveWritePermissionsToTemplate' : 'entitiesTableOfTemplate.editEntity',
                        ),
                        disabledButton: !userHasWritePermissions,
                    }}
                    onFilter={() => {
                        setIsFiltered(entitiesTableRef.current?.isFiltered() ?? false);
                    }}
                    menuRowButtonProps={userHasWritePermissions}
                    refetch={() => entitiesTableRef.current?.refreshServerSide()}
                    setUpdatedTemplateIds={setUpdatedTemplateIds}
                />
            </Box>
            <Dialog open={editDialog.isOpen} maxWidth={Object.keys(template.properties.properties).length === 1 ? 'sm' : 'md'} fullWidth>
                <CreateOrEditEntityDetails
                    mutationProps={{
                        ...(editDialog.isEditMode
                            ? {
                                  actionType: ActionTypes.UpdateEntity,
                                  payload: editDialog.entity!,
                              }
                            : { actionType: ActionTypes.CreateEntity, payload: undefined }),
                        onError: (currEntityValues) => {
                            setEditDialog((prev) => ({ ...prev, isOpen: true, wizardValues: currEntityValues }));
                        },
                        onSuccess: (entity: IEntity) => {
                            entitiesTableRef.current?.updateRowDataClientSide(entity);
                            setUpdatedEntities?.(
                                Object.values(entity.properties).filter(
                                    (property): property is IEntity =>
                                        typeof property === 'object' && 'templateId' in property && 'properties' in property,
                                ),
                            );
                            setUpdatedTemplateIds?.([entity.templateId]);
                            setEditDialog((prev) => ({ ...prev, isOpen: false }));
                            setExternalErrors(initializedExternalErrors);
                        },
                    }}
                    entityTemplate={template}
                    initialCurrValues={editDialog.wizardValues}
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

export default TemplateTable;
