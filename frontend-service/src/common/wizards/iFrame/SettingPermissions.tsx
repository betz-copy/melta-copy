import React, { useEffect, useState } from 'react';
import { useQueryClient } from 'react-query';
import i18next from 'i18next';
import { Card, CardContent, Divider, FormControlLabel, FormGroup, Typography } from '@mui/material';
import * as Yup from 'yup';
import { StepComponentProps } from '..';
import { IFrameWizardValues } from '.';
import { MeltaCheckbox } from '../../MeltaCheckbox';
import { IPermissionsOfUser } from '../../../services/permissionsService';
import { ICategoryMap } from '../../../interfaces/categories';
// import { Category } from '@mui/icons-material';

const settingIFramesPermissionsSchema = {
    categoryIds: Yup.array().of(Yup.string()).min(1, i18next.t('validation.oneCategory')).required(i18next.t('validation.required')),
};

const SettingIFramesPermissions: React.FC<StepComponentProps<IFrameWizardValues>> = ({ values, touched, errors, handleChange }) => {
    const queryClient = useQueryClient();
    const myPermissions = queryClient.getQueryData<IPermissionsOfUser>('getMyPermissions')!;
    const allowedCategoriesIds = myPermissions?.instancesPermissions
        .filter((instancesPermission) => instancesPermission.scopes.includes('Write'))
        .map((instancesPermission) => instancesPermission.category);

    const categories = queryClient.getQueryData<ICategoryMap>('getCategories')!;

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
    }, [selectedCategories]);

    return (
        <Card variant="outlined" sx={{ bgcolor: 'white', width: '27%' }}>
            <CardContent>
                <Typography style={{ fontWeight: 'bold', cursor: 'default' }}>{i18next.t('wizard.iFrame.selectCategories')}</Typography>
                <FormGroup>
                    <FormControlLabel
                        label={i18next.t('permissions.permissionsOfUserDialog.chooseAll') as string}
                        control={
                            <MeltaCheckbox
                                checked={selectedCategories.length === allowedCategoriesIds.length}
                                onChange={(e) => {
                                    handleAllSelected(e.target.checked);
                                    handleChange({ ...values, categoryIds: selectedCategories });
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
                                                handleChange({ ...values, categoryIds: selectedCategories });
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
