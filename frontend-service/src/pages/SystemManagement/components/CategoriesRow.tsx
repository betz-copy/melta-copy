import { AddCircle, Edit, Hive as HiveIcon } from '@mui/icons-material';
import { Grid, IconButton, Typography, useTheme } from '@mui/material';
import { ICategoryMap, IMongoCategory } from '@packages/category';
import { IEntityTemplateMap } from '@packages/entity-template';
import { PermissionScope } from '@packages/permission';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import React, { useState } from 'react';
import { DragDropContext, Draggable, Droppable, DropResult } from 'react-beautiful-dnd';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { CustomIcon } from '../../../common/CustomIcon';
import { AreYouSureDialog } from '../../../common/dialogs/AreYouSureDialog';
import { EntityTemplateColor } from '../../../common/EntityTemplateColor';
import { ErrorToast } from '../../../common/ErrorToast';
import IconButtonWithPopover from '../../../common/IconButtonWithPopover';
import MeltaTooltip from '../../../common/MeltaDesigns/MeltaTooltip';
import { CategoryWizard } from '../../../common/wizards/category';
import { IMongoCategoryOrderConfig } from '../../../interfaces/config';
import { categoryObjectToCategoryForm, deleteCategoryRequest } from '../../../services/templates/categoriesService';
import { updateConfigCategoryOrderRequest } from '../../../services/templates/configService';
import { useUserStore } from '../../../stores/user';
import { useWorkspaceStore } from '../../../stores/workspace';
import { allowedCategories } from '../../../utils/permissions/templatePermissions';
import { mapCategories } from '../../../utils/templates';
import { Box } from './Box';
import { ViewingCard } from './Card';
import { CardMenu } from './CardMenu';
import { CreateButton } from './CreateButton';

