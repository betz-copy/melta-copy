import { Autocomplete, Box, Fab, Grid, TextField, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import i18next from 'i18next';
import { IMongoProcessTemplatePopulated, IProcessTemplateMap } from '../../../../interfaces/processes/processTemplate';
import { useQueryClient } from 'react-query';
import { FormikProvider } from 'formik';
import { IDetailsStepProp } from '.';
import { JSONSchemaFormik } from '../../../inputs/JSONSchemaFormik';
import { BlueTitle } from '../../../BlueTitle';
import { pickBy } from 'lodash';
import { IProcessSingleProperty } from '../../../../interfaces/processes/processTemplate';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import { filterAttachmentsProcessPropertiesFromSchema } from '../../../../utils/filterAttachmentsFromSchema';
import { InstanceFileInput } from '../../../inputs/InstanceFilesInput/InstanceFileInput';
import { DownloadButton } from '../../../DownloadButton';
import { setInitialStepsObject } from '../../../../utils/processWizard/steps';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

export const SchemaForm = ({ viewMode, values, errors, touched, setFieldValue, setFieldTouched }) => (
    <Box paddingTop={0.5} paddingLeft={1}>
        <BlueTitle title={i18next.t('wizard.entityTemplate.properties')} component="h6" variant="h6" />
        <JSONSchemaFormik
            schema={filterAttachmentsProcessPropertiesFromSchema(values.template.details)}
            values={{ ...values, properties: values.details }}
            setValues={(propertiesValues) => setFieldValue('details', propertiesValues)}
            errors={errors.details ?? {}}
            touched={touched.details ?? {}}
            setFieldTouched={(field) => setFieldTouched(`details.${field}`)}
            readonly={viewMode}
        />
    </Box>
);

type FileAttachmentsProps = {
    templateFileProperties: Record<string, IProcessSingleProperty>;
    values: any;
    errors?: any;
    setFieldValue?: (field: string, value: File | undefined) => void;
};

const FileAttachmentsEdit: React.FC<FileAttachmentsProps> = ({ templateFileProperties, values, errors, setFieldValue = () => {} }) => (
    <>
        {Object.entries(templateFileProperties).map(([key, value]) => (
            <InstanceFileInput
                key={key}
                fileFieldName={`detailsAttachments.${key}`}
                fieldTemplateTitle={value.title}
                setFieldValue={setFieldValue}
                required={false}
                value={values.detailsAttachments[key]}
                error={errors.detailsAttachments?.[key] ? JSON.stringify(errors.detailsAttachments?.[key]) : undefined}
            />
        ))}
    </>
);

const FileAttachmentsView: React.FC<FileAttachmentsProps> = ({ templateFileProperties, values }) => (
    <>
        {Object.entries(templateFileProperties).map(([fieldName, { title }]) => (
            <Grid container spacing={1} alignItems="center" key={fieldName}>
                <Grid item>
                    <Typography display="inline" variant="body1">
                        {title}:
                    </Typography>
                </Grid>
                <Grid item>
                    {values.detailsAttachments[fieldName] ? (
                        <DownloadButton fileId={values.detailsAttachments[fieldName].name} />
                    ) : (
                        <Typography display="inline" variant="h6">
                            -
                        </Typography>
                    )}
                </Grid>
            </Grid>
        ))}
    </>
);

const FileAttachments = ({ viewMode, templateFileProperties, values, errors, setFieldValue }) => {
    if (Object.keys(templateFileProperties).length === 0) return null;
    return (
        <Box>
            <BlueTitle title={i18next.t('wizard.entityTemplate.attachments')} component="h6" variant="h6" style={{ marginBottom: '22px' }} />
            {!viewMode ? (
                <FileAttachmentsEdit templateFileProperties={templateFileProperties} values={values} errors={errors} setFieldValue={setFieldValue} />
            ) : (
                <FileAttachmentsView templateFileProperties={templateFileProperties} values={values} />
            )}
        </Box>
    );
};

const GeneralDetails: React.FC<IDetailsStepProp> = ({ detailsFormikData, onNext, processInstance, isEditMode }) => {
    const { values, touched, errors, setFieldValue, setFieldTouched, handleBlur, resetForm } = detailsFormikData;
    const queryClient = useQueryClient();
    const processTemplatesMap = queryClient.getQueryData<IProcessTemplateMap>('getProcessTemplates')!;
    const [previousTemplate, setPreviousTemplate] = useState<IMongoProcessTemplatePopulated>();
    const viewMode = Boolean(processInstance && !isEditMode);
    const variant = viewMode ? 'standard' : 'outlined';

    const templateFileProperties = values.template
        ? pickBy(values.template.details.properties.properties, (value) => value.format === 'fileId')
        : undefined;

    useEffect(() => {
        if (values.template) {
            if (values.template.name !== previousTemplate?.name && previousTemplate !== undefined) {
                setPreviousTemplate(values.template);
                resetForm();
            }
            if (!processInstance) {
                setFieldValue('steps', setInitialStepsObject(values.template.steps));
            }
        }
    }, [values.template?._id]);

    return (
        <Grid container height={'55vh'} direction={'column'} spacing={1} paddingLeft={4} justifyContent={'space-between'}>
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
                            <Grid container direction={'column'} spacing={3}>
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
                                        fullWidth
                                        label={i18next.t('wizard.processInstance.processInstanceName')}
                                        value={values.name}
                                        variant={variant}
                                        InputLabelProps={{
                                            shrink: viewMode || undefined,
                                        }}
                                        onChange={(e) => {
                                            setFieldValue('name', e.target.value);
                                        }}
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
                                            inputFormat={'dd/MM/yyyy'}
                                            maxDate={values.endDate}
                                            label={i18next.t('wizard.processInstance.processInstanceStartDate')}
                                            value={values.startDate}
                                            onChange={(newStartDate) => {
                                                setFieldValue('startDate', newStartDate);
                                            }}
                                            renderInput={(params) => (
                                                <TextField
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
                                            inputFormat={'dd/MM/yyyy'}
                                            minDate={values.startDate}
                                            label={i18next.t('wizard.processInstance.processInstanceEndDate')}
                                            value={values.endDate}
                                            onChange={(newEndDate) => {
                                                setFieldValue('endDate', newEndDate);
                                            }}
                                            renderInput={(params) => (
                                                <TextField
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
                            <Grid item sx={{ overflowY: 'auto', paddingRight: '15px', marginLeft: '50px' }} xs={6} maxHeight={'50vh'}>
                                <SchemaForm {...{ viewMode, values, errors, touched, setFieldValue, setFieldTouched }} />
                                <FileAttachments {...{ viewMode, templateFileProperties, values, errors, setFieldValue }} />
                            </Grid>
                        )}
                    </Grid>
                </FormikProvider>
            </Grid>
            <Grid item alignSelf="flex-end">
                <Fab
                    onClick={() => {
                        onNext();
                    }}
                    variant="extended"
                    color="primary"
                >
                    {i18next.t(viewMode ? 'wizard.processInstance.showStepsReviewers' : 'wizard.processInstance.moveToStepsReviewers')}
                    <NavigateBeforeIcon />
                </Fab>
            </Grid>
        </Grid>
    );
};

export default GeneralDetails;
