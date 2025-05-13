/* eslint-disable no-extra-boolean-cast */
import { Clear as ClearIcon, Done as DoneIcon, Edit as EditIcon } from '@mui/icons-material';
import { Box, Button, CircularProgress, Grid, InputLabel, TextField, Typography } from '@mui/material';
import { AxiosError } from 'axios';
import { Field, Form, Formik } from 'formik';
import i18next from 'i18next';
import pickBy from 'lodash.pickby';
import React, { FC } from 'react';
import { useMutation } from 'react-query';
import { toast } from 'react-toastify';
import { ProcessStepValues } from '.';
import { PermissionScope } from '../../../../interfaces/permissions';
import { IMongoProcessInstancePopulated } from '../../../../interfaces/processes/processInstance';
import { IMongoStepInstancePopulated } from '../../../../interfaces/processes/stepInstance';
import { IMongoStepTemplatePopulated } from '../../../../interfaces/processes/stepTemplate';
import { updateStepRequest } from '../../../../services/processesService';
import { useUserStore } from '../../../../stores/user';
import { renderHTML } from '../../../../utils/HtmlTagsStringValue';
import { pickProcessFieldsPropertiesSchema } from '../../../../utils/pickFieldsPropertiesSchema';
import { BlueTitle } from '../../../BlueTitle';
import { ErrorToast } from '../../../ErrorToast';
import OpenPreview from '../../../FilePreview/OpenPreview';
import { InstanceFileInput } from '../../../inputs/InstanceFilesInput/InstanceFileInput';
import { InstanceSingleFileInput } from '../../../inputs/InstanceFilesInput/InstanceSingleFileInput';
import { ajvValidate, JSONSchemaFormik } from '../../../inputs/JSONSchemaFormik';
import { EntityReference } from '../EntityReference';
import ProcessStatus from '../ProcessSummaryStep/ProcessStatus';
import { getStepValuesFromStepInstance } from './stepsFormik';

export const CommentsDetails: FC<{ values: ProcessStepValues | IMongoStepInstancePopulated; toPrint?: boolean }> = ({ values, toPrint }) => {
    if (!values.comments) {
        return null;
    }

    return (
        <div style={{ textAlign: toPrint ? 'right' : 'center' }}>
            <BlueTitle title={i18next.t('wizard.processInstance.step.comment')} component="h6" variant={toPrint ? 'h6' : 'body1'} />
            <Typography variant="body1" sx={{ paddingY: '5px', paddingX: '10px', wordBreak: 'break-word', fontSize: !toPrint ? '15px' : undefined }}>
                {values.comments}
            </Typography>
        </div>
    );
};

export const TextAreaProperty: FC<{
    textArea: {
        value?: any;
        key: string;
        title: string;
    };
}> = ({ textArea }) => {
    return (
        <Box key={textArea.key} marginY={2}>
            <InputLabel
                style={{
                    fontFamily: 'Rubik',
                    color: '#9398C2',
                    fontSize: '1rem',
                    fontWeight: 400,
                    lineHeight: '1.4375em',
                    transformOrigin: 'top right',
                    padding: 0,
                    display: 'block',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '133%',
                    position: 'relative',
                    right: 0,
                    top: 0,
                }}
                shrink
            >
                {textArea.title}
            </InputLabel>
            <Typography
                fontSize="16px"
                width={700}
                color="black"
                style={{
                    textOverflow: 'ellipsis',
                    fontFamily: 'Rubik',
                    whiteSpace: 'pre-line',
                    overflowWrap: 'anywhere',
                    padding: '4px 0 5px 1rem',
                    borderBottom: '1px solid grey',
                }}
            >
                {textArea.value || ''}
            </Typography>
        </Box>
    );
};

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
    const currentUser = useUserStore((state) => state.user);

    const hasPermissionsToEditStep =
        (currentUser.currentWorkspacePermissions.processes?.scope === PermissionScope.write ||
            currentUser.currentWorkspacePermissions.admin?.scope === PermissionScope.write ||
            stepTemplate.reviewers.some((reviewer) => reviewer._id === currentUser._id) ||
            stepInstance.reviewers.some((reviewer) => reviewer._id === currentUser._id)) &&
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
                console.error('failed to edit step. error', error);
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

                const textAreaSchema = Object.entries(stepTemplate.properties.properties)
                    .filter(([_key, property]) => property.format === 'text-area')
                    .map(([key, property]) => ({
                        key,
                        title: property.title,
                    }));

                const textAreaValues = textAreaSchema.flatMap((property) => {
                    if (values.properties[property.key]) {
                        const value = renderHTML(values.properties[property.key]);
                        return [{ ...property, value }];
                    }
                    return [{ ...property }];
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
                                    xs={toPrint ? 0 : 7}
                                    maxHeight={toPrint ? undefined : 550}
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
                                                    return setFieldValue('properties', propertiesValues);
                                                }}
                                                errors={errors.properties ?? {}}
                                                touched={touched.properties ?? {}}
                                                setFieldTouched={(field) => {
                                                    return setFieldTouched(`properties.${field}`);
                                                }}
                                                readonly={!isStepEditMode}
                                                toPrint={toPrint}
                                            />
                                            {toPrint &&
                                                textAreaValues.length > 0 &&
                                                textAreaValues.map((textArea) => <TextAreaProperty key={textArea.key} textArea={textArea} />)}
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
                                                                        key={`${key} - ${value}`}
                                                                        fileFieldName={`attachmentsProperties.${key}`}
                                                                        fieldTemplateTitle={value.title}
                                                                        setFieldValue={setFieldValue}
                                                                        required={required.includes(key)}
                                                                        value={values.attachmentsProperties[key]}
                                                                        error={errors.properties?.[key] as string}
                                                                        setFieldTouched={setFieldTouched}
                                                                    />
                                                                ) : (
                                                                    <InstanceSingleFileInput
                                                                        key={`${key} : ${value}`}
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
                                                            let attachments: React.JSX.Element | React.JSX.Element[] = (
                                                                <Typography display="inline" variant="h6">
                                                                    -
                                                                </Typography>
                                                            );
                                                            if (values.attachmentsProperties[fieldName] !== undefined) {
                                                                if (Array.isArray(values.attachmentsProperties[fieldName])) {
                                                                    attachments = values.attachmentsProperties[fieldName].map((file) => (
                                                                        <OpenPreview fileId={file.name} key={file.name} download={toPrint} />
                                                                    ));
                                                                } else {
                                                                    attachments = (
                                                                        <OpenPreview
                                                                            fileId={values.attachmentsProperties[fieldName].name}
                                                                            key={`${fieldName} - 1`}
                                                                            download={toPrint}
                                                                        />
                                                                    );
                                                                }
                                                            }

                                                            return (
                                                                <Grid
                                                                    container
                                                                    spacing={1}
                                                                    key={`${fieldName} - 2`}
                                                                    display="flex"
                                                                    flexDirection="column"
                                                                >
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
                                                    key={`${fieldName} - 3`}
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
                                {!toPrint && (
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
                                                <CommentsDetails values={values} toPrint={toPrint} />
                                            )}
                                        </Grid>
                                    </Grid>
                                )}
                            </Grid>
                        </Grid>
                    </Form>
                );
            }}
        </Formik>
    );
};
