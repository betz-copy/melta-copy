import { Grid, Button, CircularProgress, Box, Typography } from '@mui/material';
import { Formik, Form } from 'formik';
import i18next from 'i18next';
import pickBy from 'lodash.pickby';
import React, { FC } from 'react';
import { Done as DoneIcon, Clear as ClearIcon, Edit as EditIcon } from '@mui/icons-material';
import { AxiosError } from 'axios';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { IMongoStepInstancePopulated } from '../../../../interfaces/processes/stepInstance';
import { pickProcessFieldsPropertiesSchema } from '../../../../utils/pickFieldsPropertiesSchema';
import { DownloadButton } from '../../../DownloadButton';
import { InstanceFileInput } from '../../../inputs/InstanceFilesInput/InstanceFileInput';
import { ajvValidate, JSONSchemaFormik } from '../../../inputs/JSONSchemaFormik';
import { getStepValuesFromStepInstance } from './stepsFormik';
import { updateStepRequest } from '../../../../services/processesService';
import { ErrorToast } from '../../../ErrorToast';
import ProcessStatus from '../ProcessSummaryStep/ProcessStatus';
import { IMongoStepTemplatePopulated } from '../../../../interfaces/processes/stepTemplate';
import { ProcessStepValues } from '.';
import { IPermissionsOfUser } from '../../../../services/permissionsService';
import { IMongoProcessInstancePopulated, Status } from '../../../../interfaces/processes/processInstance';
import { EntityReference } from '../EntityReference';
import { BlueTitle } from '../../../BlueTitle';

interface ProcessStepProps {
    stepInstance: IMongoStepInstancePopulated;
    stepTemplate: IMongoStepTemplatePopulated;
    processInstance: IMongoProcessInstancePopulated;
    isStepEditMode: boolean;
    setIsStepEditMode: React.Dispatch<React.SetStateAction<boolean>>;
    onStepUpdateSuccess: (updatedStepInstance: IMongoStepInstancePopulated) => void;
}
export const ProcessStep: FC<ProcessStepProps> = ({
    stepInstance,
    stepTemplate,
    processInstance,
    isStepEditMode,
    setIsStepEditMode,
    onStepUpdateSuccess,
}) => {
    const queryClient = useQueryClient();
    const myPermissions = queryClient.getQueryData<IPermissionsOfUser>('getMyPermissions')!;

    const hasPermissionsToEditStep =
        Boolean(myPermissions!.processesManagementId) ||
        stepTemplate.reviewers.some((reviewer) => reviewer.id === myPermissions.user.id) ||
        stepInstance.reviewers.some((reviewer) => reviewer.id === myPermissions.user.id);
    const canEditStep = hasPermissionsToEditStep && processInstance.status === Status.Pending;

    const templateFileProperties = pickBy(stepTemplate.properties.properties, (value) => value.format === 'fileId');
    const templateEntityReferenceProperties = pickBy(stepTemplate.properties.properties, (value) => value.format === 'entityReference');
    const { isLoading: editStepIsLoading, mutateAsync: editStepMutateAsync } = useMutation(
        (stepData: ProcessStepValues) => updateStepRequest(stepInstance._id, stepData, processInstance._id, stepInstance),
        {
            onSuccess: () => {
                toast.success(i18next.t('wizard.processInstance.step.editedSuccessfully'));
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
                onStepUpdateSuccess(result);
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
                return (
                    <Form>
                        <Grid container direction="column" >
                            {canEditStep && (
                                <Grid item container spacing={1} >
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

                            <Grid item container spacing={2} marginTop={1} justifyContent="space-between" maxHeight={550} overflow={'auto'}>
                                <Grid item xs={6}>
                                    <Grid
                                        item
                                        sx={{
                                            paddingRight: '15px',
                                            overflowY: 'auto',
                                        }}
                                    >
                                        <JSONSchemaFormik
                                            schema={pickProcessFieldsPropertiesSchema({
                                                properties: stepTemplate.properties,
                                                propertiesOrder: stepTemplate.propertiesOrder,
                                            })}
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

                                    {templateFileProperties && isStepEditMode ? (
                                        <Box>
                                            {Object.entries(templateFileProperties).map(([key, value]) => (
                                                <InstanceFileInput
                                                    key={key}
                                                    fileFieldName={`attachmentsProperties.${key}`}
                                                    fieldTemplateTitle={value.title}
                                                    setFieldValue={setFieldValue}
                                                    required={false}
                                                    value={values.attachmentsProperties?.[key]}
                                                    error={
                                                        errors.attachmentsProperties?.[key]
                                                            ? JSON.stringify(errors.attachmentsProperties?.[key])
                                                            : undefined
                                                    }
                                                />
                                            ))}
                                        </Box>
                                    ) : (
                                        templateFileProperties && (
                                            <>
                                                {Object.entries(templateFileProperties).map(([fieldName, { title }]) => (
                                                    <Grid container spacing={1} alignItems="center" key={fieldName}>
                                                        <Grid item>
                                                            <Typography display="inline" variant="body1">
                                                                {title}:
                                                            </Typography>
                                                        </Grid>
                                                        <Grid item>
                                                            {values.attachmentsProperties[fieldName] ? (
                                                                <DownloadButton fileId={values.attachmentsProperties[fieldName].name} />
                                                            ) : (
                                                                <Typography display="inline" variant="h6">
                                                                    -
                                                                </Typography>
                                                            )}
                                                        </Grid>
                                                    </Grid>
                                                ))}
                                            </>
                                        )
                                    )}
                                    {Object.keys(templateEntityReferenceProperties!).length !== 0 && (
                                        <Grid padding={1}>
                                            {
                                                <BlueTitle
                                                    title={i18next.t('wizard.processInstance.refEntities')}
                                                    component="h6"
                                                    variant="h6"
                                                    style={{ marginBottom: '22px' }}
                                                />
                                            }
                                            {Object.entries(templateEntityReferenceProperties!).map(([fieldName, { title }]) => (
                                                <EntityReference
                                                    field={fieldName}
                                                    values={values}
                                                    errors={errors}
                                                    touched={touched}
                                                    setFieldValue={setFieldValue}
                                                    handleBlur={handleBlur}
                                                    isViewMode={!isStepEditMode}
                                                    title={title}
                                                />
                                            ))}
                                        </Grid>
                                    )}
                                </Grid>
                                <Grid item xs={3}>
                                    <ProcessStatus
                                        title={i18next.t('wizard.processInstance.step.stepStatus')}
                                        instance={stepInstance}
                                        setFieldValue={setFieldValue}
                                        values={values}
                                        isEditMode={isStepEditMode}
                                    />
                                </Grid>
                            </Grid>
                        </Grid>
                    </Form>
                );
            }}
        </Formik>
    );
};
