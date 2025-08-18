/* eslint-disable no-nested-ternary */
import { Autocomplete, Grid, TextField } from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import heLocale from 'date-fns/locale/he';
import i18next from 'i18next';
import React from 'react';
import { useDarkModeStore } from '../../../../stores/darkMode';
import BlueTitle from '../../../MeltaDesigns/BlueTitle';

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
    const darkMode = useDarkModeStore((state) => state.darkMode);

    const textFieldStyle = {
        '& .MuiInputBase-root': {
            borderRadius: '10px',
            backgroundColor: viewMode ? 'transparent' : darkMode ? '#4949499e' : 'white',
            fontSize: '14px',
        },
        '& fieldset': {
            borderColor: '#CCCFE5',
            color: '#CCCFE5',
        },
        '& label': {
            color: '#9398C2',
        },
    };

    return (
        <Grid item width="100%">
            {!viewMode && (
                <BlueTitle
                    title={i18next.t('wizard.processInstance.generalDetails')}
                    component="h6"
                    variant="h6"
                    style={{ marginBottom: '30px', marginTop: '20px', fontSize: '16px' }}
                />
            )}
            <Grid container spacing={3} width="100%">
                <Grid item width="100%">
                    <Autocomplete
                        id="template"
                        options={Array.from(processTemplatesMap.values())}
                        onChange={(_e, newValue) => {
                            setFieldValue('template', newValue);
                            setFieldValue('details', {});
                        }}
                        value={values.template ?? null}
                        disabled={Boolean(isEditMode && processInstance)}
                        readOnly={viewMode}
                        getOptionLabel={(option) => option.displayName}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                size="small"
                                sx={textFieldStyle}
                                fullWidth
                                name="template"
                                variant={variant}
                                InputProps={{
                                    ...params.InputProps,
                                    disableUnderline: !!viewMode,
                                    endAdornment: viewMode ? null : params.InputProps.endAdornment,
                                }}
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
                {!viewMode && (
                    <Grid item width={viewMode ? '50%' : '100%'} minWidth={viewMode ? '100px' : undefined}>
                        <TextField
                            id="name"
                            name="name"
                            size="small"
                            sx={textFieldStyle}
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
                )}
                <Grid item width={viewMode ? '50%' : '100%'} minWidth={viewMode ? '100px' : undefined}>
                    <LocalizationProvider
                        dateAdapter={AdapterDateFns}
                        adapterLocale={heLocale}
                        localeText={i18next.t('muiDatePickersLocaleText', { returnObjects: true })}
                    >
                        <DatePicker
                            inputFormat="dd/MM/yyyy"
                            maxDate={values.endDate}
                            label={i18next.t('wizard.processInstance.processInstanceStartDate')}
                            value={values.startDate}
                            onChange={(newStartDate) => {
                                setFieldValue('startDate', newStartDate);
                            }}
                            disableOpenPicker={viewMode}
                            InputProps={{ disableUnderline: viewMode }}
                            renderInput={(params) => (
                                <TextField
                                    size="small"
                                    sx={textFieldStyle}
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
                <Grid item width={viewMode ? '50%' : '100%'} minWidth={viewMode ? '100px' : undefined}>
                    <LocalizationProvider
                        dateAdapter={AdapterDateFns}
                        adapterLocale={heLocale}
                        localeText={i18next.t('muiDatePickersLocaleText', { returnObjects: true })}
                    >
                        <DatePicker
                            inputFormat="dd/MM/yyyy"
                            minDate={values.startDate}
                            label={i18next.t('wizard.processInstance.processInstanceEndDate')}
                            value={values.endDate}
                            onChange={(newEndDate) => {
                                setFieldValue('endDate', newEndDate);
                            }}
                            disableOpenPicker={viewMode}
                            InputProps={{ disableUnderline: viewMode }}
                            renderInput={(params) => (
                                <TextField
                                    size="small"
                                    sx={textFieldStyle}
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
