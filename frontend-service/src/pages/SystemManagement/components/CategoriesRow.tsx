import React, { useState } from 'react';
import { Grid, IconButton, Typography, useTheme } from '@mui/material';
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
import { MeltaTooltip } from '../../../common/MeltaTooltip';
import { environment } from '../../../globals';
import { EntityTemplateColor } from '../../../common/EntityTemplateColor';
import { ImageWithDisable } from '../../../common/ImageWithDisable';
import IconButtonWithPopover from '../../../common/IconButtonWithPopover';

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
    const theme = useTheme();

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
                            <EntityTemplateColor entityTemplateColor={category.color} style={{ height: '18px' }} />
                        </Grid>

                        <Grid item>
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
                                        fontSize: environment.mainFontSizes.headlineSubTitleFontSize,
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
                        <Typography style={{ fontSize: environment.mainFontSizes.headlineSubTitleFontSize, fontWeight: '400', color: '#9398C2' }}>
                            {i18next.t('general')}
                        </Typography>
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
            {
                // TODO - add when category group will be supported
                <Grid>
                    <IconButtonWithPopover popoverText={i18next.t('soon')} style={{ height: '40px', borderRadius: '5px', cursor: 'default' }}>
                        <ImageWithDisable srcPath="/icons/Add-Category-Group.svg" disabled />
                    </IconButtonWithPopover>
                </Grid>
            }
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
