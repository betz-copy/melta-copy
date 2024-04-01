import { Grid, Button, CircularProgress, Box, Typography, TextField } from '@mui/material';
import { Formik, Form, Field } from 'formik';
import i18next from 'i18next';
import pickBy from 'lodash.pickby';
import React, { FC } from 'react';
import { Done as DoneIcon, Clear as ClearIcon, Edit as EditIcon } from '@mui/icons-material';
import { AxiosError } from 'axios';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { IMongoStepInstancePopulated } from '../../../../interfaces/processes/stepInstance';
import { pickProcessFieldsPropertiesSchema } from '../../../../utils/pickFieldsPropertiesSchema';
import { InstanceFileInput } from '../../../inputs/InstanceFilesInput/InstanceFileInput';
import { ajvValidate, JSONSchemaFormik } from '../../../inputs/JSONSchemaFormik';
import { getStepValuesFromStepInstance } from './stepsFormik';
import { updateStepRequest } from '../../../../services/processesService';
import { ErrorToast } from '../../../ErrorToast';
import ProcessStatus from '../ProcessSummaryStep/ProcessStatus';
import { IMongoStepTemplatePopulated } from '../../../../interfaces/processes/stepTemplate';
import { ProcessStepValues } from '.';
import { IPermissionsOfUser } from '../../../../services/permissionsService';
import { IMongoProcessInstancePopulated } from '../../../../interfaces/processes/processInstance';
import { EntityReference } from '../EntityReference';
import { BlueTitle } from '../../../BlueTitle';
import { OpenPreviewButton } from '../../../FilePreview/OpenPreviewButton';
import { InstanceSingleFileInput } from '../../../inputs/InstanceFilesInput/InstanceSingleFileInput';

