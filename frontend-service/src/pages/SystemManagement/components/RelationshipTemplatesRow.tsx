import React, { Dispatch, SetStateAction, useState } from 'react';
import { Grid, IconButton, TextField } from '@mui/material';
import { AddCircle as AddIcon } from '@mui/icons-material';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';

import i18next from 'i18next';
import { ViewingCard } from './ViewingCard';
import { Header } from '../../../common/Header';
import { SelectCheckbox } from '../../../common/SelectCheckbox';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { IMongoRelationshipTemplate } from '../../../interfaces/relationshipTemplates';
import { RelationshipTemplateWizard } from '../../../common/wizards/relationshipTemplate';
import {
    deleteRelationshipTemplateRequest,
    relationshipTemplateObjectToRelationshipTemplateForm,
} from '../../../services/templates/relationshipTemplatesService';
import { AreYouSureDialog } from '../../../common/dialogs/AreYouSureDialog';
import { removeItemById } from '../../../utils/reactQuery';
import { RelationshipTitle } from '../../../common/RelationshipTitle';

const RelationshipTemplatesRow: React.FC<{
    relationshipTemplates: IMongoRelationshipTemplate[];
    entityTemplates: IMongoEntityTemplatePopulated[];
    sourceEntityTemplatesToHide: string[];
    setSourceEntityTemplatesToHide: Dispatch<SetStateAction<string[]>>;
    destinationEntityTemplatesToHide: string[];
    setDestinationEntityTemplatesToHide: Dispatch<SetStateAction<string[]>>;
}> = ({
    relationshipTemplates,
    entityTemplates,
    sourceEntityTemplatesToHide,
    setSourceEntityTemplatesToHide,
    destinationEntityTemplatesToHide,
    setDestinationEntityTemplatesToHide,
}) => {
    const queryClient = useQueryClient();

    const [searchText, setSearchText] = useState('');

    const [deleteRelationshipTemplateDialogState, setDeleteRelationshipTemplateDialogState] = useState<{
        isDialogOpen: boolean;
        relationshipTemplateId: string | null;
    }>({
        isDialogOpen: false,
        relationshipTemplateId: null,
    });

    const [relationshipTemplateWizardDialogState, setRelationshipTemplateWizardDialogState] = useState<{
        isWizardOpen: boolean;
        relationshipTemplate: IMongoRelationshipTemplate | null;
    }>({
        isWizardOpen: false,
        relationshipTemplate: null,
    });

    const { isLoading, mutateAsync } = useMutation((id: string) => deleteRelationshipTemplateRequest(id), {
        onSuccess: (_data, id) => {
            queryClient.setQueryData<IMongoRelationshipTemplate[]>('getRelationshipTemplates', (prevData) => removeItemById(id, prevData));
            setDeleteRelationshipTemplateDialogState({ isDialogOpen: false, relationshipTemplateId: null });
            toast.success(i18next.t('wizard.relationshipTemplate.deletedSuccessfully'));
        },
        onError: () => {
            toast.error(i18next.t('wizard.relationshipTemplate.failedToDelete'));
        },
    });

    return (
        <Grid item container marginBottom="30px">
            <Header title={i18next.t('relationshipTemplates')}>
                <Grid container spacing={4}>
                    <Grid item>
                        <TextField
                            style={{ backgroundColor: 'white' }}
                            variant="outlined"
                            placeholder={i18next.t('searchLabel')}
                            onChange={(event) => setSearchText(event.target.value)}
                        />
                    </Grid>
                    <Grid item>
                        <SelectCheckbox
                            title={i18next.t('systemManagement.sourceTemplates')}
                            handleChange={(event) => setSourceEntityTemplatesToHide(event.target.value as string[])}
                            options={entityTemplates.map((entityTemplate) => entityTemplate.displayName)}
                            optionsToHide={sourceEntityTemplatesToHide}
                        />
                    </Grid>
                    <Grid item>
                        <SelectCheckbox
                            title={i18next.t('systemManagement.destinationTemplates')}
                            handleChange={(event) => setDestinationEntityTemplatesToHide(event.target.value as string[])}
                            options={entityTemplates.map((entityTemplate) => entityTemplate.displayName)}
                            optionsToHide={destinationEntityTemplatesToHide}
                        />
                    </Grid>
                    <Grid item>
                        <IconButton onClick={() => setRelationshipTemplateWizardDialogState({ isWizardOpen: true, relationshipTemplate: null })}>
                            <AddIcon color="primary" fontSize="large" />
                        </IconButton>
                    </Grid>
                </Grid>
            </Header>
            <Grid container spacing={4}>
                {relationshipTemplates
                    .map((relationshipTemplate) => {
                        const sourceEntityTemplate = entityTemplates.find(
                            (entityTemplate) => entityTemplate._id === relationshipTemplate.sourceEntityId,
                        )!;

                        const destinationEntityTemplate = entityTemplates.find(
                            (entityTemplate) => entityTemplate._id === relationshipTemplate.destinationEntityId,
                        )!;

                        return {
                            sourceEntityTemplate,
                            destinationEntityTemplate,
                            ...relationshipTemplate,
                        };
                    })
                    .filter((relationshipTemplate) => {
                        return (
                            !sourceEntityTemplatesToHide.includes(relationshipTemplate.sourceEntityTemplate.displayName) &&
                            !destinationEntityTemplatesToHide.includes(relationshipTemplate.destinationEntityTemplate.displayName)
                        );
                    })
                    .filter(
                        (relationshipTemplate) =>
                            searchText === '' ||
                            relationshipTemplate.displayName.includes(searchText) ||
                            relationshipTemplate.sourceEntityTemplate.displayName.includes(searchText) ||
                            relationshipTemplate.destinationEntityTemplate.displayName.includes(searchText),
                    )
                    .map((relationshipTemplate) => (
                        <ViewingCard
                            minWidth={350}
                            key={relationshipTemplate._id}
                            title={
                                <RelationshipTitle
                                    sourceEntityTemplateDisplayName={relationshipTemplate.sourceEntityTemplate.displayName}
                                    relationshipTemplateDisplayName={relationshipTemplate.displayName}
                                    destinationEntityTemplateDisplayName={relationshipTemplate.destinationEntityTemplate.displayName}
                                />
                            }
                            onEditClick={() => setRelationshipTemplateWizardDialogState({ isWizardOpen: true, relationshipTemplate })}
                            onDeleteClick={() =>
                                setDeleteRelationshipTemplateDialogState({ isDialogOpen: true, relationshipTemplateId: relationshipTemplate._id })
                            }
                        />
                    ))}
            </Grid>
            <RelationshipTemplateWizard
                open={relationshipTemplateWizardDialogState.isWizardOpen}
                handleClose={() => setRelationshipTemplateWizardDialogState({ isWizardOpen: false, relationshipTemplate: null })}
                initialValues={relationshipTemplateObjectToRelationshipTemplateForm(
                    entityTemplates,
                    relationshipTemplateWizardDialogState.relationshipTemplate,
                )}
                isEditMode={Boolean(relationshipTemplateWizardDialogState.relationshipTemplate)}
            />
            <AreYouSureDialog
                open={deleteRelationshipTemplateDialogState.isDialogOpen}
                handleClose={() => setDeleteRelationshipTemplateDialogState({ isDialogOpen: false, relationshipTemplateId: null })}
                onYes={() => mutateAsync(deleteRelationshipTemplateDialogState.relationshipTemplateId!)}
                isLoading={isLoading}
            />
        </Grid>
    );
};

export { RelationshipTemplatesRow };
