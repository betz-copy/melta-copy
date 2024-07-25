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
    CategoryIds: Yup.array()
        .of(Yup.string())
        .test('at-least-one', 'You must select at least one category', (value) => Array.isArray(value) && value.length > 0)
        .required(i18next.t('validation.required')),
};

const SettingIFramesPermissions: React.FC<StepComponentProps<IFrameWizardValues>> = ({ values, touched, errors, handleChange }) => {
    const queryClient = useQueryClient();
    const allPermissions = queryClient.getQueryData<IPermissionsOfUser[]>('getAllPermissions');
    const categories = queryClient.getQueryData<ICategoryMap>('getCategories')!;
    const categoriesIds: string[] = Array.from(categories.values()).map(({ _id }) => _id);
    const [selectedCategories, setSelectedCategories] = useState(values.categoryIds || []);
    const handleCheckboxChange = (categoryId: string) => {
        setSelectedCategories((prevSelected) =>
            prevSelected.includes(categoryId) ? prevSelected.filter((id) => id !== categoryId) : [...prevSelected, categoryId],
        );
    };
    const handleAllSelected = (allSelected: boolean) => {
        setSelectedCategories(allSelected ? [...categoriesIds] : []);
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
                    {/* {PermissionsManagement && } */}
                    <FormControlLabel
                        label={i18next.t('permissions.permissionsOfUserDialog.chooseAll') as string}
                        control={
                            <MeltaCheckbox
                                checked={selectedCategories.length === Array.from(categories.values()).length}
                                onChange={(e) => {
                                    handleAllSelected(e.target.checked);
                                    handleChange({ ...values, categoryIds: selectedCategories });
                                }}
                            />
                        }
                    />
                    <Divider />
                    {Array.from(categories.values(), (currentCategory) => {
                        return (
                            // eslint-disable-next-line react/jsx-key
                            <FormControlLabel
                                sx={{ paddingLeft: 3 }}
                                label={currentCategory.displayName}
                                labelPlacement="end"
                                // disabled={permissionsManagement.disabled}
                                control={
                                    // permissionsManagement.viewMode ? (
                                    // <PermissionViewIcon checked /> // ={permissionsManagement.checked} />
                                    // ) : (
                                    <MeltaCheckbox
                                        checked={selectedCategories.includes(currentCategory._id)}
                                        onChange={() => {
                                            handleCheckboxChange(currentCategory._id);
                                            handleChange({ ...values, categoryIds: selectedCategories });
                                        }}
                                    />
                                    // )
                                }
                            />
                        );
                    })}
                </FormGroup>
            </CardContent>
        </Card>
    );
};

export { SettingIFramesPermissions, settingIFramesPermissionsSchema };
