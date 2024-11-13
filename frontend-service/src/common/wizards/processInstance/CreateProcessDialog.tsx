import React from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton, Grid } from '@mui/material';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { AxiosError } from 'axios';
import CloseIcon from '@mui/icons-material/Close';
import i18next from 'i18next';
import ProcessDetails, { ProcessDetailsValues } from './ProcessDetails';
import { IProcessTemplateMap } from '../../../interfaces/processes/processTemplate';
import { useProcessDetailsFormik } from './ProcessDetails/detailsFormik';
import { createProcessRequest } from '../../../services/processesService';
import { BlueTitle } from '../../BlueTitle';
import { ErrorToast } from '../../ErrorToast';
import { useDarkModeStore } from '../../../stores/darkMode';
import GeneralDetails from './ProcessDetails/GeneralDetails';

interface ISimpleDialogProps {
    open: boolean;
    onClose: () => void;
}

const CreateProcess: React.FC<ISimpleDialogProps> = ({ open, onClose }) => {
    const queryClient = useQueryClient();
    const processTemplatesMap = queryClient.getQueryData<IProcessTemplateMap>('getProcessTemplates')!;

    const { mutateAsync } = useMutation((processData: ProcessDetailsValues) => createProcessRequest(processData), {
        onSuccess: () => {
            toast.success(i18next.t('processInstancesPage.processCreatedSuccessfully'));
            onClose();
            queryClient.resetQueries({ queryKey: ['searchProcesses'] }); // reset ProcessesList search results
        },
        onError: (error: AxiosError) => {
            toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('processInstancesPage.failedToCreateProcess')} />);
            console.log('Failed to create process. Error', error);
        },
    });

    const detailsFormikData = useProcessDetailsFormik(undefined, processTemplatesMap, mutateAsync);

    const darkMode = useDarkModeStore((state) => state.darkMode);

    return (
        <Dialog open={open} fullWidth maxWidth="xl" PaperProps={{ style: { height: '85vh' } }}>
            <IconButton
                aria-label="close"
                onClick={() => {
                    onClose();
                    detailsFormikData.resetForm();
                }}
                sx={{
                    position: 'absolute',
                    right: 8,
                    top: 8,
                    color: (theme) => theme.palette.grey[500],
                }}
            >
                <CloseIcon fontSize="large" />
            </IconButton>
            <Grid container flexDirection="row" height="100%">
                {/* <DialogTitle margin={1}> */}
                {/* <BlueTitle title={i18next.t('processInstancesPage.addNewProcess')} variant="h4" component="symbol" /> */}
                {/* </DialogTitle> */}
                <Grid
                    container
                    item
                    flexDirection="column"
                    alignItems="center"
                    flexBasis="15%"
                    padding={3}
                    style={{
                        backgroundColor: darkMode ? '#343536' : '#F0F2F7',
                        borderBottomLeftRadius: '20px',
                        borderTopLeftRadius: '20px',
                        boxShadow: '10px 10px 15px 10px #888888',
                    }}
                >
                    <Grid item>
                        <BlueTitle
                            title={i18next.t('processInstancesPage.addNewProcess')}
                            component="h5"
                            variant="h5"
                            style={{ fontWeight: 700, opacity: 0.9 }}
                        />
                    </Grid>
                    <Grid item>
                        {/* label: i18next.t('wizard.processInstance.generalDetails'),
                    component: GeneralDetails, */}

                        {/* <CardContent sx={{ height: !toPrint ? '56vh' : undefined, overflowY: 'auto' }}>
                <Grid container direction="column" paddingLeft={toPrint ? 0 : 4} justifyContent="space-around">
                    <Grid item>
                        <FormikProvider value={detailsFormikData}>
                            <Grid item container justifyContent="flex-start">
                                <Grid item xs={4}>
                                    <BlueTitle
                                        title={i18next.t('wizard.processInstance.generalDetails')}
                                        component="h6"
                                        variant="h6"
                                        style={{ marginBottom: '30px' }}
                                    />
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
                                                            processInstance
                                                                ? 'wizard.processInstance.processTemplate'
                                                                : 'processInstancesPage.chooseProcessTemplate',
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
                                {values.template && (
                                    <Grid
                                        item
                                        sx={{
                                            overflowY: 'auto',
                                            paddingLeft: toPrint ? 0 : 3,
                                        }}
                                        xs={toPrint ? 15 : 7}
                                    >
                                        {Object.keys(pickProcessFieldsPropertiesSchema(values.template.details).properties).length !== 0 && (
                                            <SchemaForm {...{ viewMode, values, errors, touched, setFieldValue, setFieldTouched, toPrint }} />
                                        )}
                                        {Object.keys(templateFileProperties!).length !== 0 && (
                                            <FileAttachments
                                                {...{
                                                    viewMode,
                                                    templateFileProperties,
                                                    values,
                                                    errors,
                                                    setFieldValue,
                                                    required: values.template.details.properties.required || [],
                                                    touched,
                                                    handleBlur,
                                                    setFieldTouched,
                                                    toPrint,
                                                }}
                                            />
                                        )}
                                        {Object.keys(templateEntityReferenceProperties!).length !== 0 && (
                                            <Grid padding={1}>
                                                <BlueTitle
                                                    title={i18next.t('wizard.processInstance.refEntities')}
                                                    component="h6"
                                                    variant="h6"
                                                    style={{ marginBottom: '22px' }}
                                                />
                                                {Object.entries(templateEntityReferenceProperties!).map(([fieldName, { title }]) => (
                                                    <Field
                                                        key={fieldName}
                                                        validate={(changedValue) => {
                                                            return (
                                                                values.template?.details.properties.required.includes(fieldName) &&
                                                                !changedValue?.entity &&
                                                                i18next.t('validation.requiredEntity')
                                                            );
                                                        }}
                                                        name={`entityReferences.${fieldName}`}
                                                        component={EntityReference}
                                                        errorText={
                                                            errors.entityReferences?.[fieldName] && touched.entityReferences?.[fieldName]
                                                                ? JSON.stringify(errors.entityReferences?.[fieldName])
                                                                : undefined
                                                        }
                                                        field={fieldName || ''}
                                                        values={values}
                                                        errors={errors}
                                                        touched={touched}
                                                        setFieldValue={setFieldValue}
                                                        handleBlur={handleBlur}
                                                        isViewMode={viewMode}
                                                        title={title}
                                                    />
                                                ))}
                                            </Grid>
                                        )}
                                    </Grid>
                                )}
                            </Grid>
                        </FormikProvider>
                    </Grid>
                </Grid>
            </CardContent> */}
                    </Grid>
                </Grid>
                <Grid item flexBasis="85%">
                    <DialogContent sx={{ padding: 5 }}>
                        <ProcessDetails detailsFormikData={detailsFormikData} />
                    </DialogContent>
                </Grid>
            </Grid>
        </Dialog>
    );
};

export default CreateProcess;
