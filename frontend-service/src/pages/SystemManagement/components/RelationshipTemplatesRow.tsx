import React, { useState } from 'react';
import { Grid, IconButton } from '@mui/material';
import { AddCircle as AddIcon, Search as SearchIcon } from '@mui/icons-material';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';

import i18next from 'i18next';
import { ViewingCard } from './ViewingCard';
import { Header } from '../../../common/Header';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { IMongoRelationshipTemplate, IMongoRelationshipTemplatePopulated } from '../../../interfaces/relationshipTemplates';
import { IMongoCategory } from '../../../interfaces/categories';
import { RelationshipTemplateWizard } from '../../../common/wizards/relationshipTemplate';
import {
    deleteRelationshipTemplateRequest,
    relationshipTemplateObjectToRelationshipTemplateForm,
} from '../../../services/templates/relationshipTemplatesService';
import { AreYouSureDialog } from '../../../common/dialogs/AreYouSureDialog';
import { removeItemById } from '../../../utils/reactQuery';
import { RelationshipTitle } from '../../../common/RelationshipTitle';
import SearchInput from '../../../common/inputs/SearchInput';
import TemplatesSelectCheckbox from '../../../common/templatesSelectCheckbox';

const RelationshipTemplatesRow: React.FC = () => {
    const queryClient = useQueryClient();

    const categories = queryClient.getQueryData<IMongoCategory[]>('getCategories')!;
    const entityTemplates = queryClient.getQueryData<IMongoEntityTemplatePopulated[]>('getEntityTemplates')!;
    const relationshipTemplates = queryClient.getQueryData<IMongoRelationshipTemplate[]>('getRelationshipTemplates')!;

    const [sourceEntityTemplatesToShow, setSourceEntityTemplatesToShow] = useState<IMongoEntityTemplatePopulated[]>(entityTemplates);
    const [destinationEntityTemplatesToShow, setDestinationEntityTemplatesToShow] = useState<IMongoEntityTemplatePopulated[]>(entityTemplates);

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
                <Grid container spacing={1} alignItems="center">
                    <Grid item>
                        <SearchInput onChange={setSearchText} endAdornmentChildren={<SearchIcon />} />
                    </Grid>
                    <Grid item>
                        <TemplatesSelectCheckbox
                            title={i18next.t('systemManagement.sourceTemplates')}
                            templates={entityTemplates}
                            selectedTemplates={sourceEntityTemplatesToShow}
                            setSelectedTemplates={setSourceEntityTemplatesToShow}
                            categories={categories}
                            size="small"
                        />
                    </Grid>
                    <Grid item>
                        <TemplatesSelectCheckbox
                            title={i18next.t('systemManagement.destinationTemplates')}
                            templates={entityTemplates}
                            selectedTemplates={destinationEntityTemplatesToShow}
                            setSelectedTemplates={setDestinationEntityTemplatesToShow}
                            categories={categories}
                            size="small"
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
                        const sourceEntity = entityTemplates.find((entityTemplate) => entityTemplate._id === relationshipTemplate.sourceEntityId)!;

                        const destinationEntity = entityTemplates.find(
                            (entityTemplate) => entityTemplate._id === relationshipTemplate.destinationEntityId,
                        )!;

                        const { sourceEntityId, destinationEntityId, ...restOfRelationshipTemplate } = relationshipTemplate;

                        return {
                            sourceEntity,
                            destinationEntity,
                            ...restOfRelationshipTemplate,
                        } as IMongoRelationshipTemplatePopulated;
                    })
                    .filter((relationshipTemplate) => {
                        return (
                            sourceEntityTemplatesToShow.some(
                                (sourceEntityTemplateToShow) => sourceEntityTemplateToShow._id === relationshipTemplate.sourceEntity._id,
                            ) &&
                            destinationEntityTemplatesToShow.some(
                                (destinationEntityTemplateToShow) =>
                                    destinationEntityTemplateToShow._id === relationshipTemplate.destinationEntity._id,
                            )
                        );
                    })
                    .filter((relationshipTemplate) => {
                        return (
                            searchText === '' ||
                            relationshipTemplate.displayName.includes(searchText) ||
                            relationshipTemplate.sourceEntity.displayName.includes(searchText) ||
                            relationshipTemplate.destinationEntity.displayName.includes(searchText)
                        );
                    })
                    .map((relationshipTemplate) => (
                        <ViewingCard
                            minWidth={350}
                            key={relationshipTemplate._id}
                            disabledProps={{
                                isDisabled: false,
                                canEdit: relationshipTemplate.sourceEntity.disabled || relationshipTemplate.destinationEntity.disabled,
                                tooltipTitle: i18next.t('systemManagement.disabledEntityTemplate'),
                            }}
                            title={
                                <RelationshipTitle
                                    sourceEntityTemplateDisplayName={relationshipTemplate.sourceEntity.displayName}
                                    relationshipTemplateDisplayName={relationshipTemplate.displayName}
                                    destinationEntityTemplateDisplayName={relationshipTemplate.destinationEntity.displayName}
                                />
                            }
                            onEditClick={() => {
                                const { sourceEntity, destinationEntity, ...restOfRelationshipTemplate } = relationshipTemplate;
                                setRelationshipTemplateWizardDialogState({
                                    isWizardOpen: true,
                                    relationshipTemplate: {
                                        sourceEntityId: sourceEntity._id,
                                        destinationEntityId: destinationEntity._id,
                                        ...restOfRelationshipTemplate,
                                    },
                                });
                            }}
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
