import React, { useState } from 'react';
import { Grid, IconButton } from '@mui/material';
import { Hive as HiveIcon, AddCircle as AddIcon } from '@mui/icons-material';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';

import i18next from 'i18next';
import { IMongoCategory } from '../../../interfaces/categories';
import { ViewingCard } from './ViewingCard';
import { CustomIcon } from '../../../common/CustomIcon';
import { Header } from '../../../common/Header';
import { CategoryWizard } from '../../../common/wizards/category';
import { categoryObjectToCategoryForm, deleteCategoryRequest } from '../../../services/templates/categoriesService';
import { AreYouSureDialog } from '../../../common/dialogs/AreYouSureDialog';
import { removeItemById } from '../../../utils/reactQuery';

const CategoriesRow: React.FC = () => {
    const queryClient = useQueryClient();

    const categories = queryClient.getQueryData<IMongoCategory[]>('getCategories')!;
    const categoriesSorted = categories.sort((categoryA, categoryB) => categoryA.displayName.localeCompare(categoryB.displayName));

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
            queryClient.setQueryData<IMongoCategory[]>('getCategories', (prevData) => removeItemById(id, prevData));
            setDeleteCategoryDialogState({ isDialogOpen: false, categoryId: null });
            toast.success(i18next.t('wizard.category.deletedSuccessfully'));
        },
        onError: () => {
            toast.error(i18next.t('wizard.category.failedToDelete'));
        },
    });

    return (
        <Grid item container>
            <Header title={i18next.t('categories')}>
                <IconButton onClick={() => setCategoryWizardDialogState({ isWizardOpen: true, category: null })}>
                    <AddIcon color="primary" fontSize="large" />
                </IconButton>
            </Header>
            <Grid container spacing={4}>
                {categoriesSorted.map((category) => (
                    <ViewingCard
                        minWidth={250}
                        key={category._id}
                        title={category.displayName}
                        color={category.color}
                        icon={
                            category.iconFileId ? (
                                <CustomIcon iconUrl={category.iconFileId} height="40px" width="40px" />
                            ) : (
                                <HiveIcon fontSize="large" />
                            )
                        }
                        onEditClick={() => setCategoryWizardDialogState({ isWizardOpen: true, category })}
                        onDeleteClick={() => setDeleteCategoryDialogState({ isDialogOpen: true, categoryId: category._id })}
                    />
                ))}
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
