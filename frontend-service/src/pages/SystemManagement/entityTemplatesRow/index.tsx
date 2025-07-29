import { Grid } from '@mui/material';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import { keyBy } from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { AreYouSureDialog } from '../../../common/dialogs/AreYouSureDialog';
import { CreateChildTemplateDialog } from '../../../common/dialogs/createChildTemplate';
import { ErrorToast } from '../../../common/ErrorToast';
import { InfiniteScroll } from '../../../common/InfiniteScroll';
import SearchInput from '../../../common/inputs/SearchInput';
import { SelectCheckbox } from '../../../common/SelectCheckBox';
import { EntityTemplateWizard } from '../../../common/wizards/entityTemplate';
import { environment } from '../../../globals';
import { ICategoryMap, IMongoCategory } from '../../../interfaces/categories';
import { IChildTemplateMap, IMongoChildTemplatePopulated, TemplateItem } from '../../../interfaces/childTemplates';
import { IEntityTemplate, IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { IRelationshipTemplateMap } from '../../../interfaces/relationshipTemplates';
import { updateCategoryTemplatesOrderRequest } from '../../../services/templates/categoriesService';
import { deleteChildTemplate } from '../../../services/templates/childTemplatesService';
import {
    deleteEntityTemplateRequest,
    entityTemplateObjectToEntityTemplateForm,
    updateEntityTemplateRequest,
    updateEntityTemplateStatusRequest,
} from '../../../services/templates/entityTemplatesService';
import { getAllRelationshipTemplatesRequest } from '../../../services/templates/relationshipTemplatesService';
import { useUserStore } from '../../../stores/user';
import { useWorkspaceStore } from '../../../stores/workspace';
import { allowedCategories, allowedEntitiesOfCategory, updateUserPermissionForEntityTemplate } from '../../../utils/permissions/templatePermissions';
import { mapTemplates, templatesCompareFunc } from '../../../utils/templates';
import { CodeEditorDialog } from '../components/codeEditor';
import { FilterButton } from '../components/FilterButton';
import CategoryEntitiesBox from './CategoryEntitiesBox';

const { infiniteScrollPageCount } = environment.processInstances;

export const defaultEntityTemplatePopulated: IMongoEntityTemplatePopulated = {
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

const orderTemplatesInCategory = (templatesOrder: string[], templates: IMongoEntityTemplatePopulated[]): IMongoEntityTemplatePopulated[] => {
    if (templatesOrder) {
        const idToTemplateMap = keyBy(templates, (t) => t._id.toString());

        return templatesOrder
            .map((id) => idToTemplateMap[id])
            .filter((template): template is IMongoEntityTemplatePopulated => template !== undefined);
    }

    return templates;
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
        entityTemplate: TemplateItem | null;
    }>({
        isWizardOpen: false,
        entityTemplate: null,
    });

    const [addChildTemplateDialogState, setAddChildTemplateDialogState] = useState<{
        isWizardOpen: boolean;
        entityTemplate: IMongoEntityTemplatePopulated | null;
        childTemplate?: IMongoChildTemplatePopulated;
    }>({
        isWizardOpen: false,
        entityTemplate: null,
    });

    const searchEntityTemplatesQueryKey = useMemo(() => ['searchEntityTemplates', searchText, categoriesToShow], [searchText, categoriesToShow]);

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
                queryClient.invalidateQueries(searchEntityTemplatesQueryKey);
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
                queryClient.invalidateQueries(searchEntityTemplatesQueryKey);
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

    const { mutateAsync: deleteChildTemplateMutateAsync } = useMutation((id: string) => deleteChildTemplate(id), {
        onSuccess: async (_data, id) => {
            queryClient.setQueryData<IChildTemplateMap>('getChildEntityTemplates', (prev) => {
                const updated = new Map(prev);
                updated.delete(id);
                return updated;
            });

            queryClient.invalidateQueries('getChildEntityTemplates');
            queryClient.invalidateQueries('getEntityTemplates');
            setDeleteEntityTemplateDialogState({ isDialogOpen: false, entityTemplateId: null });
            toast.success(i18next.t('entityTemplatesRow.succeededToDeleteEntityTemplate'));
        },
        onError: (error: AxiosError) => {
            toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('entityTemplatesRow.failedToDeleteEntityTemplate')} />);
        },
    });

    const handleDelete = async () => {
        const templateId = deleteEntityTemplateDialogState.entityTemplateId;
        if (!templateId) return;

        const childTemplates = queryClient.getQueryData<IChildTemplateMap>('getChildEntityTemplates');
        const isChildTemplate = childTemplates?.has(templateId);

        try {
            if (isChildTemplate) {
                await deleteChildTemplateMutateAsync(templateId);
            } else {
                await deleteTemplateMutateAsync(templateId);
            }
        } catch (error) {
            console.error('Failed to delete child entity template:', error);
        }
    };

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
            onSuccess({ template: data, childTemplates }) {
                queryClient.setQueryData<IEntityTemplateMap>('getEntityTemplates', (entityTemplateMap) => entityTemplateMap!.set(data._id, data));
                queryClient.setQueryData<IChildTemplateMap>('getChildEntityTemplates', (childTemplateMap) => {
                    childTemplates.forEach((child) => childTemplateMap!.set(child._id, child));
                    return childTemplateMap!;
                });

                queryClient.invalidateQueries(searchEntityTemplatesQueryKey);
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
            onSuccess(data, { templateId }) {
                queryClient.setQueryData<ICategoryMap>('getCategories', (categoryMap) => categoryMap!.set(data.newCategory._id, data.newCategory));
                setCategoriesToShow(
                    categoriesToShow.map((category) => {
                        if (category._id === data.newCategory._id) return data.newCategory;

                        if (category._id === data.oldCategory._id) return data.oldCategory;

                        return category;
                    }),
                );
                queryClient.invalidateQueries(searchEntityTemplatesQueryKey);
                queryClient.setQueryData<IChildTemplateMap>('getChildEntityTemplates', (childTemplateMap) => {
                    Array.from(childTemplateMap!).forEach(([key, child]) => {
                        const parentId = child.parentTemplate.category.toString();
                        if (parentId === data.oldCategory._id && parentId !== data.newCategory._id && child.parentTemplate._id === templateId) {
                            childTemplateMap!.set(key, {
                                ...child,
                                parentTemplate: { ...child.parentTemplate, category: data.newCategory._id },
                            });
                        }
                    });

                    return childTemplateMap!;
                });
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
                        queryKey={searchEntityTemplatesQueryKey}
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
                                    setAddChildTemplateDialogState={setAddChildTemplateDialogState}
                                    searchText={searchText}
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
                searchEntityTemplatesQueryKey={searchEntityTemplatesQueryKey}
            />
            <AreYouSureDialog
                open={deleteEntityTemplateDialogState.isDialogOpen}
                title={i18next.t('entityTemplatesRow.areYouSureDeleteEntityTemplate')}
                body={i18next.t('entityTemplatesRow.areYouSureDeleteEntityTemplateContent')}
                handleClose={() => setDeleteEntityTemplateDialogState({ isDialogOpen: false, entityTemplateId: null })}
                onYes={handleDelete}
                isLoading={deleteTemplateIsLoading}
            />
            <CodeEditorDialog
                open={addActionsToEntityTemplateDialogState.isWizardOpen}
                handleClose={() => setAddActionsToEntityTemplateDialogState({ isWizardOpen: false, entityTemplate: null })}
                templateItem={addActionsToEntityTemplateDialogState.entityTemplate}
                searchText={searchText}
                categoriesToShow={categoriesToShow}
            />
            <CreateChildTemplateDialog
                open={addChildTemplateDialogState.isWizardOpen}
                handleClose={() => setAddChildTemplateDialogState({ isWizardOpen: false, entityTemplate: null })}
                entityTemplate={addChildTemplateDialogState.entityTemplate}
                childTemplate={addChildTemplateDialogState.childTemplate}
            />
        </Grid>
    );
};

export default EntityTemplatesRow;
