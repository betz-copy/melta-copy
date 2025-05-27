import React, { useEffect, useState } from 'react';
import { useQueryClient } from 'react-query';
import i18next from 'i18next';
import { Card, CardContent, Divider, FormControlLabel, FormGroup, Typography } from '@mui/material';
import * as Yup from 'yup';
import { StepComponentProps } from '..';
import { IFrameWizardValues } from '.';
import { MeltaCheckbox } from '../../MeltaCheckbox';
import { ICategoryMap } from '../../../interfaces/categories';
import { useUserStore } from '../../../stores/user';

const settingIFramesPermissionsSchema = {
    categoryIds: Yup.array().of(Yup.string()).min(1, i18next.t('validation.oneCategory')).required(i18next.t('validation.required')),
};

const SettingIFramesPermissions: React.FC<StepComponentProps<IFrameWizardValues>> = ({ values, touched, errors }) => {
    console.log({ values, errors });

    const queryClient = useQueryClient();
    const categories = queryClient.getQueryData<ICategoryMap>('getCategories')!;
    const currentUser = useUserStore((state) => state.user);

    const allowedCategoriesIds = currentUser.currentWorkspacePermissions.admin
        ? Array.from(categories.values()).map(({ _id }) => _id)
        : Object.keys(currentUser.currentWorkspacePermissions.instances?.categories ?? {});

    const [selectedCategories, setSelectedCategories] = useState(values.categoryIds || []);
    const handleCheckboxChange = (categoryId: string) => {
        setSelectedCategories((prevSelected) =>
            prevSelected.includes(categoryId) ? prevSelected.filter((id) => id !== categoryId) : [...prevSelected, categoryId],
        );
    };
    const handleAllSelected = (allSelected: boolean) => {
        setSelectedCategories(allSelected ? [...allowedCategoriesIds] : []);
    };

    useEffect(() => {
        // eslint-disable-next-line no-param-reassign
        values.categoryIds = selectedCategories;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCategories]);

    return (
        <Card variant="outlined">
            <CardContent>
                <Typography style={{ fontWeight: 'bold', cursor: 'default' }}>{i18next.t('wizard.iFrame.selectCategories')}</Typography>
                <FormGroup>
                    <FormControlLabel
                        label={i18next.t('permissions.permissionsOfUserDialog.chooseAll')}
                        control={
                            <MeltaCheckbox
                                checked={selectedCategories.length === allowedCategoriesIds.length}
                                onChange={(e) => {
                                    handleAllSelected(e.target.checked);
                                }}
                            />
                        }
                    />
                    <Divider />
                    {Array.from(
                        categories.values(),
                        (currentCategory) =>
                            allowedCategoriesIds.includes(currentCategory._id) && (
                                <FormControlLabel
                                    key={currentCategory._id}
                                    sx={{ paddingLeft: 3 }}
                                    label={currentCategory.displayName}
                                    labelPlacement="end"
                                    control={
                                        <MeltaCheckbox
                                            checked={selectedCategories.includes(currentCategory._id)}
                                            onChange={() => {
                                                handleCheckboxChange(currentCategory._id);
                                            }}
                                        />
                                    }
                                />
                            ),
                    )}
                </FormGroup>
                {touched.categoryIds && errors.categoryIds && (
                    <Typography color="error" sx={{ mt: 2 }}>
                        {errors.categoryIds}
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
};

export { SettingIFramesPermissions, settingIFramesPermissionsSchema };
