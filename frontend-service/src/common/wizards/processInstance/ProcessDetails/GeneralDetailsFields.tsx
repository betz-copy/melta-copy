/* eslint-disable no-nested-ternary */
import { Autocomplete, Grid, TextField } from '@mui/material';
import { DatePicker, LocalizationProvider, PickersLocaleText } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { he } from 'date-fns/locale';
import i18next from 'i18next';
import { environment } from '../../../../globals';
import { useDarkModeStore } from '../../../../stores/darkMode';
import BlueTitle from '../../../MeltaDesigns/BlueTitle';

const { date } = environment.formats;

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
        <Grid width="100%">
            {!viewMode && (
                <BlueTitle
                    title={i18next.t('wizard.processInstance.generalDetails')}
                    component="h6"
                    variant="h6"
                    style={{ marginBottom: '30px', marginTop: '20px', fontSize: '16px' }}
                />
            )}
            <Grid container spacing={3} width="100%">
                <Grid width="100%">
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
                                slotProps={{
                                    input: {
                                        ...params.InputProps,
                                        disableUnderline: !!viewMode,
                                        endAdornment: viewMode ? null : params.InputProps.endAdornment,
                                    },
                                    inputLabel: {
                                        shrink: viewMode || undefined,
                                    },
                                }}
                                label={
                                    i18next.t(
                                        processInstance ? 'wizard.processInstance.processTemplate' : 'processInstancesPage.chooseProcessTemplate',
                                    ) as string
                                }
                                helperText={touched.template ? errors.template : ''}
                                error={touched.template && Boolean(errors.template)}
                                onBlur={handleBlur}
                            />
                        )}
                    />
                </Grid>
                {!viewMode && (
                    <Grid width={viewMode ? '50%' : '100%'} minWidth={viewMode ? '100px' : undefined}>
                        <TextField
                            id="name"
                            name="name"
                            size="small"
                            sx={textFieldStyle}
                            fullWidth
                            label={i18next.t('wizard.processInstance.processInstanceName') as string}
                            value={values.name}
                            variant={variant}
                            slotProps={{
                                input: {
                                    readOnly: viewMode,
                                },
                                inputLabel: {
                                    shrink: viewMode || undefined,
                                },
                            }}
                            onChange={(e) => setFieldValue('name', e.target.value)}
                            helperText={touched.name ? errors.name : ''}
                            error={touched.name && Boolean(errors.name)}
                            onBlur={handleBlur}
                        />
                    </Grid>
                )}
                <Grid container direction={viewMode ? 'row' : 'column'} wrap="nowrap">
                    <Grid width={viewMode ? '50%' : '100%'} minWidth={viewMode ? '100px' : undefined}>
                        <LocalizationProvider
                            dateAdapter={AdapterDateFns}
                            adapterLocale={he}
                            localeText={i18next.t('muiDatePickersLocaleText', { returnObjects: true }) as PickersLocaleText}
                        >
                            <DatePicker
                                maxDate={values.endDate}
                                label={i18next.t('wizard.processInstance.processInstanceStartDate')}
                                value={values.startDate}
                                onChange={(newStartDate) => setFieldValue('startDate', newStartDate)}
                                slots={{ textField: (params) => <TextField {...params} />, openPickerIcon: viewMode ? () => null : undefined }}
                                slotProps={{
                                    textField: {
                                        size: 'small',
                                        fullWidth: true,
                                        variant,
                                        sx: textFieldStyle,
                                        InputLabelProps: { shrink: viewMode || undefined },
                                        inputProps: { readOnly: viewMode },
                                        onBlur: () => setFieldTouched('startDate'),
                                        error: touched.startDate && Boolean(errors.startDate),
                                        helperText: touched.startDate ? errors.startDate : '',
                                        InputProps: { disableUnderline: viewMode },
                                    },
                                }}
                                readOnly={viewMode}
                                enableAccessibleFieldDOMStructure={false}
                                format={date}
                            />
                        </LocalizationProvider>
                    </Grid>
                    <Grid width={viewMode ? '50%' : '100%'} minWidth={viewMode ? '100px' : undefined}>
                        <LocalizationProvider
                            dateAdapter={AdapterDateFns}
                            adapterLocale={he}
                            localeText={i18next.t('muiDatePickersLocaleText', { returnObjects: true }) as PickersLocaleText}
                        >
                            <DatePicker
                                minDate={values.startDate}
                                format={date}
                                enableAccessibleFieldDOMStructure={false}
                                label={i18next.t('wizard.processInstance.processInstanceEndDate')}
                                value={values.endDate}
                                onChange={(newEndDate) => setFieldValue('endDate', newEndDate)}
                                slots={{ textField: (params) => <TextField {...params} />, openPickerIcon: viewMode ? () => null : undefined }}
                                slotProps={{
                                    textField: {
                                        size: 'small',
                                        fullWidth: true,
                                        variant,
                                        sx: textFieldStyle,
                                        InputLabelProps: { shrink: viewMode || undefined },
                                        inputProps: { readOnly: viewMode },
                                        onBlur: () => setFieldTouched('endDate'),
                                        error: touched.endDate && Boolean(errors.endDate),
                                        helperText: touched.endDate ? errors.endDate : '',
                                        InputProps: { disableUnderline: viewMode },
                                    },
                                }}
                                readOnly={viewMode}
                            />
                        </LocalizationProvider>
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    );
};