interface ProcessStepProps {
    stepInstance: IMongoStepInstancePopulated;
    stepTemplate: IMongoStepTemplatePopulated;
    processInstance: IMongoProcessInstancePopulated;
    isStepEditMode: boolean;
    setIsStepEditMode: React.Dispatch<React.SetStateAction<boolean>>;
    onStepUpdateSuccess: (stepInstance: IMongoStepInstancePopulated) => void;
    toPrint?: boolean;
}
export const ProcessStep: FC<ProcessStepProps> = ({
    stepInstance,
    stepTemplate,
    processInstance,
    isStepEditMode,
    setIsStepEditMode,
    onStepUpdateSuccess,
    toPrint,
}) => {
    const queryClient = useQueryClient();
    const myPermissions = queryClient.getQueryData<IPermissionsOfUser>('getMyPermissions')!;

    const hasPermissionsToEditStep =
        (Boolean(myPermissions!.processesManagementId) ||
            stepTemplate.reviewers.some((reviewer) => reviewer.id === myPermissions.user.id) ||
            stepInstance.reviewers.some((reviewer) => reviewer.id === myPermissions.user.id)) &&
        !processInstance.archived;

    const templateFileProperties = pickBy(
        stepTemplate.properties.properties,
        (value) => (value.type === 'array' && value.items?.format === 'fileId') || value.format === 'fileId',
    );
    const templateEntityReferenceProperties = pickBy(stepTemplate.properties.properties, (value) => value.format === 'entityReference');
    const { isLoading: editStepIsLoading, mutateAsync: editStepMutateAsync } = useMutation(
        (stepData: ProcessStepValues) => updateStepRequest(stepInstance._id, stepData, processInstance._id, stepInstance, templateFileProperties),
        {
            onSuccess: (updatedStepInstance) => {
                toast.success(i18next.t('wizard.processInstance.step.editedSuccessfully'));
                onStepUpdateSuccess(updatedStepInstance);
            },
            onError: (error: AxiosError) => {
                toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('wizard.processInstance.step.failedToEdit')} />);
                console.log('failed to edit step. error', error);
            },
        },
    );
    return (
        <Formik
            initialValues={getStepValuesFromStepInstance(stepInstance, stepTemplate)}
            onSubmit={async (values, { resetForm }) => {
                const result = await editStepMutateAsync(values);
                setIsStepEditMode(false);
                resetForm({ values: getStepValuesFromStepInstance(result, stepTemplate) });
            }}
            validate={(values) => {
                const nonAttachmentsSchema = pickProcessFieldsPropertiesSchema({
                    properties: stepTemplate.properties,
                    propertiesOrder: stepTemplate.propertiesOrder,
                });
                const propertiesErrors = ajvValidate(nonAttachmentsSchema, values.properties);
                if (Object.keys(propertiesErrors).length === 0) {
                    return {};
                }
                return { properties: propertiesErrors };
            }}
        >
            {({ setFieldValue, values, errors, touched, setFieldTouched, dirty, handleBlur, resetForm }) => {
                const required = stepTemplate.properties?.required || [];

                const propertiesSchema = pickProcessFieldsPropertiesSchema({
                    properties: stepTemplate.properties,
                    propertiesOrder: stepTemplate.propertiesOrder,
                });

                return (
                    <Form>
                        <Grid container direction="column">
                            {hasPermissionsToEditStep && !toPrint && (
                                <Grid container spacing={1} marginBottom={1}>
                                    {isStepEditMode ? (
                                        <>
                                            <Grid item>
                                                <Button
                                                    variant="outlined"
                                                    startIcon={
                                                        editStepIsLoading ? <CircularProgress sx={{ color: 'white' }} size={20} /> : <ClearIcon />
                                                    }
                                                    onClick={() => {
                                                        setIsStepEditMode(false);
                                                        resetForm();
                                                    }}
                                                >
                                                    {i18next.t('wizard.processInstance.cancelBth')}
                                                </Button>
                                            </Grid>
                                            <Grid item>
                                                <Button
                                                    type="submit"
                                                    variant="contained"
                                                    disabled={!dirty || editStepIsLoading}
                                                    startIcon={
                                                        editStepIsLoading ? <CircularProgress sx={{ color: 'white' }} size={20} /> : <DoneIcon />
                                                    }
                                                >
                                                    {i18next.t('wizard.processInstance.saveBth')}
                                                </Button>
                                            </Grid>
                                        </>
                                    ) : (
                                        <Grid item>
                                            <Button
                                                variant="outlined"
                                                startIcon={<EditIcon />}
                                                onClick={() => {
                                                    setFieldValue('properties', getStepValuesFromStepInstance(stepInstance, stepTemplate).properties);
                                                    setIsStepEditMode(!isStepEditMode);
                                                }}
                                            >
                                                {i18next.t('wizard.processInstance.step.editStepBth')}
                                            </Button>
                                        </Grid>
                                    )}
                                </Grid>
                            )}

                            <Grid container spacing={2} justifyContent="space-between">
                                <Grid
                                    item
                                    xs={7}
                                    maxHeight={550}
                                    sx={{
                                        overflowY: 'auto',
                                    }}
                                >
                                    {Object.keys(propertiesSchema.properties).length !== 0 && (
                                        <Grid>
                                            <BlueTitle title={i18next.t('wizard.entityTemplate.properties')} component="h6" variant="h6" />
                                            <JSONSchemaFormik
                                                schema={propertiesSchema}
                                                values={{ ...values, properties: values.properties }}
                                                setValues={(propertiesValues) => {
                                                    setFieldValue('properties', propertiesValues);
                                                }}
                                                errors={errors.properties ?? {}}
                                                touched={touched.properties ?? {}}
                                                setFieldTouched={(field) => {
                                                    setFieldTouched(`properties.${field}`);
                                                }}
                                                readonly={!isStepEditMode}
                                            />
                                        </Grid>
                                    )}

                                    {templateFileProperties && Object.keys(templateFileProperties!).length !== 0 && (
                                        <Grid>
                                            <BlueTitle
                                                title={i18next.t('wizard.processTemplate.attachments')}
                                                component="h6"
                                                variant="h6"
                                                style={{ marginBottom: '22px' }}
                                            />

                                            {templateFileProperties && isStepEditMode ? (
                                                <Box>
                                                    {Object.entries(templateFileProperties).map(([key, value], index) => {
                                                        return (
                                                            <Grid item key={key} marginTop={index > 0 ? 5 : 0}>
                                                                {value.items ? (
                                                                    <InstanceFileInput
                                                                        key={key}
                                                                        fileFieldName={`attachmentsProperties.${key}`}
                                                                        fieldTemplateTitle={value.title}
                                                                        setFieldValue={setFieldValue}
                                                                        required={required.includes(key)}
                                                                        value={values.attachmentsProperties[key]}
                                                                        error={errors.properties?.[key] as string}
                                                                        setFieldTouched={setFieldTouched}
                                                                        multiple={!!value.items}
                                                                    />
                                                                ) : (
                                                                    <InstanceSingleFileInput
                                                                        key={key}
                                                                        fileFieldName={`attachmentsProperties.${key}`}
                                                                        fieldTemplateTitle={value.title}
                                                                        setFieldValue={setFieldValue}
                                                                        required={required.includes(key)}
                                                                        value={values.attachmentsProperties[key]}
                                                                        error={errors.properties?.[key] as string}
                                                                        setFieldTouched={setFieldTouched}
                                                                    />
                                                                )}
                                                            </Grid>
                                                        );
                                                    })}
                                                </Box>
                                            ) : (
                                                templateFileProperties && (
                                                    <>
                                                        {Object.entries(templateFileProperties).map(([fieldName, { title }]) => {
                                                            let attachments = (
                                                                <Typography display="inline" variant="h6">
                                                                    -
                                                                </Typography>
                                                            );
                                                            if (values.attachmentsProperties[fieldName] !== undefined) {
                                                                if (Array.isArray(values.attachmentsProperties[fieldName])) {
                                                                    attachments = values.attachmentsProperties[fieldName].map((file) => (
                                                                        <OpenPreviewButton fileId={file.name} key={file.name} download={toPrint} />
                                                                    ));
                                                                } else {
                                                                    attachments = (
                                                                        <OpenPreviewButton
                                                                            fileId={values.attachmentsProperties[fieldName].name}
                                                                            key={fieldName}
                                                                            download={toPrint}
                                                                        />
                                                                    );
                                                                }
                                                            }

                                                            return (
                                                                <Grid container spacing={1} key={fieldName} display="flex" flexDirection="column">
                                                                    <Grid item>
                                                                        <Typography display="inline" variant="body1">
                                                                            {title}:
                                                                        </Typography>
                                                                    </Grid>
                                                                    <Grid item sx={{ overflowY: 'auto', maxHeight: '90px' }}>
                                                                        {attachments}
                                                                    </Grid>
                                                                </Grid>
                                                            );
                                                        })}
                                                    </>
                                                )
                                            )}
                                        </Grid>
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
                                                    name={`entityReferences.${fieldName}`}
                                                    component={EntityReference}
                                                    validate={(changedValue) => {
                                                        return (
                                                            required.includes(fieldName) &&
                                                            !changedValue?.entity &&
                                                            i18next.t('validation.requiredEntity')
                                                        );
                                                    }}
                                                    key={fieldName}
                                                    field={fieldName}
                                                    values={values}
                                                    errors={errors}
                                                    touched={touched}
                                                    setFieldValue={setFieldValue}
                                                    handleBlur={handleBlur}
                                                    isViewMode={!isStepEditMode}
                                                    title={title}
                                                    errorText={
                                                        errors.entityReferences?.[fieldName] && touched.entityReferences?.[fieldName]
                                                            ? JSON.stringify(errors.entityReferences?.[fieldName])
                                                            : null
                                                    }
                                                />
                                            ))}
                                        </Grid>
                                    )}
                                </Grid>

                                <Grid item container direction="column" xs={4.5} spacing={2} alignItems="center">
                                    <Grid item>
                                        <ProcessStatus
                                            title={i18next.t('wizard.processInstance.step.stepStatus')}
                                            instance={stepInstance}
                                            editStatus={{ setFieldValue, isEditMode: isStepEditMode, values }}
                                        />
                                    </Grid>

                                    <Grid item width={250}>
                                        {isStepEditMode ? (
                                            <TextField
                                                label={i18next.t('wizard.processInstance.step.comment')}
                                                multiline
                                                rows={8}
                                                value={values.comments}
                                                onChange={(e) => {
                                                    setFieldValue('comments', e.target.value);
                                                }}
                                                style={{ width: '100%' }}
                                                InputProps={{
                                                    style: { whiteSpace: 'pre-line', overflowWrap: 'break-word' },
                                                }}
                                            />
                                        ) : (
                                            values.comments && (
                                                <div style={{ textAlign: 'center' }}>
                                                    <BlueTitle
                                                        title={i18next.t('wizard.processInstance.step.comment')}
                                                        component="h6"
                                                        variant="body1"
                                                    />
                                                    <Typography height="18vh" style={{ wordBreak: 'break-word', fontSize: '15px' }}>
                                                        {values.comments}
                                                    </Typography>
                                                </div>
                                            )
                                        )}
                                    </Grid>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Form>
                );
            }}
        </Formik>
    );
};
