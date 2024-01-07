import React, { useState } from 'react';
import { Grid, IconButton } from '@mui/material';
import { AppRegistration as AppRegistrationIcon, AddCircle as AddIcon } from '@mui/icons-material';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';

import i18next from 'i18next';
import { AxiosError } from 'axios';
import { ICategoryMap, IMongoCategory } from '../../../interfaces/categories';
import { ViewingCard } from './ViewingCard';
import { CustomIcon } from '../../../common/CustomIcon';
import { Header } from '../../../common/Header';
import { SelectCheckbox } from '../../../common/SelectCheckbox';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { EntityTemplateWizard } from '../../../common/wizards/entityTemplate';
import {
    deleteEntityTemplateRequest,
    entityTemplateObjectToEntityTemplateForm,
    updateEntityTemplateStatusRequest,
} from '../../../services/templates/enitityTemplatesService';
import { AreYouSureDialog } from '../../../common/dialogs/AreYouSureDialog';
import SearchInput from '../../../common/inputs/SearchInput';
import { templatesCompareFunc } from '../../../utils/templates';
import { ErrorToast } from '../../../common/ErrorToast';
import { ViewingBox } from './ViewingBox';

const EntityTemplatesRow: React.FC = () => {
    const queryClient = useQueryClient();

    const categories = queryClient.getQueryData<ICategoryMap>('getCategories')!;
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const categoriesArray = Array.from(categories.values());
    const [categoriesToShow, setCategoriesToShow] = useState<IMongoCategory[]>(categoriesArray);

    const [searchText, setSearchText] = useState('');
    const [deleteEntityTemplateDialogState, setDeleteEntityTemplateDialogState] = useState<{
        isDialogOpen: boolean;
        entityTemplateId: string | null;
    }>({
        isDialogOpen: false,
        entityTemplateId: null,
    });

    const [entityTemplateWizardDialogState, setEntityTemplateWizardDialogState] = useState<{
        isWizardOpen: boolean;
        entityTemplate: IMongoEntityTemplatePopulated | null;
    }>({
        isWizardOpen: false,
        entityTemplate: null,
    });

    const { mutateAsync: updateEntityTemplateStatusAsync } = useMutation(
        ({ entityTemplateId, disabled }: { entityTemplateId: string; disabled: boolean }) =>
            updateEntityTemplateStatusRequest(entityTemplateId, disabled),
        {
            onSuccess: (data) => {
                queryClient.setQueryData<IEntityTemplateMap>('getEntityTemplates', (entityTemplateMap) => entityTemplateMap!.set(data._id, data));
                if (data.disabled) toast.success(i18next.t('wizard.entityTemplate.disabledSuccessfully'));
                else toast.success(i18next.t('wizard.entityTemplate.activatedSuccessfully'));
            },
            onError: (_err, variables) => {
                if (variables.disabled) toast.error(i18next.t('wizard.entityTemplate.failedToDisable'));
                else toast.error(i18next.t('wizard.entityTemplate.failedToActivate'));
            },
        },
    );

    const { isLoading: deleteTemplateIsLoading, mutateAsync: deleteTemplateMutateAsync } = useMutation(
        (id: string) => deleteEntityTemplateRequest(id),
        {
            onSuccess: (_data, id) => {
                queryClient.setQueryData<IEntityTemplateMap>('getEntityTemplates', (entityTemplateMap) => {
                    entityTemplateMap!.delete(id);
                    return entityTemplateMap!;
                });
                setDeleteEntityTemplateDialogState({ isDialogOpen: false, entityTemplateId: null });
                toast.success(i18next.t('wizard.entityTemplate.deletedSuccessfully'));
            },
            onError: (error: AxiosError) => {
                toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('wizard.entityTemplate.failedToDelete')} />);
            },
        },
    );

    return (
        <Grid item container>
            <Header title={i18next.t('entityTemplates')}>
                <Grid container spacing={1} alignItems="center">
                    <Grid item>
                        <SearchInput onChange={setSearchText} />
                    </Grid>
                    <Grid item>
                        <SelectCheckbox
                            title={i18next.t('categories')}
                            options={categoriesArray}
                            selectedOptions={categoriesToShow}
                            setSelectedOptions={setCategoriesToShow}
                            getOptionId={(category) => category._id}
                            getOptionLabel={(category) => category.displayName}
                            size="small"
                            isDraggableDisabled
                        />
                    </Grid>
                    <Grid item>
                        <IconButton onClick={() => setEntityTemplateWizardDialogState({ isWizardOpen: true, entityTemplate: null })}>
                            <AddIcon color="primary" fontSize="large" />
                        </IconButton>
                    </Grid>
                </Grid>
            </Header>
            <ViewingBox>
                {Array.from(entityTemplates.values())
                    .filter(
                        (entityTemplate) =>
                            categoriesToShow.some((categoryToShow) => categoryToShow._id === entityTemplate.category._id) &&
                            (searchText === '' || entityTemplate.displayName.includes(searchText)),
                    )
                    .sort((a, b) => {
                        const res = templatesCompareFunc(a, b);
                        if (res === 0) return Number(a.disabled) - Number(b.disabled);
                        return res;
                    })
                    .map((entityTemplate) => (
                        <ViewingCard
                            minWidth={250}
                            key={entityTemplate._id}
                            title={entityTemplate.displayName}
                            icon={
                                entityTemplate.iconFileId ? (
                                    <CustomIcon iconUrl={entityTemplate.iconFileId} height="40px" width="40px" />
                                ) : (
                                    <AppRegistrationIcon fontSize="large" />
                                )
                            }
                            onEditClick={() => setEntityTemplateWizardDialogState({ isWizardOpen: true, entityTemplate })}
                            onDeleteClick={() => setDeleteEntityTemplateDialogState({ isDialogOpen: true, entityTemplateId: entityTemplate._id })}
                            onDisableClick={() =>
                                updateEntityTemplateStatusAsync({ entityTemplateId: entityTemplate._id, disabled: !entityTemplate.disabled })
                            }
                            disabledProps={{
                                isDisabled: entityTemplate.disabled,
                                canEdit: entityTemplate.disabled,
                                tooltipTitle: i18next.t('systemManagement.disabledEntityTemplate'),
                            }}
                        />
                    ))}
            </ViewingBox>
            <EntityTemplateWizard
                open={entityTemplateWizardDialogState.isWizardOpen}
                handleClose={() => setEntityTemplateWizardDialogState({ isWizardOpen: false, entityTemplate: null })}
                initialValues={entityTemplateObjectToEntityTemplateForm(entityTemplateWizardDialogState.entityTemplate)}
                isEditMode={Boolean(entityTemplateWizardDialogState.entityTemplate)}
            />
            <AreYouSureDialog
                open={deleteEntityTemplateDialogState.isDialogOpen}
                handleClose={() => setDeleteEntityTemplateDialogState({ isDialogOpen: false, entityTemplateId: null })}
                onYes={() => deleteTemplateMutateAsync(deleteEntityTemplateDialogState.entityTemplateId!)}
                isLoading={deleteTemplateIsLoading}
            />
        </Grid>
    );
};

export { EntityTemplatesRow };
