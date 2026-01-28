import { Hive } from '@mui/icons-material';
import { Card, CardContent, Divider, FormControlLabel, FormGroup, Grid, Typography, useTheme } from '@mui/material';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { useQueryClient } from 'react-query';
import * as Yup from 'yup';
import { ViewMode } from '../../../interfaces/dashboard';
import { ICategoryMap } from '../../../interfaces/template';
import { useUserStore } from '../../../stores/user';
import { CustomIcon } from '../../CustomIcon';
import MeltaCheckbox from '../../MeltaDesigns/MeltaCheckbox';
import { StepComponentProps } from '..';
import { IFrameWizardValues } from '.';

const settingIFramesPermissionsSchema = Yup.object({
    categoryIds: Yup.array().of(Yup.string()).min(1, i18next.t('validation.oneCategory')).required(i18next.t('validation.required')),
});

const SettingIFramesPermissions: React.FC<StepComponentProps<IFrameWizardValues> & { viewMode?: ViewMode }> = ({
    values,
    touched,
    errors,
    viewMode,
    handleBlur,
    setFieldValue,
}) => {
    const queryClient = useQueryClient();
    const categories = queryClient.getQueryData<ICategoryMap>('getCategories')!;
    const currentUser = useUserStore((state) => state.user);
    const theme = useTheme();
    const isReadonlyMode = viewMode === ViewMode.ReadOnly;

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

    // biome-ignore lint/correctness/useExhaustiveDependencies: lol
    useEffect(() => {
        setFieldValue('categoryIds', selectedCategories);
    }, [selectedCategories]);

    return (
        <Card variant="outlined" sx={{ width: viewMode ? '100%' : '27%', border: isReadonlyMode ? 'none' : undefined }}>
            <CardContent>
                <Typography style={{ fontWeight: 'bold', cursor: 'default' }}>{i18next.t('wizard.iFrame.selectCategories')}</Typography>
                <FormGroup onBlur={() => handleBlur({ target: { name: 'categoryIds' } })}>
                    {viewMode !== ViewMode.ReadOnly && (
                        <>
                            <FormControlLabel
                                label={i18next.t('permissions.permissionsOfUserDialog.chooseAll')}
                                control={
                                    <MeltaCheckbox
                                        checked={selectedCategories.length === allowedCategoriesIds.length}
                                        onChange={(e) => handleAllSelected(e.target.checked)}
                                    />
                                }
                            />
                            <Divider />
                        </>
                    )}

                    <Grid maxHeight="70vh" overflow="auto" sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {Array.from(categories.values(), (currentCategory) => {
                            const isAllowed = allowedCategoriesIds.includes(currentCategory._id);
                            const isSelected = selectedCategories.includes(currentCategory._id);

                            if (!isAllowed) return null;

                            if (isReadonlyMode)
                                return (
                                    isSelected && (
                                        <Grid container spacing={1.5} paddingLeft={3} paddingTop={1}>
                                            <Grid>
                                                {currentCategory.iconFileId ? (
                                                    <CustomIcon
                                                        iconUrl={currentCategory.iconFileId}
                                                        height="20px"
                                                        width="20px"
                                                        color={theme.palette.primary.main}
                                                    />
                                                ) : (
                                                    <Hive
                                                        sx={{
                                                            color: theme.palette.primary.main,
                                                            height: '20px',
                                                            width: '20px',
                                                        }}
                                                    />
                                                )}
                                            </Grid>

                                            <Grid>
                                                <Typography key={currentCategory._id}>{currentCategory.displayName}</Typography>
                                            </Grid>
                                        </Grid>
                                    )
                                );

                            return (
                                <FormControlLabel
                                    key={currentCategory._id}
                                    sx={{ paddingLeft: 3 }}
                                    label={currentCategory.displayName}
                                    labelPlacement="end"
                                    control={<MeltaCheckbox checked={isSelected} onChange={() => handleCheckboxChange(currentCategory._id)} />}
                                />
                            );
                        })}
                    </Grid>
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