interface CategoryCardProps {
    category: IMongoCategory;
    setDeleteCategoryDialogState: React.Dispatch<
        React.SetStateAction<{
            isDialogOpen: boolean;
            categoryId: string | null;
        }>
    >;
    setCategoryWizardDialogState: React.Dispatch<
        React.SetStateAction<{
            isWizardOpen: boolean;
            category: IMongoCategory | null;
        }>
    >;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, setDeleteCategoryDialogState, setCategoryWizardDialogState }) => {
    const workspace = useWorkspaceStore((state) => state.workspace);

    const [isHoverOnCard, setIsHoverOnCard] = useState(false);
    const [isDeleteButtonDisabled, setIsDeleteButtonDisabled] = useState(false);

    const theme = useTheme();
    const queryClient = useQueryClient();

    const templates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates');

    const currentUser = useUserStore((state) => state.user);

    const canEdit =
        currentUser.currentWorkspacePermissions.admin?.scope === PermissionScope.write ||
        (currentUser.currentWorkspacePermissions.templates?.scope === PermissionScope.write &&
            currentUser.currentWorkspacePermissions?.instances?.categories[category._id].scope === 'write');

    const checkCategoryHasTemplates = (categoryId: string) => {
        const hasTemplates = Array.from(templates!.values()).some((template) => template.category._id === categoryId);
        setIsDeleteButtonDisabled(hasTemplates);
    };

    const handleHover = (isHover: boolean) => {
        setIsHoverOnCard(isHover);
        if (isHover) {
            checkCategoryHasTemplates(category._id);
        }
    };

    const categoryCardTooltip = () => {
        if (!canEdit) return i18next.t('wizard.entity.editDisabledDueToTemplates');
        if (isDeleteButtonDisabled) return i18next.t('wizard.entity.deleteDisabledDueToTemplates');
        return '';
    };

    return (
        <ViewingCard
            width={250}
            title={
                <Grid container direction="row" justifyContent="space-between" alignItems="center" paddingLeft="20px" flexWrap="nowrap">
                    <Grid container alignItems="center" gap="10px" flexBasis="90%">
                        <Grid>
                            <EntityTemplateColor entityTemplateColor={category.color} style={{ height: '18px' }} />
                        </Grid>

                        <Grid sx={{ display: 'flex', justifyContent: 'center', alignContent: 'center' }}>
                            {category.iconFileId ? (
                                <CustomIcon color={theme.palette.primary.main} iconUrl={category.iconFileId} height="24px" width="24px" />
                            ) : (
                                <HiveIcon style={{ color: theme.palette.primary.main }} fontSize="small" />
                            )}
                        </Grid>
                        <Grid>
                            <MeltaTooltip title={category.displayName}>
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
                                    {category.displayName}
                                </Typography>
                            </MeltaTooltip>
                        </Grid>
                    </Grid>
                    <Grid container flexBasis="10%">
                        {isHoverOnCard && (
                            <CardMenu
                                onOptionsIconClose={() => setIsHoverOnCard(false)}
                                onEditClick={() => setCategoryWizardDialogState({ isWizardOpen: true, category })}
                                onDeleteClick={() => setDeleteCategoryDialogState({ isDialogOpen: true, categoryId: category._id })}
                                disabledProps={{
                                    isDeleteDisabled: isDeleteButtonDisabled,
                                    isEditDisabled: !canEdit,
                                    tooltipTitle: categoryCardTooltip(),
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

const CategoriesRow: React.FC = () => {
    const workspace = useWorkspaceStore((state) => state.workspace);
    const queryClient = useQueryClient();
    const currentUser = useUserStore((state) => state.user);

    const categories = queryClient.getQueryData<ICategoryMap>('getCategories')!;
    const categoryOrder = queryClient.getQueryData<IMongoCategoryOrderConfig>('getCategoryOrder');
    const allowedCategoriesToShow = allowedCategories(categories, currentUser);

    const { headlineSubTitleFontSize } = workspace.metadata.mainFontSizes;

    const [deleteCategoryDialogState, setDeleteCategoryDialogState] = useState<{
        isDialogOpen: boolean;
        categoryId: string | null;
    }>({
        isDialogOpen: false,
        categoryId: null,
    });

    const [categoryWizardDialogState, setCategoryWizardDialogState] = useState<{
        isWizardOpen: boolean;
        category: IMongoCategory | null;
    }>({
        isWizardOpen: false,
        category: null,
    });

    const { isLoading, mutateAsync } = useMutation((id: string) => deleteCategoryRequest(id), {
        onSuccess: (_data, id) => {
            queryClient.setQueryData<ICategoryMap>('getCategories', (data) => {
                data!.delete(id);
                return data!;
            });

            queryClient.setQueryData<IMongoCategoryOrderConfig>('getCategoryOrder', (categoryConfig) => {
                const { order } = categoryConfig!;
                const index = order.indexOf(id);

                if (index > -1) {
                    order.splice(index, 1);
                }

                return { ...categoryConfig!, order };
            });

            setDeleteCategoryDialogState({ isDialogOpen: false, categoryId: null });
            toast.success(i18next.t('wizard.category.deletedSuccessfully'));
        },
        onError: (err: AxiosError) => {
            toast.error(<ErrorToast axiosError={err} defaultErrorMessage={i18next.t('wizard.category.failedToDelete')} />);
        },
    });

    const { mutateAsync: changeOrder } = useMutation(
        ({ categoryId, newIndex }: { categoryId: string; newIndex: number }) => {
            return updateConfigCategoryOrderRequest(categoryOrder!._id, newIndex, categoryId);
        },
        {
            onSuccess(data) {
                queryClient.setQueryData<IMongoCategoryOrderConfig>('getCategoryOrder', data);
                queryClient.setQueryData<ICategoryMap>('getCategories', mapCategories(allowedCategoriesToShow, data.order));
            },
            onError(error: AxiosError) {
                toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('wizard.category.failedToEdit')} />);
            },
        },
    );

    const onDragEnd = (result: DropResult) => {
        const { source, destination, draggableId } = result;
        if (!destination) {
            return;
        }

        if (source.droppableId === destination.droppableId && source.index !== destination.index) {
            const { _id, ...restCategory } = categories.get(draggableId)!;
            allowedCategoriesToShow.splice(source.index, 1);
            allowedCategoriesToShow.splice(destination.index, 0, { _id, ...restCategory });

            changeOrder({ categoryId: _id, newIndex: destination.index });
        }
    };

    const [isHoverOnBox, setIsHoverOnBox] = useState(false);
    const theme = useTheme();

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <Droppable
                direction="vertical"
                droppableId={workspace._id}
                isDropDisabled={false}
                isCombineEnabled={false}
                ignoreContainerClipping={false}
            >
                {(provided) => (
                    <Grid ref={provided.innerRef} {...provided.droppableProps}>
                        <Grid container gap="10px">
                            <Box
                                header={
                                    <Grid container justifyContent="space-between" alignItems="center" height="40px">
                                        <Typography
                                            style={{
                                                fontSize: headlineSubTitleFontSize,
                                                fontWeight: '400',
                                                color: '#9398C2',
                                            }}
                                        >
                                            {i18next.t('general')}
                                        </Typography>
                                        {isHoverOnBox && (
                                            <IconButton onClick={() => {}}>
                                                <Edit color="primary" />
                                            </IconButton>
                                        )}
                                    </Grid>
                                }
                                addingIcon={
                                    <CreateButton
                                        onClick={() => setCategoryWizardDialogState({ isWizardOpen: true, category: null })}
                                        text={i18next.t('systemManagement.newCategory')}
                                    />
                                }
                                onHover={(isHover: boolean) => setIsHoverOnBox(isHover)}
                            >
                                {categories &&
                                    allowedCategoriesToShow.map((category, index) => {
                                        return (
                                            <Draggable
                                                draggableId={category._id}
                                                key={category._id}
                                                index={index}
                                                isDragDisabled={
                                                    !!(
                                                        !currentUser.currentWorkspacePermissions.admin &&
                                                        currentUser.currentWorkspacePermissions.instances?.categories?.[category._id]?.scope ===
                                                            PermissionScope.read
                                                    )
                                                }
                                            >
                                                {(draggableProvided) => (
                                                    <Grid
                                                        ref={draggableProvided.innerRef}
                                                        {...draggableProvided.draggableProps}
                                                        {...draggableProvided.dragHandleProps}
                                                    >
                                                        <CategoryCard
                                                            key={category._id}
                                                            category={category}
                                                            setCategoryWizardDialogState={setCategoryWizardDialogState}
                                                            setDeleteCategoryDialogState={setDeleteCategoryDialogState}
                                                        />
                                                    </Grid>
                                                )}
                                            </Draggable>
                                        );
                                    })}
                            </Box>

                            {/* TODO - add when category group will be supported */}
                            <Grid>
                                <IconButtonWithPopover
                                    popoverText={i18next.t('soon')}
                                    style={{ display: 'flex', gap: '0.25rem', height: '40px', borderRadius: '5px', cursor: 'default', opacity: 0.5 }}
                                >
                                    <AddCircle color="primary" />
                                    <Typography color={theme.palette.primary.main} sx={{ fontSize: '0.9rem' }}>
                                        {i18next.t('systemManagement.newCollection')}
                                    </Typography>
                                </IconButtonWithPopover>
                            </Grid>

                            <CategoryWizard
                                open={categoryWizardDialogState.isWizardOpen}
                                handleClose={() => setCategoryWizardDialogState({ isWizardOpen: false, category: null })}
                                initialValues={categoryObjectToCategoryForm(categoryWizardDialogState.category)}
                                isEditMode={Boolean(categoryWizardDialogState.category)}
                            />
                            <AreYouSureDialog
                                open={deleteCategoryDialogState.isDialogOpen}
                                handleClose={() => setDeleteCategoryDialogState({ isDialogOpen: false, categoryId: null })}
                                onYes={() => mutateAsync(deleteCategoryDialogState.categoryId!)}
                                isLoading={isLoading}
                            />
                        </Grid>
                    </Grid>
                )}
            </Droppable>
        </DragDropContext>
    );
};

export default CategoriesRow;
