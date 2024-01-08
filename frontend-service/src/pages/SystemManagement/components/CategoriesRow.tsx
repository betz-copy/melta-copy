import React, { useState } from 'react';
import { Grid, IconButton, Tooltip, Typography, tooltipClasses } from '@mui/material';
import { Hive as HiveIcon } from '@mui/icons-material';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';

import i18next from 'i18next';
import { AxiosError } from 'axios';
import { ICategoryMap, IMongoCategory } from '../../../interfaces/categories';
import { ViewingCard } from './Card';
import { CustomIcon } from '../../../common/CustomIcon';
import { CategoryWizard } from '../../../common/wizards/category';
import { categoryObjectToCategoryForm, deleteCategoryRequest } from '../../../services/templates/categoriesService';
import { AreYouSureDialog } from '../../../common/dialogs/AreYouSureDialog';
import { ErrorToast } from '../../../common/ErrorToast';
import { Box } from './Box';
import { CardMenu } from './CardMenu';

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
    const [isHoverOnCard, setIsHoverOnCard] = useState(false);

    return (
        <ViewingCard
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
                            <div
                                style={{
                                    height: '18px',
                                    width: '3px',
                                    backgroundColor: category.color,
                                    borderRadius: '20px',
                                }}
                            />
                        </Grid>

                        <Grid item>
                            {category.iconFileId ? (
                                <CustomIcon color="#1E2775" iconUrl={category.iconFileId} height="24px" width="24px" />
                            ) : (
                                <HiveIcon style={{ color: '#1E2775' }} fontSize="small" />
                            )}
                        </Grid>
                        <Grid item>
                            <Tooltip
                                PopperProps={{
                                    sx: { [`& .${tooltipClasses.tooltip}`]: { fontSize: '1rem', backgroundColor: '#101440' } },
                                }}
                                title={category.displayName}
                            >
                                <Typography
                                    style={{
                                        fontSize: '14px',
                                        color: '#1E2775',
                                        fontWeight: '400',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        width: '130px',
                                    }}
                                >
                                    {category.displayName}
                                </Typography>
                            </Tooltip>
                        </Grid>
                    </Grid>
                    <Grid item container flexBasis="10%">
                        {isHoverOnCard && (
                            <CardMenu
                                onEditClick={() => setCategoryWizardDialogState({ isWizardOpen: true, category })}
                                onDeleteClick={() => setDeleteCategoryDialogState({ isDialogOpen: true, categoryId: category._id })}
                            />
                        )}
                    </Grid>
                </Grid>
            }
            onHover={(isHover: boolean) => setIsHoverOnCard(isHover)}
        />
    );
};

const CategoriesRow: React.FC = () => {
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
        onError: (err: AxiosError) => {
            toast.error(<ErrorToast axiosError={err} defaultErrorMessage={i18next.t('wizard.category.failedToDelete')} />);
        },
    });

    const [isHoverOnBox, setIsHoverOnBox] = useState(false);

    return (
        <Grid item container gap="10px">
            <Box
                header={
                    <Grid item container justifyContent="space-between" alignItems="center" height="40px">
                        <Typography style={{ fontSize: '14px', fontWeight: '400', color: '#9398C2' }}>general</Typography>
                        {isHoverOnBox && (
                            <IconButton onClick={() => {}}>
                                <img src="\icons\edit-icon.svg" />
                            </IconButton>
                        )}
                    </Grid>
                }
                addingIcon={
                    <IconButton
                        style={{ borderRadius: '5px', width: 'fit-content' }}
                        onClick={() => setCategoryWizardDialogState({ isWizardOpen: true, category: null })}
                    >
                        <img src="/icons/add-new-category.svg" />
                    </IconButton>
                }
                onHover={(isHover: boolean) => setIsHoverOnBox(isHover)}
            >
                {Array.from(categories.values(), (category) => (
                    <CategoryCard
                        key={category._id}
                        category={category}
                        setCategoryWizardDialogState={setCategoryWizardDialogState}
                        setDeleteCategoryDialogState={setDeleteCategoryDialogState}
                    />
                ))}
            </Box>
            <IconButton style={{ height: '40px', borderRadius: '5px' }}>
                <img src="/icons/Add-Category-Group.svg" />
            </IconButton>
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
