import React, { useState } from 'react';
import { Grid, IconButton, Typography } from '@mui/material';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { AppRegistration as AppRegistrationIcon } from '@mui/icons-material';

import i18next from 'i18next';
import { AxiosError } from 'axios';
import { ViewingCard } from './Card';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { IMongoRelationshipTemplate, IMongoRelationshipTemplatePopulated, IRelationshipTemplateMap } from '../../../interfaces/relationshipTemplates';
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
import { Box } from './Box';
import { CustomIcon } from '../../../common/CustomIcon';
import { CardMenu } from './CardMenu';
import { environment } from '../../../globals';

interface RelationshipTemplateCardProps {
    relationshipTemplate: IMongoRelationshipTemplatePopulated;
    setRelationshipTemplateWizardDialogState: React.Dispatch<
        React.SetStateAction<{
            isWizardOpen: boolean;
            relationshipTemplate: IMongoRelationshipTemplate | null;
        }>
    >;
    setDeleteRelationshipTemplateDialogState: React.Dispatch<
        React.SetStateAction<{
            isDialogOpen: boolean;
            relationshipTemplateId: string | null;
        }>
    >;
}

const RelationshipTemplateCard: React.FC<RelationshipTemplateCardProps> = ({
    relationshipTemplate,
    setRelationshipTemplateWizardDialogState,
    setDeleteRelationshipTemplateDialogState,
}) => {
    const [isHoverOnCard, setIsHoverOnCard] = useState(false);

    return (
        <ViewingCard
            title={
                <Grid container direction="row" justifyContent="space-between" width="100%" alignItems="center" paddingLeft="20px" flexWrap="nowrap">
                    <Grid item container alignItems="center" gap="10px" flexBasis="90%">
                        <RelationshipTitle relationshipTemplate={relationshipTemplate} />
                    </Grid>
                    <Grid item container flexBasis="10%" width="25px">
                        {isHoverOnCard && (
                            <CardMenu
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
                                disabledProps={{
                                    isDisabled: false,
                                    canEdit: relationshipTemplate.sourceEntity.disabled || relationshipTemplate.destinationEntity.disabled,
                                    tooltipTitle: i18next.t('systemManagement.disabledEntityTemplate'),
                                }}
                            />
                        )}
                    </Grid>
                </Grid>
            }
            onHover={(isHover: boolean) => setIsHoverOnCard(isHover)}
        />
    );
};

