import React, { useState } from 'react';
import { Grid, IconButton } from '@mui/material';
import { AddCircle as AddIcon } from '@mui/icons-material';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';

import i18next from 'i18next';
import { AxiosError } from 'axios';
import { ViewingCard } from './ViewingCard';
import { Header } from '../../../common/Header';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { IMongoRelationshipTemplate, IRelationshipTemplateMap } from '../../../interfaces/relationshipTemplates';
import { ICategoryMap } from '../../../interfaces/categories';
import { RelationshipTemplateWizard } from '../../../common/wizards/relationshipTemplate';
import {
    deleteRelationshipTemplateRequest,
    relationshipTemplateObjectToRelationshipTemplateForm,
} from '../../../services/templates/relationshipTemplatesService';
import { AreYouSureDialog } from '../../../common/dialogs/AreYouSureDialog';
import { RelationshipTitle } from '../../../common/RelationshipTitle';
import SearchInput from '../../../common/inputs/SearchInput';
import TemplatesSelectCheckbox from '../../../common/templatesSelectCheckbox';
import { populateRelationshipTemplate } from '../../../utils/templates';
import { ErrorToast } from '../../../common/ErrorToast';
import { ViewingBox } from './ViewingBox';

const RelationshipTemplatesRow: React.FC = () => {
    const queryClient = useQueryClient();

    const categories = queryClient.getQueryData<ICategoryMap>('getCategories')!;
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const relationshipTemplates = queryClient.getQueryData<IRelationshipTemplateMap>('getRelationshipTemplates')!;

    const categoriesArray = Array.from(categories.values());
    const entityTemplatesArray = Array.from(entityTemplates.values());

    const [sourceEntityTemplatesToShow, setSourceEntityTemplatesToShow] = useState<IMongoEntityTemplatePopulated[]>(entityTemplatesArray);
    const [destinationEntityTemplatesToShow, setDestinationEntityTemplatesToShow] = useState<IMongoEntityTemplatePopulated[]>(entityTemplatesArray);

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
            queryClient.setQueryData<IRelationshipTemplateMap>('getRelationshipTemplates', (relationshipTemplateMap) => {
                relationshipTemplateMap!.delete(id);
                return relationshipTemplateMap!;
            });
            setDeleteRelationshipTemplateDialogState({ isDialogOpen: false, relationshipTemplateId: null });
            toast.success(i18next.t('wizard.relationshipTemplate.deletedSuccessfully'));
        },
        onError: (error: AxiosError) => {
            toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('wizard.relationshipTemplate.failedToDelete')} />);
        },
    });

    return (
        <Grid item container marginBottom="30px">
            <Header title={i18next.t('relationshipTemplates')}>
                <Grid container spacing={1} alignItems="center">
                    <Grid item>
                        <SearchInput onChange={setSearchText} />
                    </Grid>
                    <Grid item>
                        <TemplatesSelectCheckbox
                            title={i18next.t('systemManagement.sourceTemplates')}
                            templates={entityTemplatesArray}
                            selectedTemplates={sourceEntityTemplatesToShow}
                            setSelectedTemplates={setSourceEntityTemplatesToShow}
                            categories={categoriesArray}
                            size="small"
                        />
                    </Grid>
                    <Grid item>
                        <TemplatesSelectCheckbox
                            title={i18next.t('systemManagement.destinationTemplates')}
                            templates={entityTemplatesArray}
                            selectedTemplates={destinationEntityTemplatesToShow}
                            setSelectedTemplates={setDestinationEntityTemplatesToShow}
                            categories={categoriesArray}
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
            <ViewingBox>
                {Array.from(relationshipTemplates.values())
                    .map((relationshipTemplate) => populateRelationshipTemplate(relationshipTemplate, entityTemplates))
                    .filter(
                        (relationshipTemplate) =>
                            sourceEntityTemplatesToShow.some(
                                (sourceEntityTemplateToShow) => sourceEntityTemplateToShow._id === relationshipTemplate.sourceEntity._id,
                            ) &&
                            destinationEntityTemplatesToShow.some(
                                (destinationEntityTemplateToShow) =>
                                    destinationEntityTemplateToShow._id === relationshipTemplate.destinationEntity._id,
                            ),
                    )
                    .filter(
                        (relationshipTemplate) =>
                            searchText === '' ||
                            relationshipTemplate.displayName.includes(searchText) ||
                            relationshipTemplate.sourceEntity.displayName.includes(searchText) ||
                            relationshipTemplate.destinationEntity.displayName.includes(searchText),
                    )
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
            </ViewingBox>
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
