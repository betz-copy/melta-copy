import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Grid, Box, CircularProgress, Dialog, useTheme } from '@mui/material';
import i18next from 'i18next';
import { AppRegistration as DefaultEntityTemplateIcon } from '@mui/icons-material';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import fileDownload from 'js-file-download';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { AddEntityButton } from './AddEntityButton';
import EntitiesTableOfTemplate, { EntitiesTableOfTemplateRef } from '../EntitiesTableOfTemplate';
import { BlueTitle } from '../BlueTitle';
import { ResetFilterButton } from './ResetFilterButton';
import IconButtonWithPopover from '../IconButtonWithPopover';
import { CustomIcon } from '../CustomIcon';
import { exportEntitiesRequest } from '../../services/entitiesService';
import { IEntity } from '../../interfaces/entities';
import { environment } from '../../globals';
import { filterModelToFilterOfTemplate, sortModelToSortOfSearchRequest } from '../../utils/agGrid/agGridToSearchEntitiesOfTemplateRequest';
import { getEntityTemplateColor } from '../../utils/colors';
import { IPermissionsOfUser } from '../../services/permissionsService';
import { EntityTemplateColor } from '../EntityTemplateColor';
import { ImageWithDisable } from '../ImageWithDisable';
import { CreateOrEditEntityDetails, ICreateOrUpdateWithRuleBreachDialogState } from '../dialogs/entity/CreateOrEditEntityDialog';
import { checkUserInstanceOfCategoryPermission } from '../../utils/permissions/instancePermissions';
import { EntityWizardValues } from '../dialogs/entity';

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
        entity?: IEntity;
        wizardValues?: EntityWizardValues;
    }>({
        isOpen: false,
    });
    const [createOrUpdateWithRuleBreachDialogState, setCreateOrUpdateWithRuleBreachDialogState] = useState<ICreateOrUpdateWithRuleBreachDialogState>({
        isOpen: false,
    });
    const [isExpand, setIsExpand] = useState(false);

    const entityTemplateColor = getEntityTemplateColor(template);

    const queryClient = useQueryClient();
    const { instancesPermissions } = queryClient.getQueryData<IPermissionsOfUser>('getMyPermissions')!;
    const userHasWritePermissions = checkUserInstanceOfCategoryPermission(instancesPermissions, template.category, 'Write');
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
                        onSuccessCreate={() => entitiesTableRef.current?.refreshServerSide()}
                    >
                        <ImageWithDisable srcPath="/icons/add-entity.svg" disabled={!userHasWritePermissions} />
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
                            setEditDialog({
                                isOpen: true,
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
            <Dialog open={editDialog.isOpen} maxWidth="md">
                <CreateOrEditEntityDetails
                    isEditMode
                    entityTemplate={template}
                    initialCurrValues={editDialog.wizardValues}
                    entityToUpdate={editDialog.entity!}
                    onError={(currEntityValues) => setEditDialog((prev) => ({ ...prev, isOpen: true, wizardValues: currEntityValues }))}
                    onSuccessUpdate={(entity) => {
                        entitiesTableRef.current?.updateRowDataClientSide(entity);
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
