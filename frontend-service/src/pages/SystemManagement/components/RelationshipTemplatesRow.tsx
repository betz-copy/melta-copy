import { AppRegistration as AppRegistrationIcon, ArrowBack } from '@mui/icons-material';
import { Grid, IconButton, Typography, useTheme } from '@mui/material';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import React, { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { CustomIcon } from '../../../common/CustomIcon';
import { AreYouSureDialog } from '../../../common/dialogs/AreYouSureDialog';
import { ErrorToast } from '../../../common/ErrorToast';
import { InfiniteScroll } from '../../../common/InfiniteScroll';
import SearchInput from '../../../common/inputs/SearchInput';
import { RelationshipTitle } from '../../../common/RelationshipTitle';
import TemplatesSelectCheckbox from '../../../common/templatesSelectCheckbox';
import { RelationshipTemplateWizard } from '../../../common/wizards/relationshipTemplate';
import { ICategoryMap } from '../../../interfaces/categories';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { IMongoRelationshipTemplate, IMongoRelationshipTemplatePopulated, IRelationshipTemplateMap } from '../../../interfaces/relationshipTemplates';
import {
    convertToRelationshipFieldRequest,
    deleteRelationshipTemplateRequest,
    relationshipTemplateObjectToRelationshipTemplateForm,
} from '../../../services/templates/relationshipTemplatesService';
import { filterRelationships } from '../../../utils/relationshipTemplateManagement';
import { getRelationshipInstancesCountByTemplateIdRequest } from '../../../services/entitiesService';
import { populateRelationshipTemplate } from '../../../utils/templates';
import { Box } from './Box';
import { ViewingCard } from './Card';
import { CardMenu } from './CardMenu';
import { CreateButton } from './CreateButton';
import { FilterButton } from './FilterButton';
import { useWorkspaceStore } from '../../../stores/workspace';
import { environment } from '../../../globals';
import { ConvertToRelationship } from '../../../common/wizards/relationshipTemplate/convertRelationshipToRelationshipField';
import { IRelationshipReference } from '../../../common/wizards/entityTemplate/commonInterfaces';

const { infiniteScrollPageCount } = environment.processInstances;

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
    setConvertToRelationshipFieldDialogState: React.Dispatch<
        React.SetStateAction<{
            isDialogOpen: boolean;
            relationshipTemplate: IMongoRelationshipTemplate | null;
        }>
    >;
}

