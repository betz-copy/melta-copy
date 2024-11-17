import { Autocomplete, Grid, TextField } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { BlueTitle } from '../../../BlueTitle';

export const GeneralDetailsFields = ({
    processTemplatesMap,
    setFieldValue,
    values,
    isEditMode,
    processInstance,
    viewMode,
    variant,
    touched,
    errors,
    handleBlur,
    setFieldTouched,
}) => {
    return (
        <Grid item>
            <BlueTitle title={i18next.t('wizard.processInstance.generalDetails')} component="h6" variant="h6" style={{ marginBottom: '30px' }} />
            <Grid container direction="column" spacing={3}>
                <Grid item>
                    <Autocomplete
                        id="template"
                        options={Array.from(processTemplatesMap.values())}
                        onChange={(_e, newValue) => {
                            setFieldValue('template', newValue);
                        }}
                        value={values.template ?? null}
                        disabled={Boolean(isEditMode && processInstance)}
                        readOnly={viewMode}
                        getOptionLabel={(option) => option.displayName}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                size="small"
                                sx={{
                                    '& .MuiInputBase-root': {
                                        borderRadius: '10px',
                                    },
                                    '& fieldset': {
                                        borderColor: '#CCCFE5',
                                        color: '#CCCFE5',
                                    },
                                    '& label': {
                                        color: '#9398C2',
                                    },
                                }}
                                fullWidth
                                name="template"
                                variant={variant}
                                InputLabelProps={{
                                    shrink: viewMode || undefined,
                                }}
                                label={i18next.t(
                                    processInstance ? 'wizard.processInstance.processTemplate' : 'processInstancesPage.chooseProcessTemplate',
                                )}
                                helperText={touched.template ? errors.template : ''}
                                error={touched.template && Boolean(errors.template)}
                                onBlur={handleBlur}
                            />
                        )}
                    />
                </Grid>
                <Grid item>
                    <TextField
                        id="name"
                        name="name"
                        size="small"
                        sx={{
                            '& .MuiInputBase-root': {
                                borderRadius: '10px',
                            },
                            '& fieldset': {
                                borderColor: '#CCCFE5',
                                color: '#CCCFE5',
                            },
                            '& label': {
                                color: '#9398C2',
                            },
                        }}
                        fullWidth
                        label={i18next.t('wizard.processInstance.processInstanceName')}
                        value={values.name}
                        variant={variant}
                        InputLabelProps={{
                            shrink: viewMode || undefined,
                        }}
                        onChange={(e) => setFieldValue('name', e.target.value)}
                        helperText={touched.name ? errors.name : ''}
                        error={touched.name && Boolean(errors.name)}
                        onBlur={handleBlur}
                        InputProps={{
                            readOnly: viewMode,
                        }}
                    />
                </Grid>
                <Grid item>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                            maxDate={values.endDate}
                            label={i18next.t('wizard.processInstance.processInstanceStartDate')}
                            value={values.startDate}
                            onChange={(newStartDate) => {
                                setFieldValue('startDate', newStartDate);
                            }}
                            renderInput={(params) => (
                                <TextField
                                    size="small"
                                    sx={{
                                        '& .MuiInputBase-root': {
                                            borderRadius: '10px',
                                        },
                                        '& fieldset': {
                                            borderColor: '#CCCFE5',
                                            color: '#CCCFE5',
                                        },
                                        '& label': {
                                            color: '#9398C2',
                                        },
                                    }}
                                    fullWidth
                                    variant={variant}
                                    InputLabelProps={{
                                        shrink: viewMode || undefined,
                                    }}
                                    {...params}
                                    error={touched.startDate && Boolean(errors.startDate)}
                                    helperText={touched.startDate ? errors.startDate : ''}
                                    onBlur={() => setFieldTouched('startDate')}
                                />
                            )}
                            readOnly={viewMode}
                        />
                    </LocalizationProvider>
                </Grid>
                <Grid item>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                            minDate={values.startDate}
                            label={i18next.t('wizard.processInstance.processInstanceEndDate')}
                            value={values.endDate}
                            onChange={(newEndDate) => {
                                setFieldValue('endDate', newEndDate);
                            }}
                            renderInput={(params) => (
                                <TextField
                                    size="small"
                                    sx={{
                                        '& .MuiInputBase-root': {
                                            borderRadius: '10px',
                                        },
                                        '& fieldset': {
                                            borderColor: '#CCCFE5',
                                            color: '#CCCFE5',
                                        },
                                        '& label': {
                                            color: '#9398C2',
                                        },
                                    }}
                                    variant={variant}
                                    fullWidth
                                    InputLabelProps={{
                                        shrink: viewMode || undefined,
                                    }}
                                    {...params}
                                    error={touched.endDate && Boolean(errors.endDate)}
                                    helperText={touched.endDate ? errors.endDate : ''}
                                    onBlur={() => setFieldTouched('endDate')}
                                />
                            )}
                            readOnly={viewMode}
                        />
                    </LocalizationProvider>
                </Grid>
            </Grid>
        </Grid>
    );
};
