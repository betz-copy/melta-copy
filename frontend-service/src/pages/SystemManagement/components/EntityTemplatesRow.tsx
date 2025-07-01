import { AppRegistration as AppRegistrationIcon, Edit } from '@mui/icons-material';
import { Grid, IconButton, Skeleton, Typography, useTheme } from '@mui/material';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import { keyBy } from 'lodash';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { UseMutateAsyncFunction, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { CustomIcon } from '../../../common/CustomIcon';
import { AreYouSureDialog } from '../../../common/dialogs/AreYouSureDialog';
import { EntityTemplateColor } from '../../../common/EntityTemplateColor';
import { ErrorToast } from '../../../common/ErrorToast';
import { InfiniteScroll } from '../../../common/InfiniteScroll';
import SearchInput from '../../../common/inputs/SearchInput';
import { MeltaTooltip } from '../../../common/MeltaTooltip';
import { SelectCheckbox } from '../../../common/SelectCheckBox';
import { EntityTemplateWizard } from '../../../common/wizards/entityTemplate';
import { environment } from '../../../globals';
import { ICategoryMap, IMongoCategory } from '../../../interfaces/categories';
import { IEntitySingleProperty, IEntityTemplate, IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { PermissionScope } from '../../../interfaces/permissions';
import { IRelationshipTemplateMap } from '../../../interfaces/relationshipTemplates';
import { getCountByTemplateIdsRequest } from '../../../services/entitiesService';
import { updateCategoryRequest, updateCategoryTemplatesOrderRequest } from '../../../services/templates/categoriesService';
import {
    deleteEntityTemplateRequest,
    entityTemplateObjectToEntityTemplateForm,
    updateEntityTemplateRequest,
    updateEntityTemplateStatusRequest,
} from '../../../services/templates/entityTemplatesService';
import { getAllRelationshipTemplatesRequest } from '../../../services/templates/relationshipTemplatesService';
import { useUserStore } from '../../../stores/user';
import { useWorkspaceStore } from '../../../stores/workspace';
import { getEntityTemplateColor } from '../../../utils/colors';
import { getFileName } from '../../../utils/getFileName';
import { checkUserTemplatePermission } from '../../../utils/permissions/instancePermissions';
import { allowedCategories, allowedEntitiesOfCategory, updateUserPermissionForEntityTemplate } from '../../../utils/permissions/templatePermissions';
import { mapTemplates, templatesCompareFunc } from '../../../utils/templates';
import { Box } from './Box';
import { ViewingCard } from './Card';
import { CardMenu } from './CardMenu';
import { CodeEditorDialog } from './codeEditor';
import { CreateButton } from './CreateButton';
import { FilterButton } from './FilterButton';

const { infiniteScrollPageCount } = environment.processInstances;

const defaultEntityTemplatePopulated: IMongoEntityTemplatePopulated = {
    _id: '',
    propertiesOrder: [],
    propertiesTypeOrder: ['properties', 'attachmentProperties'],
    propertiesPreview: [],
    uniqueConstraints: [],
    name: '',
    displayName: '',
    category: { displayName: '', name: '', _id: '', color: '', templatesOrder: [] },
    disabled: false,
    properties: {
        type: 'object',
        properties: {},
        required: [],
        hide: [],
    },
};
interface EntityTemplateCardProps {
    entityTemplate: IMongoEntityTemplatePopulated;
    setEntityTemplateWizardDialogState: React.Dispatch<
        React.SetStateAction<{
            isWizardOpen: boolean;
            entityTemplate: IMongoEntityTemplatePopulated | null;
        }>
    >;
    setDeleteEntityTemplateDialogState: React.Dispatch<
        React.SetStateAction<{
            isDialogOpen: boolean;
            entityTemplateId: string | null;
        }>
    >;
    setAddActionsDialogState: React.Dispatch<
        React.SetStateAction<{
            isWizardOpen: boolean;
            entityTemplate: IMongoEntityTemplatePopulated | null;
        }>
    >;
    updateEntityTemplateStatusAsync: UseMutateAsyncFunction<
        IMongoEntityTemplatePopulated,
        unknown,
        {
            entityTemplateId: string;
            disabled: boolean;
        },
        unknown
    >;
    entityHasWritePermission: boolean;
}

const EntityTemplateCard: React.FC<EntityTemplateCardProps> = ({
    entityTemplate,
    setEntityTemplateWizardDialogState,
    setDeleteEntityTemplateDialogState,
    setAddActionsDialogState,
    updateEntityTemplateStatusAsync,
    entityHasWritePermission,
}) => {
    const workspace = useWorkspaceStore((state) => state.workspace);

    const [isHoverOnCard, setIsHoverOnCard] = useState(false);
    const theme = useTheme();
    const { properties, propertiesOrder, propertiesPreview, propertiesTypeOrder, uniqueConstraints, fieldGroups } = entityTemplate;
    const [isDeleteButtonDisabled, setIsDeleteButtonDisabled] = useState(false);

    const checkEntityTemplateHasEntities = async (templates: IMongoEntityTemplatePopulated[]) => {
        const templateIds = templates.map(({ _id }) => _id);
        const entitiesCountByTemplates = await getCountByTemplateIdsRequest(templateIds);
        const countByTemplateIdMap = new Map(entitiesCountByTemplates.map(({ templateId, count }) => [templateId, count]));
        const templatesHaveEntities = templates.some(({ _id }) => {
            const count = countByTemplateIdMap.get(_id) || 0;
            return count > 0;
        });

        setIsDeleteButtonDisabled(!entityHasWritePermission || templatesHaveEntities);
    };

    const entityTemplateCardTooltip = () => {
        if (!entityHasWritePermission) return i18next.t('systemManagement.entityTemplateEditDisabled');
        if (entityTemplate.disabled) return i18next.t('systemManagement.disabledEntityTemplate');
        if (isDeleteButtonDisabled) return i18next.t('systemManagement.cannotDeleteWithEntities');
        return '';
    };

    const isFile = (value: IEntitySingleProperty) => value.format === 'fileId' || value.items?.format === 'fileId';

    return (
        <ViewingCard
            width={250}
            title={
                <Grid
                    container
                    direction="row"
                    justifyContent="space-between"
                    minWidth="232px"
                    alignItems="center"
                    paddingLeft="20px"
                    flexWrap="nowrap"
                >
                    <Grid item container alignItems="center" gap="10px" flexBasis="90%">
                        <Grid item>
                            <EntityTemplateColor entityTemplateColor={getEntityTemplateColor(entityTemplate)} style={{ height: '18px' }} />
                        </Grid>

                        <Grid item sx={{ display: 'flex', justifyContent: 'center', alignContent: 'center' }}>
                            {entityTemplate.iconFileId ? (
                                <CustomIcon iconUrl={entityTemplate.iconFileId} height="24px" width="24px" />
                            ) : (
                                <AppRegistrationIcon style={{ ...workspace.metadata.iconSize }} fontSize="small" />
                            )}
                        </Grid>
                        <Grid item>
                            <MeltaTooltip title={entityTemplate.displayName}>
                                <Typography
                                    style={{
                                        fontSize: workspace.metadata.mainFontSizes.headlineSubTitleFontSize,
                                        color: theme.palette.primary.main,
                                        fontWeight: '400',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        width: '130px',
                                    }}
                                >
                                    {entityTemplate.displayName}
                                </Typography>
                            </MeltaTooltip>
                        </Grid>
                    </Grid>
                    <Grid item container flexBasis="10%">
                        {isHoverOnCard && (
                            <CardMenu
                                onOptionsIconClose={() => setIsHoverOnCard(false)}
                                onOptionsIconClick={async () => {
                                    await checkEntityTemplateHasEntities([entityTemplate]);
                                }}
                                onEditClick={() => {
                                    setEntityTemplateWizardDialogState({ isWizardOpen: true, entityTemplate });
                                    setIsHoverOnCard(false);
                                }}
                                onDuplicateClick={() => {
                                    setEntityTemplateWizardDialogState({
                                        isWizardOpen: true,
                                        entityTemplate: {
                                            ...defaultEntityTemplatePopulated,
                                            properties,
                                            propertiesOrder,
                                            propertiesPreview,
                                            propertiesTypeOrder,
                                            uniqueConstraints,
                                            fieldGroups,
                                        },
                                    });
                                    setIsHoverOnCard(false);
                                }}
                                onDeleteClick={() => setDeleteEntityTemplateDialogState({ isDialogOpen: true, entityTemplateId: entityTemplate._id })}
                                onAddActionsClick={() => setAddActionsDialogState({ isWizardOpen: true, entityTemplate })}
                                onDisableClick={() => {
                                    updateEntityTemplateStatusAsync({ entityTemplateId: entityTemplate._id, disabled: !entityTemplate.disabled });
                                    setIsHoverOnCard(false);
                                }}
                                disabledProps={{
                                    disableForReadPermissions: !entityHasWritePermission,
                                    isDeleteDisabled: isDeleteButtonDisabled,
                                    isDisabled: entityTemplate.disabled,
                                    isEditDisabled: entityTemplate.disabled || !entityHasWritePermission,
                                    tooltipTitle: entityTemplateCardTooltip(),
                                }}
                            />
                        )}
                    </Grid>
                </Grid>
            }
            expendedCard={
                <Grid container gap="10px" alignItems="center" width="232px" paddingLeft="20px">
                    <Grid item container justifyContent="space-between">
                        <Grid item flexBasis="27%" color={theme.palette.primary.main}>
                            <Typography>{i18next.t('category')}</Typography>
                        </Grid>
                        <Grid item flexBasis="70%">
                            {entityTemplate.category.displayName}
                        </Grid>
                    </Grid>
                    <Grid item container justifyContent="space-between">
                        <Grid item flexBasis="27%" color={theme.palette.primary.main}>
                            <Typography>{i18next.t('wizard.entityTemplate.properties')}</Typography>
                        </Grid>
                    </Grid>
                    {Object.entries(entityTemplate.properties.properties)
                        .filter(([, value]) => !isFile(value))
                        .map(([key, value]) => (
                            <Grid key={key} item container gap="5px" flexWrap="nowrap">
                                <Grid item flexBasis="4%" color={theme.palette.primary.main}>
                                    <Typography>-</Typography>
                                </Grid>
                                <Grid item>
                                    <MeltaTooltip title={value.title}>
                                        <Typography
                                            style={{
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                width: '100px',
                                                textAlign: 'right',
                                            }}
                                        >
                                            {value.title}
                                        </Typography>
                                    </MeltaTooltip>
                                </Grid>
                                <Grid item color={theme.palette.primary.main} fontWeight="400" sx={{ opacity: 0.75 }}>
                                    {value.format === 'user' || value.format === 'signature'
                                        ? i18next.t(`propertyTypes.${value.format}`)
                                        : i18next.t(`propertyTypes.${value.type}`)}
                                </Grid>
                            </Grid>
                        ))}
                    <Grid item container justifyContent="space-between">
                        <Grid item flexBasis="27%" color={theme.palette.primary.main}>
                            <Typography>{i18next.t('wizard.entityTemplate.attachments')}</Typography>
                        </Grid>
                    </Grid>
                    {Object.entries(entityTemplate.properties.properties)
                        .filter(([, value]) => isFile(value))
                        .map(([key, value]) => (
                            <Grid key={key} item container gap="5px">
                                <Grid item flexBasis="4%" color={theme.palette.primary.main}>
                                    <Typography>-</Typography>
                                </Grid>
                                <Grid item>
                                    <MeltaTooltip title={key}>
                                        <Typography
                                            style={{
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                width: '100px',
                                                textAlign: 'right',
                                            }}
                                        >
                                            {key}
                                        </Typography>
                                    </MeltaTooltip>
                                </Grid>
                                <Grid item color={theme.palette.primary.main} fontWeight="400" sx={{ opacity: 0.75 }}>
                                    {i18next.t(`propertyTypes.${value.format === 'fileId' ? value.format : 'multipleFiles'}`)}
                                </Grid>
                            </Grid>
                        ))}
                    {!!entityTemplate.documentTemplatesIds?.length && (
                        <Grid item container justifyContent="space-between">
                            <Grid item color={theme.palette.primary.main}>
                                <Typography>{i18next.t('wizard.entityTemplate.exportDocuments')}</Typography>
                            </Grid>
                        </Grid>
                    )}
                    {entityTemplate.documentTemplatesIds?.map((documentTemplateId) => (
                        <Grid key={documentTemplateId} item container gap="5px">
                            <Grid item flexBasis="4%" color={theme.palette.primary.main}>
                                <Typography>-</Typography>
                            </Grid>
                            <Grid item>
                                <MeltaTooltip title={getFileName(documentTemplateId)}>
                                    <Typography
                                        style={{
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            width: '175px',
                                            textAlign: 'right',
                                        }}
                                    >
                                        {getFileName(documentTemplateId)}
                                    </Typography>
                                </MeltaTooltip>
                            </Grid>
                        </Grid>
                    ))}
                </Grid>
            }
            onHover={(isHover) => setIsHoverOnCard(isHover)}
        />
    );
};

interface CategoryEntitiesBoxProps {
    entityTemplatesWithCategory: {
        category: IMongoCategory;
        entityTemplates: IMongoEntityTemplatePopulated[];
    };
    setEntityTemplateWizardDialogState: React.Dispatch<
        React.SetStateAction<{
            isWizardOpen: boolean;
            entityTemplate: IMongoEntityTemplatePopulated | null;
        }>
    >;
    setDeleteEntityTemplateDialogState: React.Dispatch<
        React.SetStateAction<{
            isDialogOpen: boolean;
            entityTemplateId: string | null;
        }>
    >;
    setAddActionsDialogState: React.Dispatch<
        React.SetStateAction<{
            isWizardOpen: boolean;
            entityTemplate: IMongoEntityTemplatePopulated | null;
        }>
    >;
    updateEntityTemplateStatusAsync: UseMutateAsyncFunction<
        IMongoEntityTemplatePopulated,
        unknown,
        {
            entityTemplateId: string;
            disabled: boolean;
        },
        unknown
    >;
    loadedEntityTemplateId: string;
}

const orderTemplatesInCategory = (templatesOrder: string[], templates: IMongoEntityTemplatePopulated[]): IMongoEntityTemplatePopulated[] => {
    if (templatesOrder) {
        const idToTemplateMap = keyBy(templates, (t) => t._id.toString());

        return templatesOrder
            .map((id) => idToTemplateMap[id])
            .filter((template): template is IMongoEntityTemplatePopulated => template !== undefined);
    }

    return templates;
};

const CategoryEntitiesBox: React.FC<CategoryEntitiesBoxProps> = ({
    entityTemplatesWithCategory,
    setEntityTemplateWizardDialogState,
    setDeleteEntityTemplateDialogState,
    setAddActionsDialogState,
    updateEntityTemplateStatusAsync,
    loadedEntityTemplateId,
}) => {
    const workspace = useWorkspaceStore((state) => state.workspace);
    const currentUser = useUserStore((state) => state.user);

    const [isHoverOnBox, setIsHoverOnBox] = useState(false);
    const [isEditableCategory, setIsEditableCategory] = useState(false);
    const containerWrapperRef = useRef<HTMLDivElement>(null);

    const theme = useTheme();

    useEffect(() => {
        containerWrapperRef.current?.focus();
    }, [isEditableCategory]);

    const { mutateAsync } = useMutation(
        (categoryName: string) =>
            updateCategoryRequest(entityTemplatesWithCategory.category._id, { ...entityTemplatesWithCategory.category, displayName: categoryName }),
        {},
    );

    return (
        <Droppable droppableId={entityTemplatesWithCategory.category._id}>
            {(provided) => (
                <Grid ref={provided.innerRef} {...provided.droppableProps}>
                    <Box
                        key={entityTemplatesWithCategory.category._id}
                        header={
                            <Grid item container justifyContent="space-between" alignItems="center" height="40px" width="284px">
                                <Grid
                                    ref={containerWrapperRef}
                                    contentEditable={isEditableCategory}
                                    style={{
                                        fontSize: workspace.metadata.mainFontSizes.headlineSubTitleFontSize,
                                        fontWeight: '400',
                                        color: isEditableCategory ? theme.palette.primary.main : '#9398C2',
                                        outline: isEditableCategory ? `1px solid ${theme.palette.primary.main}` : '',
                                        borderRadius: '5px',
                                        padding: '5px',
                                        textOverflow: isEditableCategory ? undefined : 'ellipsis',
                                        whiteSpace: isEditableCategory ? undefined : 'nowrap',
                                        overflow: isEditableCategory ? 'auto' : 'hidden',
                                        width: '240px',
                                        maxHeight: '40px',
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.keyCode === 13) {
                                            mutateAsync(containerWrapperRef.current?.textContent || '');
                                            e.preventDefault();
                                            setIsEditableCategory(false);
                                        }
                                    }}
                                    onBlur={() => {
                                        mutateAsync(containerWrapperRef.current?.textContent || '');
                                        setIsEditableCategory(false);
                                    }}
                                >
                                    {entityTemplatesWithCategory.category.displayName}
                                </Grid>
                                {isHoverOnBox && (
                                    <IconButton
                                        onClick={() => {
                                            setIsEditableCategory(true);
                                            containerWrapperRef.current?.focus();
                                        }}
                                        className="edit-btn"
                                    >
                                        <Edit color="primary" />
                                    </IconButton>
                                )}
                            </Grid>
                        }
                        addingIcon={
                            <CreateButton
                                onClick={() =>
                                    setEntityTemplateWizardDialogState({
                                        isWizardOpen: true,
                                        entityTemplate: { ...defaultEntityTemplatePopulated, category: entityTemplatesWithCategory.category },
                                    })
                                }
                                text={i18next.t('systemManagement.newEntityTemplate')}
                            />
                        }
                        onHover={(isHover: boolean) => setIsHoverOnBox(isHover)}
                    >
                        {!!entityTemplatesWithCategory.entityTemplates.length &&
                            entityTemplatesWithCategory.entityTemplates.map((entityTemplate, index) => {
                                const entityHasWritePermission = checkUserTemplatePermission(
                                    currentUser.currentWorkspacePermissions,
                                    entityTemplate.category,
                                    entityTemplate._id,
                                    PermissionScope.write,
                                );

                                return (
                                    <Draggable
                                        draggableId={entityTemplate._id}
                                        key={entityTemplate._id}
                                        index={index}
                                        isDragDisabled={!entityHasWritePermission}
                                    >
                                        {(draggableProvided) => (
                                            <Grid
                                                ref={draggableProvided.innerRef}
                                                {...draggableProvided.draggableProps}
                                                {...draggableProvided.dragHandleProps}
                                            >
                                                {loadedEntityTemplateId === entityTemplate._id ? (
                                                    <Skeleton variant="rounded" height="50px" />
                                                ) : (
                                                    <EntityTemplateCard
                                                        entityTemplate={entityTemplate}
                                                        setDeleteEntityTemplateDialogState={setDeleteEntityTemplateDialogState}
                                                        setEntityTemplateWizardDialogState={setEntityTemplateWizardDialogState}
                                                        setAddActionsDialogState={setAddActionsDialogState}
                                                        updateEntityTemplateStatusAsync={updateEntityTemplateStatusAsync}
                                                        entityHasWritePermission={entityHasWritePermission}
                                                    />
                                                )}
                                            </Grid>
                                        )}
                                    </Draggable>
                                );
                            })}
                    </Box>
                </Grid>
            )}
        </Droppable>
    );
};

const EntityTemplatesRow: React.FC = () => {
    const queryClient = useQueryClient();
    const currentUser = useUserStore((state) => state.user);
    const setUser = useUserStore((state) => state.setUser);
    const currentWorkspace = useWorkspaceStore((state) => state.workspace);

    const categories = queryClient.getQueryData<ICategoryMap>('getCategories')!;
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const allowedCategoriesToShow = allowedCategories(categories, currentUser);
    const [categoriesToShow, setCategoriesToShow] = useState<IMongoCategory[]>(allowedCategoriesToShow);

    const [searchText, setSearchText] = useState('');
    const [loadedEntityTemplateId, setLoadedEntityTemplateId] = useState('');

    const isFilterButtonDisabled = useMemo(
        () => !(categoriesToShow.length < allowedCategoriesToShow.length || searchText.length),
        [categoriesToShow, searchText, allowedCategoriesToShow],
    );

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

    const [addActionsToEntityTemplateDialogState, setAddActionsToEntityTemplateDialogState] = useState<{
        isWizardOpen: boolean;
        entityTemplate: IMongoEntityTemplatePopulated | null;
    }>({
        isWizardOpen: false,
        entityTemplate: null,
    });

    const getEntityTemplatesToShowGroupedByCategories = (
        entityTemplatesToShow: IMongoEntityTemplatePopulated[],
    ): { category: IMongoCategory; entityTemplates: IMongoEntityTemplatePopulated[] }[] => {
        const categoriesToShowMapEntities: { category: IMongoCategory; entityTemplates: IMongoEntityTemplatePopulated[] }[] = [];
        categoriesToShow.forEach((category) => {
            const relatedEntityTemplatesToShow = orderTemplatesInCategory(
                category.templatesOrder,
                entityTemplatesToShow.filter((entity) => entity.category._id === category._id),
            );
            categoriesToShowMapEntities.push({
                category,
                entityTemplates: allowedEntitiesOfCategory(relatedEntityTemplatesToShow, category, currentUser),
            });
        });

        return categoriesToShowMapEntities;
    };

    const { mutateAsync: updateEntityTemplateStatusAsync } = useMutation(
        ({ entityTemplateId, disabled }: { entityTemplateId: string; disabled: boolean }) =>
            updateEntityTemplateStatusRequest(entityTemplateId, disabled),
        {
            onSuccess: (data) => {
                queryClient.setQueryData<IEntityTemplateMap>('getEntityTemplates', (entityTemplateMap) => entityTemplateMap!.set(data._id, data));
                queryClient.invalidateQueries(['searchEntityTemplates', searchText, categoriesToShow]);
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
            onSuccess: async (_data, id) => {
                queryClient.setQueryData<IEntityTemplateMap>('getEntityTemplates', (entityTemplateMap) => {
                    entityTemplateMap!.delete(id);
                    return entityTemplateMap!;
                });

                setDeleteEntityTemplateDialogState({ isDialogOpen: false, entityTemplateId: null });
                queryClient.invalidateQueries(['searchEntityTemplates', searchText, categoriesToShow]);
                toast.success(i18next.t('wizard.entityTemplate.deletedSuccessfully'));
                try {
                    const relationshipTemplates = await getAllRelationshipTemplatesRequest();
                    queryClient.setQueryData<IRelationshipTemplateMap>('getRelationshipTemplates', mapTemplates(relationshipTemplates));
                } catch (error) {
                    toast.error(i18next.t('wizard.failedToUpdateSystemData'));
                }
            },
            onError: (error: AxiosError) => {
                toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('wizard.entityTemplate.failedToDelete')} />);
            },
        },
    );

    const { mutateAsync } = useMutation(
        ({ entityTemplateId, entityTemplate, category }: { entityTemplateId: string; entityTemplate: IEntityTemplate; category: IMongoCategory }) => {
            setLoadedEntityTemplateId(entityTemplateId);

            return updateEntityTemplateRequest(
                entityTemplateId,
                {
                    ...entityTemplate,
                    category: category._id,
                },
                queryClient,
            );
        },

        {
            onSuccess(data) {
                queryClient.setQueryData<IEntityTemplateMap>('getEntityTemplates', (entityTemplateMap) => entityTemplateMap!.set(data._id, data));
                queryClient.invalidateQueries(['searchEntityTemplates', searchText, categoriesToShow]);
                const updatedUserPermissions = updateUserPermissionForEntityTemplate(data, currentUser, currentWorkspace._id);
                setUser(updatedUserPermissions);
                setLoadedEntityTemplateId('');
            },
            onError(error: AxiosError) {
                toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('wizard.entityTemplate.failedToEdit')} />);
                setLoadedEntityTemplateId('');
            },
        },
    );

    const { mutateAsync: mutateOrderAsync } = useMutation(
        ({
            templateId,
            newIndex,
            srcCategoryId,
            newCategoryId,
        }: {
            templateId: string;
            newIndex: number;
            srcCategoryId: string;
            newCategoryId: string;
        }) => {
            return updateCategoryTemplatesOrderRequest(templateId, newIndex, srcCategoryId, newCategoryId);
        },
        {
            onSuccess(data) {
                queryClient.setQueryData<ICategoryMap>('getCategories', (categoryMap) => categoryMap!.set(data.newCategory._id, data.newCategory));
                setCategoriesToShow(
                    categoriesToShow.map((category) => {
                        if (category._id === data.newCategory._id) return data.newCategory;

                        if (category._id === data.oldCategory._id) return data.oldCategory;

                        return category;
                    }),
                );
                queryClient.invalidateQueries(['searchEntityTemplates', searchText, categoriesToShow]);
                setLoadedEntityTemplateId('');
            },
            onError(error: AxiosError) {
                toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('wizard.entityTemplate.failedToEdit')} />);
                setLoadedEntityTemplateId('');
            },
        },
    );

    const onDragEnd = (result) => {
        if (!result.destination) {
            return;
        }

        if (result.source.droppableId === result.destination.droppableId) {
            mutateOrderAsync({
                templateId: result.draggableId,
                newIndex: result.destination.index,
                srcCategoryId: result.source.droppableId,
                newCategoryId: result.destination.droppableId,
            });
        } else {
            const { category, ...restEntityTemp } = entityTemplates.get(result.draggableId)!;

            mutateAsync({
                entityTemplateId: result.draggableId,
                entityTemplate: { ...restEntityTemp, category: category._id },
                category: categories.get(result.destination.droppableId)!,
            }).then(() =>
                mutateOrderAsync({
                    templateId: result.draggableId,
                    newIndex: result.destination.index,
                    srcCategoryId: result.source.droppableId,
                    newCategoryId: result.destination.droppableId,
                }),
            );
        }
    };

    useEffect(() => {
        setCategoriesToShow(categoriesToShow.map((category) => categories.get(category._id)!));
    }, [categories]);

    return (
        <Grid item container>
            <Grid container spacing={1} alignItems="center">
                <Grid item>
                    <SearchInput placeholder={i18next.t('globalSearch.searchLabel')} borderRadius="7px" onChange={setSearchText} value={searchText} />
                </Grid>
                <Grid item>
                    <SelectCheckbox
                        title={i18next.t('categories')}
                        options={allowedCategoriesToShow}
                        selectedOptions={categoriesToShow}
                        setSelectedOptions={setCategoriesToShow}
                        getOptionId={(category) => category._id}
                        getOptionLabel={(category) => category.displayName}
                        size="small"
                        isDraggableDisabled
                        horizontalOrigin={156}
                    />
                </Grid>
                <Grid item>
                    <FilterButton
                        onClick={() => {
                            setSearchText('');
                            setCategoriesToShow(allowedCategoriesToShow);
                        }}
                        text={i18next.t('entitiesTableOfTemplate.resetFilters')}
                        disabled={isFilterButtonDisabled}
                    />
                </Grid>
            </Grid>

            <DragDropContext onDragEnd={onDragEnd}>
                <Grid container gap="30px" marginTop="30px">
                    <InfiniteScroll<{
                        category: IMongoCategory;
                        entityTemplates: IMongoEntityTemplatePopulated[];
                    }>
                        queryKey={['searchEntityTemplates', searchText, categoriesToShow]}
                        queryFunction={({ pageParam }) => {
                            return getEntityTemplatesToShowGroupedByCategories(
                                Array.from(entityTemplates.values())
                                    .filter(
                                        (entityTemplate) =>
                                            categoriesToShow.some((categoryToShow) => categoryToShow._id === entityTemplate.category._id) &&
                                            (searchText === '' || entityTemplate.displayName.includes(searchText)),
                                    )
                                    .sort((a, b) => {
                                        const res = templatesCompareFunc(a, b);
                                        if (res === 0) return Number(a.disabled) - Number(b.disabled);
                                        return res;
                                    }),
                            ).splice(pageParam, infiniteScrollPageCount);
                        }}
                        onQueryError={(error) => {
                            console.error('failed to search process templates error:', error);
                            toast.error(i18next.t('failedToLoadResults'));
                        }}
                        getItemId={(entityTemplatesWithCategory) => entityTemplatesWithCategory.category._id}
                        getNextPageParam={(lastPage, allPages) => {
                            const nextPage = allPages.length * infiniteScrollPageCount;
                            return lastPage.length ? nextPage : undefined;
                        }}
                        endText={i18next.t('noSearchLeft')}
                        emptyText={i18next.t('failedToGetTemplates')}
                        useContainer={false}
                    >
                        {(entityTemplatesWithCategory) => (
                            <Grid item key={entityTemplatesWithCategory.category._id}>
                                <CategoryEntitiesBox
                                    entityTemplatesWithCategory={entityTemplatesWithCategory}
                                    setEntityTemplateWizardDialogState={setEntityTemplateWizardDialogState}
                                    setDeleteEntityTemplateDialogState={setDeleteEntityTemplateDialogState}
                                    updateEntityTemplateStatusAsync={updateEntityTemplateStatusAsync}
                                    loadedEntityTemplateId={loadedEntityTemplateId}
                                    setAddActionsDialogState={setAddActionsToEntityTemplateDialogState}
                                />
                            </Grid>
                        )}
                    </InfiniteScroll>
                </Grid>
            </DragDropContext>
            <EntityTemplateWizard
                open={entityTemplateWizardDialogState.isWizardOpen}
                handleClose={() => setEntityTemplateWizardDialogState({ isWizardOpen: false, entityTemplate: null })}
                initialValues={entityTemplateObjectToEntityTemplateForm(entityTemplateWizardDialogState.entityTemplate, queryClient)}
                isEditMode={Boolean(entityTemplateWizardDialogState.entityTemplate?._id)}
                initialStep={entityTemplateWizardDialogState.entityTemplate?.category._id ? 1 : 0}
            />
            <AreYouSureDialog
                open={deleteEntityTemplateDialogState.isDialogOpen}
                handleClose={() => setDeleteEntityTemplateDialogState({ isDialogOpen: false, entityTemplateId: null })}
                onYes={() => deleteTemplateMutateAsync(deleteEntityTemplateDialogState.entityTemplateId!)}
                isLoading={deleteTemplateIsLoading}
            />
            <CodeEditorDialog
                open={addActionsToEntityTemplateDialogState.isWizardOpen}
                handleClose={() => setAddActionsToEntityTemplateDialogState({ isWizardOpen: false, entityTemplate: null })}
                entityTemplate={addActionsToEntityTemplateDialogState.entityTemplate}
                searchText={searchText}
                categoriesToShow={categoriesToShow}
            />
        </Grid>
    );
};

export { EntityTemplatesRow };
