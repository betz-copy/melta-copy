import { InfoOutlined } from '@mui/icons-material';
import { Autocomplete, Divider, Grid, TextField, Typography, useTheme } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { useQueryClient } from 'react-query';
import { StepComponentProps } from '../../../common/wizards';
import { TableMetaData } from '../../../interfaces/dashboard';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { getTemplateProperties } from '../../../utils/dashboard/formik';

const SideBarDetails: React.FC<StepComponentProps<TableMetaData>> = ({ values, touched, errors, handleChange, setFieldValue }) => {
    const theme = useTheme();
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    return (
        <Grid container direction="column" spacing={4}>
            <Grid item>
                <Autocomplete
                    value={values.templateId || null}
                    onChange={(_e, newValue) => {
                        setFieldValue('templateId', newValue || null);
                        setFieldValue('columns', getTemplateProperties(entityTemplates, newValue));
                    }}
                    options={Array.from(entityTemplates.keys())}
                    getOptionLabel={(id) => entityTemplates.get(id)?.displayName || id}
                    renderInput={(params) => <TextField {...params} label={i18next.t('entity')} fullWidth />}
                />
            </Grid>

            {values.templateId && (
                <Grid item container direction="column" spacing={4}>
                    <Grid item>
                        <Divider />
                    </Grid>

                    <Grid item container direction="column" spacing={2.5}>
                        <Grid item>
                            <TextField
                                name="name"
                                label={i18next.t('charts.name')}
                                placeholder={i18next.t('charts.name')}
                                value={values.name}
                                onChange={handleChange}
                                error={touched.name && Boolean(errors.name)}
                                helperText={touched.name && errors.name}
                                fullWidth
                                inputProps={{ style: { textOverflow: 'ellipsis' } }}
                            />
                        </Grid>

                        <Grid item>
                            <TextField
                                name="description"
                                multiline
                                label={i18next.t('charts.description')}
                                placeholder={i18next.t('charts.description')}
                                value={values.description}
                                onChange={handleChange}
                                error={touched.description && Boolean(errors.description)}
                                helperText={touched.description && errors.description}
                                variant="outlined"
                                fullWidth
                                maxRows={4}
                                inputProps={{ style: { textOverflow: 'ellipsis' } }}
                            />
                        </Grid>
                    </Grid>

                    <Grid item container direction="column" spacing={2}>
                        <Grid item container direction="row" alignItems="center" wrap="nowrap" gap={1.5}>
                            <InfoOutlined style={{ color: theme.palette.primary.main }} />
                            <Typography fontWeight={400} fontSize={14} color="#53566E">
                                טבלה זו והמידע המוצג בה תופיע לכלל המשתמשים בהתאם להרשאותיהם
                            </Typography>
                        </Grid>
                        <Grid item container direction="row" alignItems="center" wrap="nowrap" gap={1.5}>
                            <InfoOutlined style={{ color: theme.palette.primary.main }} />
                            <Typography fontWeight={400} fontSize={14} color="#53566E">
                                כל משתמש יוכל לשנות את מידות הטבלה במסך הבית
                            </Typography>
                        </Grid>
                    </Grid>
                </Grid>
            )}
        </Grid>
    );
};

export { SideBarDetails };
