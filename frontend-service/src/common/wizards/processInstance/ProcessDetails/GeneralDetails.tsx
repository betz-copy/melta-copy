import { Autocomplete, Box, Card, CardActions, CardContent, Fab, Grid, TextField, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import i18next from 'i18next';
import { useQueryClient } from 'react-query';
import { FormikProvider } from 'formik';
import pickBy from 'lodash.pickby';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { IMongoProcessTemplatePopulated, IProcessTemplateMap, IProcessSingleProperty } from '../../../../interfaces/processes/processTemplate';
import { IDetailsStepProp } from '.';
import { JSONSchemaFormik } from '../../../inputs/JSONSchemaFormik';
import { BlueTitle } from '../../../BlueTitle';
import { pickProcessFieldsPropertiesSchema } from '../../../../utils/pickFieldsPropertiesSchema';
import { InstanceFileInput } from '../../../inputs/InstanceFilesInput/InstanceFileInput';
import { DownloadButton } from '../../../DownloadButton';
import { setInitialStepsObject } from '../../../../utils/processWizard/steps';
import { EntityReference } from '../EntityReference';

export const SchemaForm = ({ viewMode, values, errors, touched, setFieldValue, setFieldTouched }) => {
    return (
        <Box paddingTop={0.5} paddingLeft={1}>
            <BlueTitle title={i18next.t('wizard.entityTemplate.properties')} component="h6" variant="h6" />
            <JSONSchemaFormik
                schema={pickProcessFieldsPropertiesSchema(values.template.details)}
                values={{ ...values, properties: values.details }}
                setValues={(propertiesValues) => setFieldValue('details', propertiesValues)}
                errors={errors.details ?? {}}
                touched={touched.details ?? {}}
                setFieldTouched={(field) => setFieldTouched(`details.${field}`)}
                readonly={viewMode}
            />
        </Box>
    );
};

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

    const templateEntityReferenceProperties = values.template
        ? pickBy(values.template.details.properties.properties, (value) => value.format === 'entityReference')
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
        <Card sx={{ border: 'none', boxShadow: 'none', background: 'transparent' }}>
            <CardContent sx={{ height: '56vh', overflowY: 'auto' }}>
                <Grid container direction="column" paddingLeft={4} justifyContent="space-around">
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
                                    <Grid
                                        item
                                        sx={{
                                            overflowY: 'auto',
                                            paddingLeft: 3,
                                        }}
                                        xs={7}
                                    >
                                        {Object.keys(pickProcessFieldsPropertiesSchema(values.template.details).properties).length !== 0 && (
                                            <SchemaForm {...{ viewMode, values, errors, touched, setFieldValue, setFieldTouched }} />
                                        )}
                                        {Object.keys(templateFileProperties!).length !== 0 && (
                                            <FileAttachments {...{ viewMode, templateFileProperties, values, errors, setFieldValue }} />
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
                                                    <EntityReference
                                                        key={fieldName}
                                                        field={fieldName}
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
            </CardContent>
            <CardActions dir="ltr">
                <Grid item>
                    {values.template && (
                        <Fab
                            onClick={() => {
                                onNext();
                            }}
                            variant="extended"
                            color="primary"
                        >
                            <NavigateBeforeIcon />
                            {i18next.t(viewMode ? 'wizard.processInstance.showStepsReviewers' : 'wizard.processInstance.moveToStepsReviewers')}
                        </Fab>
                    )}
                </Grid>
            </CardActions>
        </Card>
    );
};

export default GeneralDetails;