const RelationshipTemplateCard: React.FC<RelationshipTemplateCardProps> = ({
    relationshipTemplate,
    setRelationshipTemplateWizardDialogState,
    setDeleteRelationshipTemplateDialogState,
    setConvertToRelationshipFieldDialogState,
}) => {
    const [isHoverOnCard, setIsHoverOnCard] = useState(false);
    const [isDeleteButtonDisabled, setIsDeleteButtonDisabled] = useState(false);

    const { isProperty } = relationshipTemplate;

    const checkRelationshipTemplateHasRelationships = async () => {
        const relationshipsCountByTemplates = await getRelationshipInstancesCountByTemplateIdRequest(relationshipTemplate._id);
        setIsDeleteButtonDisabled(relationshipsCountByTemplates > 0);
    };

    const handleHover = (isHover: boolean) => {
        setIsHoverOnCard(isHover);
    };
    return (
        <ViewingCard
            title={
                <Grid
                    color={isProperty ? 'darkgrey' : 'black'}
                    container
                    direction="row"
                    justifyContent="space-between"
                    width="100%"
                    alignItems="center"
                    paddingLeft="20px"
                    flexWrap="nowrap"
                >
                    <Grid item container alignItems="center" gap="10px" flexBasis="90%">
                        <RelationshipTitle relationshipTemplate={relationshipTemplate} />
                    </Grid>
                    <Grid item container flexBasis="10%" width="25px">
                        {isHoverOnCard && !isProperty && (
                            <CardMenu
                                onOptionsIconClick={async () => {
                                    await checkRelationshipTemplateHasRelationships();
                                }}
                                onOptionsIconClose={() => setIsHoverOnCard(false)}
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
                                onDeleteClick={() => {
                                    setDeleteRelationshipTemplateDialogState({
                                        isDialogOpen: true,
                                        relationshipTemplateId: relationshipTemplate._id,
                                    });
                                }}
                                onConvertToRelationShipFieldClick={() => {
                                    const { sourceEntity, destinationEntity, ...restOfRelationshipTemplate } = relationshipTemplate;
                                    setConvertToRelationshipFieldDialogState({
                                        isDialogOpen: true,
                                        relationshipTemplate: {
                                            sourceEntityId: sourceEntity._id,
                                            destinationEntityId: destinationEntity._id,
                                            ...restOfRelationshipTemplate,
                                        },
                                    });
                                }}
                                disabledProps={{
                                    isDeleteDisabled: isDeleteButtonDisabled,
                                    tooltipTitle: isDeleteButtonDisabled ? i18next.t('systemManagement.cannotDeleteWithRelationship') : '',
                                    isEditDisabled: relationshipTemplate.sourceEntity.disabled || relationshipTemplate.destinationEntity.disabled,
                                    editTooltipTitle: i18next.t('systemManagement.cannotPerformActionEntityDisabled'),
                                }}
                            />
                        )}
                    </Grid>
                </Grid>
            }
            onHover={handleHover}
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
    const workspace = useWorkspaceStore((state) => state.workspace);
    const config = workspace.metadata;

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

    const isFilterButtonDisabled = useMemo(
        () =>
            !(
                sourceEntityTemplatesToShow.length < entityTemplatesArray.length ||
                destinationEntityTemplatesToShow.length < entityTemplatesArray.length ||
                searchText.length
            ),
        [destinationEntityTemplatesToShow, entityTemplatesArray, searchText, sourceEntityTemplatesToShow],
    );

    const [deleteRelationshipTemplateDialogState, setDeleteRelationshipTemplateDialogState] = useState<{
        isDialogOpen: boolean;
        relationshipTemplateId: string | null;
    }>({
        isDialogOpen: false,
        relationshipTemplateId: null,
    });

    const [convertToRelationshipFieldDialogState, setConvertToRelationshipFieldDialogState] = useState<{
        isDialogOpen: boolean;
        relationshipTemplate: IMongoRelationshipTemplate | null;
    }>({
        isDialogOpen: false,
        relationshipTemplate: null,
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
            queryClient.invalidateQueries(['searchRelationshipTemplates', searchText]);
            toast.success(i18next.t('wizard.relationshipTemplate.deletedSuccessfully'));
        },
        onError: (error: AxiosError) => {
            toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('wizard.relationshipTemplate.failedToDelete')} />);
        },
    });

    const { isLoading: convertToRelationshipFieldLoading, mutateAsync: convertRelationshipToRelationShipFieldRequest } = useMutation(
        ({
            id,
            fieldName,
            displayFieldName,
            relationshipReference,
        }: {
            id: string;
            fieldName: string;
            displayFieldName: string;
            relationshipReference: IRelationshipReference;
        }) =>
            convertToRelationshipFieldRequest(id, {
                fieldName,
                displayFieldName,
                relationshipReference,
            }),
        {
            onSuccess: ({ updatedRelationShipTemplate, updatedEntityTemplate }, { id }) => {
                queryClient.setQueryData<IRelationshipTemplateMap>('getRelationshipTemplates', (relationshipTemplateMap) =>
                    relationshipTemplateMap!.set(id, updatedRelationShipTemplate),
                );

                queryClient.setQueryData<IEntityTemplateMap>('getEntityTemplates', (entityTemplateMap) =>
                    entityTemplateMap!.set(updatedEntityTemplate._id, updatedEntityTemplate),
                );
                queryClient.invalidateQueries();

                toast.success(i18next.t('wizard.relationshipTemplate.convertToRelationshipFieldSuccessfully'));
            },
            onError: (error: AxiosError) => {
                toast.error(
                    <ErrorToast
                        axiosError={error}
                        defaultErrorMessage={i18next.t('wizard.relationshipTemplate.failedToConvertToRelationshipField')}
                    />,
                );
            },
        },
    );

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

            if (relatedRelations.length > 0) {
                relationsGroupedByEntities.push({ entityTemplate, relationships: relatedRelations });
            }
        });

        return relationsGroupedByEntities;
    };

    const theme = useTheme();

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
                        <FilterButton
                            onClick={() => {
                                setSearchText('');
                                setSourceEntityTemplatesToShow(entityTemplatesArray);
                                setDestinationEntityTemplatesToShow(entityTemplatesArray);
                            }}
                            disabled={isFilterButtonDisabled}
                            text={i18next.t('entitiesTableOfTemplate.resetFilters')}
                        />
                    </Grid>
                    <Grid item sx={{ display: 'flex', justifyContent: 'center', alignContent: 'center' }}>
                        <CreateButton
                            onClick={() => setRelationshipTemplateWizardDialogState({ isWizardOpen: true, relationshipTemplate: null })}
                            text={i18next.t('systemManagement.newRelationshipTemplate')}
                        />
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
                <InfiniteScroll<{
                    entityTemplate: IMongoEntityTemplatePopulated;
                    relationships: IMongoRelationshipTemplatePopulated[];
                }>
                    queryKey={['searchRelationshipTemplates', searchText, sourceEntityTemplatesToShow, destinationEntityTemplatesToShow]}
                    queryFunction={({ pageParam }) => {
                        return getRelationshipGroupedByEntitiesTemplate(
                            filterRelationships({
                                relationshipTemplates: Array.from(relationshipTemplates.values()).map((relationshipTemplate) =>
                                    populateRelationshipTemplate(relationshipTemplate, entityTemplates),
                                ),
                                destinationEntityTemplatesToShow,
                                sourceEntityTemplatesToShow,
                                searchText,
                            }),
                        )
                            .filter((group) => group.relationships.length > 0)
                            .splice(pageParam, infiniteScrollPageCount);
                    }}
                    onQueryError={(error) => {
                        // eslint-disable-next-line no-console
                        console.log('failed to search process templates error:', error);
                        toast.error(i18next.t('failedToLoadResults'));
                    }}
                    getItemId={(relationshipTemplateWithEntity) => relationshipTemplateWithEntity.entityTemplate._id}
                    getNextPageParam={(lastPage, allPages) => {
                        const nextPage = allPages.length * infiniteScrollPageCount;
                        return lastPage.length ? nextPage : undefined;
                    }}
                    endText={i18next.t('noSearchLeft')}
                    emptyText={i18next.t('failedToGetTemplates')}
                    useContainer={false}
                >
                    {(relationshipTemplateWithEntity) => (
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
                                    sx={{ display: 'flex', justifyContent: 'center', alignContent: 'center' }}
                                >
                                    {relationshipTemplateWithEntity.entityTemplate.iconFileId ? (
                                        <CustomIcon
                                            iconUrl={relationshipTemplateWithEntity.entityTemplate.iconFileId}
                                            height="24px"
                                            width="24px"
                                            color={theme.palette.primary.main}
                                        />
                                    ) : (
                                        <AppRegistrationIcon color="primary" style={config.iconSize} fontSize="small" />
                                    )}
                                    <Typography
                                        color={theme.palette.primary.main}
                                        style={{ fontSize: config.mainFontSizes.headlineSubTitleFontSize, fontWeight: '400' }}
                                    >
                                        {relationshipTemplateWithEntity.entityTemplate.displayName}
                                    </Typography>
                                    <ArrowBack color="primary" fontSize="small" />
                                </Grid>
                            }
                            key={relationshipTemplateWithEntity.entityTemplate._id}
                            addingIcon={
                                <CreateButton
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
                                    text={i18next.t('systemManagement.newRelationshipTemplate')}
                                />
                            }
                        >
                            {relationshipTemplateWithEntity.relationships.map((relationshipTemplate) => (
                                <RelationshipTemplateCard
                                    key={relationshipTemplate._id}
                                    relationshipTemplate={relationshipTemplate}
                                    setDeleteRelationshipTemplateDialogState={setDeleteRelationshipTemplateDialogState}
                                    setRelationshipTemplateWizardDialogState={setRelationshipTemplateWizardDialogState}
                                    setConvertToRelationshipFieldDialogState={setConvertToRelationshipFieldDialogState}
                                />
                            ))}
                        </Box>
                    )}
                </InfiniteScroll>
            </Grid>

            <RelationshipTemplateWizard
                open={relationshipTemplateWizardDialogState.isWizardOpen}
                handleClose={() => setRelationshipTemplateWizardDialogState({ isWizardOpen: false, relationshipTemplate: null })}
                initialValues={relationshipTemplateObjectToRelationshipTemplateForm(
                    entityTemplates!,
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
            <ConvertToRelationship
                open={convertToRelationshipFieldDialogState.isDialogOpen}
                handleClose={() => setConvertToRelationshipFieldDialogState({ isDialogOpen: false, relationshipTemplate: null })}
                onYes={({ fieldName, displayFieldName, relationshipReference }) =>
                    convertRelationshipToRelationShipFieldRequest({
                        id: convertToRelationshipFieldDialogState.relationshipTemplate?._id!,
                        fieldName,
                        displayFieldName,
                        relationshipReference,
                    })
                }
                isLoading={convertToRelationshipFieldLoading}
                relationshipTemplate={convertToRelationshipFieldDialogState.relationshipTemplate}
            />
        </Grid>
    );
};

export { RelationshipTemplatesRow };
