import React, { Dispatch, SetStateAction, useState } from 'react';
import { Grid, IconButton, TextField } from '@mui/material';
import { AppRegistration as AppRegistrationIcon, AddCircle as AddIcon } from '@mui/icons-material';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';

import i18next from 'i18next';
import { IMongoCategory } from '../../../interfaces/categories';
import { ViewingCard } from './ViewingCard';
import { CustomIcon } from '../../../common/CustomIcon';
import { Header } from '../../../common/Header';
import { SelectCheckbox } from '../../../common/SelectCheckbox';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { EntityTemplateWizard } from '../../../common/wizards/entityTemplate';
import { deleteEntityTemplateRequest, entityTemplateObjectToEntityTemplateForm } from '../../../services/enitityTemplatesService';
import { AreYouSureDialog } from '../../../common/dialogs/AreYouSureDialog';
import { removeItemById } from '../../../utils/reactQuery';

const EntityTemplatesRow: React.FC<{
    entityTemplates: IMongoEntityTemplatePopulated[];
    categories: IMongoCategory[];
    categoriesToHide: string[];
    setCategoriesToHide: Dispatch<SetStateAction<string[]>>;
}> = ({ entityTemplates, categories, categoriesToHide, setCategoriesToHide }) => {
    const queryClient = useQueryClient();

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

    const { isLoading, mutateAsync } = useMutation((id: string) => deleteEntityTemplateRequest(id), {
        onSuccess: (_data, id) => {
            queryClient.setQueryData<IMongoEntityTemplatePopulated[]>('getEntityTemplates', (prevData) => removeItemById(id, prevData));
            setDeleteEntityTemplateDialogState({ isDialogOpen: false, entityTemplateId: null });
            toast.success(i18next.t('wizard.entityTemplate.deletedSuccessfully'));
        },
        onError: () => {
            toast.error(i18next.t('wizard.entityTemplate.failedToDelete'));
        },
    });

    return (
        <Grid item container>
            <Header title={i18next.t('entityTemplates')}>
                <TextField
                    style={{ marginLeft: '20px', backgroundColor: 'white' }}
                    variant="outlined"
                    placeholder={i18next.t('searchLabel')}
                    onChange={(event) => setSearchText(event.target.value)}
                />
                <SelectCheckbox
                    title={i18next.t('categories')}
                    handleChange={(event) => setCategoriesToHide(event.target.value as string[])}
                    options={categories.map((category) => category.displayName)}
                    optionsToHide={categoriesToHide}
                />
                <IconButton onClick={() => setEntityTemplateWizardDialogState({ isWizardOpen: true, entityTemplate: null })}>
                    <AddIcon color="primary" fontSize="large" />
                </IconButton>
            </Header>
            <Grid container spacing={4}>
                {entityTemplates
                    .filter((entityTemplate) => !categoriesToHide.includes(entityTemplate.category.displayName))
                    .filter((entityTemplate) => searchText === '' || entityTemplate.displayName.includes(searchText))
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
                        />
                    ))}
            </Grid>
            <EntityTemplateWizard
                open={entityTemplateWizardDialogState.isWizardOpen}
                handleClose={() => setEntityTemplateWizardDialogState({ isWizardOpen: false, entityTemplate: null })}
                initialValues={entityTemplateObjectToEntityTemplateForm(entityTemplateWizardDialogState.entityTemplate)}
                isEditMode={Boolean(entityTemplateWizardDialogState.entityTemplate)}
            />
            <AreYouSureDialog
                open={deleteEntityTemplateDialogState.isDialogOpen}
                handleClose={() => setDeleteEntityTemplateDialogState({ isDialogOpen: false, entityTemplateId: null })}
                onYes={() => mutateAsync(deleteEntityTemplateDialogState.entityTemplateId!)}
                isLoading={isLoading}
            />
        </Grid>
    );
};

export { EntityTemplatesRow };
