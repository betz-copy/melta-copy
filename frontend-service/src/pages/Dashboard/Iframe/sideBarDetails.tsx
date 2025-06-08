import { InfoOutlined } from '@mui/icons-material';
import { Grid, Typography, useTheme } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { ReadOnlyTextField } from '../../../common/inputs/FilterInputs/StyledFilterInput';
import { StepComponentProps } from '../../../common/wizards';
import { ViewMode } from '../../../interfaces/dashboard';
import { IFrame } from '../../../interfaces/iFrames';

const SideBarDetails: React.FC<StepComponentProps<IFrame> & { viewMode: ViewMode }> = ({ values, touched, errors, handleChange, viewMode }) => {
    const theme = useTheme();

    return (
        <Grid container direction="column" spacing={4}>
            <Grid item container direction="column" spacing={4}>
                <Grid item container direction="column" spacing={2.5}>
                    <Grid item>
                        <ReadOnlyTextField
                            name="name"
                            label={i18next.t('charts.name')}
                            placeholder={i18next.t('charts.name')}
                            value={values.name}
                            onChange={handleChange}
                            error={touched.name && Boolean(errors.name)}
                            helperText={touched.name && errors.name}
                            fullWidth
                            readOnly={viewMode === ViewMode.ReadOnly}
                        />
                    </Grid>

                    <Grid item>
                        <ReadOnlyTextField
                            name="url"
                            label="קישור"
                            placeholder="קישור"
                            value={values.url}
                            onChange={handleChange}
                            error={touched.url && Boolean(errors.url)}
                            helperText={touched.url && errors.url}
                            fullWidth
                            readOnly={viewMode === ViewMode.ReadOnly}
                            multiline
                        />
                    </Grid>

                    <Grid item>
                        {/* <Typography style={{ fontWeight: 'bold', cursor: 'default' }}>{i18next.t('wizard.iFrame.selectCategories')}</Typography>
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
                        )} */}
                    </Grid>
                </Grid>

                <Grid item container direction="column" spacing={2}>
                    <Grid item container direction="row" alignItems="center" wrap="nowrap" gap={1.5}>
                        <InfoOutlined style={{ color: theme.palette.primary.main }} />
                        <Typography fontWeight={400} fontSize={14} color="#53566E">
                            עמוד זה והמידע המוצג בו יופיע לכלל המשתמשים בהתאם להרשאותיהם
                        </Typography>
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    );
};

export { SideBarDetails };