const defaultRelationshipTemplate: IMongoRelationshipTemplate = {
    _id: '',
    createdAt: '',
    destinationEntityId: '',
    displayName: '',
    name: '',
    sourceEntityId: '',
    updatedAt: '',
};

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

    const [isSrcRelationChecked, setIsSrcRelationChecked] = useState(true);

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

    const getRelationshipGroupedByEntitiesTemplate = (
        relationships: IMongoRelationshipTemplatePopulated[],
    ): { entityTemplate: IMongoEntityTemplatePopulated; relationships: IMongoRelationshipTemplatePopulated[] }[] => {
        const entitiesToGroupBy = isSrcRelationChecked ? sourceEntityTemplatesToShow : destinationEntityTemplatesToShow;

        const relationsGroupedByEntities: { entityTemplate: IMongoEntityTemplatePopulated; relationships: IMongoRelationshipTemplatePopulated[] }[] =
            [];
        entitiesToGroupBy.forEach((entityTemplate) => {
            const relatedRelations = relationships.filter((relation) => {
                if (isSrcRelationChecked) return relation.sourceEntity._id === entityTemplate._id;
                return relation.destinationEntity._id === entityTemplate._id;
            });

            relationsGroupedByEntities.push({ entityTemplate, relationships: relatedRelations });
        });

        return relationsGroupedByEntities;
    };

    return (
        <Grid item container marginBottom="30px">
            <Grid container alignItems="center" flexWrap="nowrap" flexDirection="row" justifyContent="space-between">
                <Grid item container spacing={1} alignItems="center">
                    <Grid item>
                        <SearchInput
                            value={searchText}
                            onChange={setSearchText}
                            borderRadius="7px"
                            placeholder={i18next.t('globalSearch.searchRelations')}
                        />
                    </Grid>
                    <Grid item>
                        <TemplatesSelectCheckbox
                            title={i18next.t('systemManagement.sourceTemplates')}
                            templates={entityTemplatesArray}
                            selectedTemplates={sourceEntityTemplatesToShow}
                            setSelectedTemplates={setSourceEntityTemplatesToShow}
                            categories={categoriesArray}
                            size="small"
                            isDraggableDisabled
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
                            isDraggableDisabled
                        />
                    </Grid>
                    <Grid item>
                        {sourceEntityTemplatesToShow.length < entityTemplatesArray.length ||
                        destinationEntityTemplatesToShow.length < entityTemplatesArray.length ||
                        searchText.length ? (
                            <IconButton
                                style={{ borderRadius: '5px' }}
                                onClick={() => {
                                    setSearchText('');
                                    setSourceEntityTemplatesToShow(entityTemplatesArray);
                                    setDestinationEntityTemplatesToShow(entityTemplatesArray);
                                }}
                            >
                                <img src="/icons/delete-filters-enable.svg" />
                            </IconButton>
                        ) : (
                            <IconButton style={{ borderRadius: '5px', cursor: 'default' }}>
                                <img src="/icons/delete-filters.svg" />
                            </IconButton>
                        )}
                    </Grid>
                    <Grid item>
                        <IconButton
                            style={{ borderRadius: '5px' }}
                            onClick={() => setRelationshipTemplateWizardDialogState({ isWizardOpen: true, relationshipTemplate: null })}
                        >
                            <img src="/icons/add-new-relation-template.svg" />
                        </IconButton>
                    </Grid>
                </Grid>
                <Grid item>
                    {isSrcRelationChecked ? (
                        <Grid item container flexWrap="nowrap">
                            <IconButton style={{ borderRadius: '5px' }}>
                                <img src="/icons/checked-src-relation.svg" />
                            </IconButton>
                            <IconButton style={{ borderRadius: '5px' }} onClick={() => setIsSrcRelationChecked(false)}>
                                <img src="/icons/unchecked-dest-relation.svg" />
                            </IconButton>
                        </Grid>
                    ) : (
                        <Grid item container flexWrap="nowrap">
                            <IconButton style={{ borderRadius: '5px' }} onClick={() => setIsSrcRelationChecked(true)}>
                                <img src="/icons/unchecked-src-relation.svg" />
                            </IconButton>
                            <IconButton style={{ borderRadius: '5px' }}>
                                <img src="/icons/checked-dest-relation.svg" />
                            </IconButton>
                        </Grid>
                    )}
                </Grid>
            </Grid>

            <Grid container gap="30px" marginTop="30px">
                {getRelationshipGroupedByEntitiesTemplate(
                    Array.from(relationshipTemplates.values())
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
                        ),
                ).map((relationshipTemplateWithEntity) => (
                    <Box
                        header={
                            <Grid
                                item
                                container
                                direction={isSrcRelationChecked ? 'row' : 'row-reverse'}
                                justifyContent="flex-start"
                                alignItems="center"
                                gap="10px"
                                padding="0px 15px"
                            >
                                {relationshipTemplateWithEntity.entityTemplate.iconFileId ? (
                                    <CustomIcon
                                        iconUrl={relationshipTemplateWithEntity.entityTemplate.iconFileId}
                                        height="24px"
                                        width="24px"
                                        color="#9398C2"
                                    />
                                ) : (
                                    <AppRegistrationIcon style={{ color: '#9398C2', ...environment.iconSize }} fontSize="small" />
                                )}
                                <Typography
                                    style={{ fontSize: environment.mainFontSizes.headlineSubTitleFontSize, fontWeight: '400', color: '#9398C2' }}
                                >
                                    {relationshipTemplateWithEntity.entityTemplate.displayName}
                                </Typography>
                                <img src="/icons/arrow-relation-title.svg" />
                            </Grid>
                        }
                        key={relationshipTemplateWithEntity.entityTemplate._id}
                        addingIcon={
                            <IconButton
                                style={{ borderRadius: '5px', width: 'fit-content' }}
                                onClick={() => {
                                    if (isSrcRelationChecked)
                                        setRelationshipTemplateWizardDialogState({
                                            isWizardOpen: true,
                                            relationshipTemplate: {
                                                ...defaultRelationshipTemplate,
                                                sourceEntityId: relationshipTemplateWithEntity.entityTemplate._id,
                                            },
                                        });
                                    else
                                        setRelationshipTemplateWizardDialogState({
                                            isWizardOpen: true,
                                            relationshipTemplate: {
                                                ...defaultRelationshipTemplate,
                                                destinationEntityId: relationshipTemplateWithEntity.entityTemplate._id,
                                            },
                                        });
                                }}
                            >
                                <img src="/icons/add-new-relation-template.svg" />
                            </IconButton>
                        }
                    >
                        {relationshipTemplateWithEntity.relationships.map((relationshipTemplate) => (
                            <RelationshipTemplateCard
                                key={relationshipTemplate._id}
                                relationshipTemplate={relationshipTemplate}
                                setDeleteRelationshipTemplateDialogState={setDeleteRelationshipTemplateDialogState}
                                setRelationshipTemplateWizardDialogState={setRelationshipTemplateWizardDialogState}
                            />
                        ))}
                    </Box>
                ))}
            </Grid>

            <RelationshipTemplateWizard
                open={relationshipTemplateWizardDialogState.isWizardOpen}
                handleClose={() => setRelationshipTemplateWizardDialogState({ isWizardOpen: false, relationshipTemplate: null })}
                initialValues={relationshipTemplateObjectToRelationshipTemplateForm(
                    entityTemplates,
                    relationshipTemplateWizardDialogState.relationshipTemplate,
                )}
                isEditMode={Boolean(relationshipTemplateWizardDialogState.relationshipTemplate?._id)}
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
