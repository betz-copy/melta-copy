import { AddCircle, Edit, Hive as HiveIcon } from '@mui/icons-material';
import { Grid, IconButton, Typography, useTheme } from '@mui/material';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import React, { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { ICategoryMap, IEntityTemplateMap, IMongoCategory, PermissionScope } from '@microservices/shared-interfaces';
import { ViewingCard } from './Card';
import { CustomIcon } from '../../../common/CustomIcon';
import { AreYouSureDialog } from '../../../common/dialogs/AreYouSureDialog';
import { EntityTemplateColor } from '../../../common/EntityTemplateColor';
import { useUserStore } from '../../../stores/user';
import { ErrorToast } from '../../../common/ErrorToast';
import IconButtonWithPopover from '../../../common/IconButtonWithPopover';
import { MeltaTooltip } from '../../../common/MeltaTooltip';
import { CategoryWizard } from '../../../common/wizards/category';
import { categoryObjectToCategoryForm, deleteCategoryRequest } from '../../../services/templates/categoriesService';
import { Box } from './Box';
import { CardMenu } from './CardMenu';
import { CreateButton } from './CreateButton';
import { useWorkspaceStore } from '../../../stores/workspace';

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
        currentUser.currentWorkspacePermissions.templates?.scope === PermissionScope.write ||
        currentUser.currentWorkspacePermissions.admin?.scope === PermissionScope.write;

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

    return (
        <ViewingCard
            width={250}
            title={
                <Grid container direction="row" justifyContent="space-between" alignItems="center" paddingLeft="20px" flexWrap="nowrap">
                    <Grid item container alignItems="center" gap="10px" flexBasis="90%">
                        <Grid item>
                            <EntityTemplateColor entityTemplateColor={category.color} style={{ height: '18px' }} />
                        </Grid>

                        <Grid item sx={{ display: 'flex', justifyContent: 'center', alignContent: 'center' }}>
                            {category.iconFileId ? (
                                <CustomIcon color={theme.palette.primary.main} iconUrl={category.iconFileId} height="24px" width="24px" />
                            ) : (
                                <HiveIcon style={{ color: theme.palette.primary.main }} fontSize="small" />
                            )}
                        </Grid>
                        <Grid item>
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
                    <Grid item container flexBasis="10%">
                        {isHoverOnCard && (
                            <CardMenu
                                onOptionsIconClose={() => setIsHoverOnCard(false)}
                                onEditClick={() => setCategoryWizardDialogState({ isWizardOpen: true, category })}
                                onDeleteClick={() => setDeleteCategoryDialogState({ isDialogOpen: true, categoryId: category._id })}
                                disabledProps={{
                                    isDeleteDisabled: isDeleteButtonDisabled,
                                    isEditDisabled: !canEdit,
                                    tooltipTitle: isDeleteButtonDisabled ? i18next.t('wizard.entity.deleteDisabledDueToTemplates') : '',
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
    const { headlineSubTitleFontSize } = workspace.metadata.mainFontSizes;

    const queryClient = useQueryClient();
    const categories = queryClient.getQueryData<ICategoryMap>('getCategories')!;

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

            setDeleteCategoryDialogState({ isDialogOpen: false, categoryId: null });
            toast.success(i18next.t('wizard.category.deletedSuccessfully'));
        },
        onError: (err: AxiosError<{ metadata: { errorCode: string } }>) => {
            toast.error(<ErrorToast axiosError={err} defaultErrorMessage={i18next.t('wizard.category.failedToDelete')} />);
        },
    });

    const [isHoverOnBox, setIsHoverOnBox] = useState(false);
    const theme = useTheme();

    return (
        <Grid item container gap="10px">
            <Box
                header={
                    <Grid item container justifyContent="space-between" alignItems="center" height="40px">
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
                    Array.from(categories.values(), (category) => (
                        <CategoryCard
                            key={category._id}
                            category={category}
                            setCategoryWizardDialogState={setCategoryWizardDialogState}
                            setDeleteCategoryDialogState={setDeleteCategoryDialogState}
                        />
                    ))}
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
    );
};

export { CategoriesRow };
