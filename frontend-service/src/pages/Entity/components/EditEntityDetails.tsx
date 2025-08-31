import { Clear as ClearIcon, Done as DoneIcon } from '@mui/icons-material';
import { Button, Card, CardContent, CircularProgress, Divider, Grid, Typography } from '@mui/material';
import { AxiosError } from 'axios';
import { Form, Formik } from 'formik';
import { StatusCodes } from 'http-status-codes';
import i18next from 'i18next';
import pickBy from 'lodash.pickby';
import React, { useState } from 'react';
import { useMutation } from 'react-query';
import { toast } from 'react-toastify';
import BlueTitle from '../../../common/MeltaDesigns/BlueTitle';
import { EntityWizardValues } from '../../../common/dialogs/entity';
import { getInitialValuesWithDefaults } from '../../../common/dialogs/entity/CreateOrEditEntityDialog';
import { InstanceFileInput } from '../../../common/inputs/InstanceFilesInput/InstanceFileInput';
import { InstanceSingleFileInput } from '../../../common/inputs/InstanceFilesInput/InstanceSingleFileInput';
import { JSONSchemaFormik, ajvValidate } from '../../../common/inputs/JSONSchemaFormik';
import { environment } from '../../../globals';
import { IEntity, IUniqueConstraint } from '../../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { IErrorResponse } from '../../../interfaces/error';
import { ActionTypes, IAction, IActionPopulated } from '../../../interfaces/ruleBreaches/actionMetadata';
import { IBrokenRule, IRuleBreach, IRuleBreachPopulated } from '../../../interfaces/ruleBreaches/ruleBreach';
import { updateEntityRequestForMultiple } from '../../../services/entitiesService';
import { filterFieldsFromPropertiesSchema } from '../../../utils/pickFieldsPropertiesSchema';
import ActionOnEntityWithRuleBreachDialog from './ActionOnEntityWithRuleBreachDialog';

const { errorCodes } = environment;

const EditEntityDetails: React.FC<{
    entityTemplate: IMongoEntityTemplatePopulated;
    entity: IEntity;
    onSuccessUpdate: (data: IEntity) => void;
    onCancelUpdate: () => void;
}> = ({ entityTemplate, entity, onSuccessUpdate, onCancelUpdate }) => {
    const [updateWithRuleBreachDialogState, setUpdateWithRuleBreachDialogState] = useState<{
        isOpen: boolean;
        brokenRules?: IRuleBreachPopulated['brokenRules'];
        rawBrokenRules?: IBrokenRule[];
        updateEntityFormData?: EntityWizardValues;
        actions?: IActionPopulated[];
        rawActions?: IAction[];
    }>({ isOpen: false });
    const [externalErrors, setExternalErrors] = useState({ files: false, unique: {}, action: '' });
    const handleClose = () => {
        onCancelUpdate();
        setExternalErrors({ files: false, unique: {}, action: '' });
    };

    const templateFilesProperties = pickBy(
        entityTemplate.properties.properties,
        (value) => (value.type === 'array' && value.items?.format === 'fileId') || value.format === 'fileId',
    );
    const templateFileKeys = Object.keys(templateFilesProperties);
    const requiredFilesNames = entityTemplate.properties.required.filter((name) => templateFileKeys.includes(name));

    const fieldProperties = pickBy(entity.properties, (_value, key) => !templateFileKeys.includes(key)) as IEntity['properties'];
    const fileIdsProperties = pickBy(entity.properties, (_value, key) => templateFileKeys.includes(key));
    Object.entries(fileIdsProperties).forEach(([key, value]) => {
        if (Array.isArray(value)) {
            fileIdsProperties[key] = value?.map((item) => {
                return { name: item };
            });
        } else {
            fileIdsProperties[key] = { name: value };
        }
    });
    const fileProperties = fileIdsProperties;
    const { isLoading: isUpdateLoading, mutateAsync: updateMutation } = useMutation(
        ({ newEntityData, ignoredRules }: { newEntityData: EntityWizardValues; ignoredRules?: IRuleBreach['brokenRules'] }) =>
            updateEntityRequestForMultiple(entity.properties._id, newEntityData, ignoredRules),
        {
            onSuccess: (data) => {
                toast.success(i18next.t('wizard.entity.editedSuccessfully'));
                onSuccessUpdate(data);
                setExternalErrors({ files: false, unique: {}, action: '' });
            },
            onError: (err: AxiosError, { newEntityData: newEntityDate }) => {
                if (err.response?.status === StatusCodes.REQUEST_TOO_LONG) setExternalErrors((prev) => ({ ...prev, files: true }));
                const errorMetadata = (err.response?.data as IErrorResponse)?.metadata;

                if (errorMetadata?.errorCode === errorCodes.failedConstraintsValidation) {
                    const { properties } = errorMetadata.constraint as Omit<IUniqueConstraint, 'constraintName'>;
                    const constraintPropsDisplayNames = properties.map((prop) => `${prop}-${entityTemplate.properties.properties[prop].title}`);
                    constraintPropsDisplayNames.forEach((uniqueProp) => {
                        setExternalErrors((prev) => ({
                            ...prev,
                            unique: {
                                ...prev.unique,
                                [uniqueProp.substring(0, uniqueProp.indexOf('-'))]: `${i18next.t(
                                    `wizard.entity.someEntityAlreadyHasTheSameField${constraintPropsDisplayNames.length > 1 ? 's' : ''}`,
                                )} ${uniqueProp.substring(uniqueProp.indexOf('-') + 1)}`,
                            },
                        }));
                    });
                    return;
                }

                if (errorMetadata?.errorCode === errorCodes.actionsCustomError)
                    setExternalErrors((prev) => ({ ...prev, action: errorMetadata?.message }));

                if (errorMetadata?.errorCode === errorCodes.ruleBlock) {
                    const { brokenRules, rawBrokenRules, actions, rawActions } = errorMetadata;

                    setUpdateWithRuleBreachDialogState({
                        isOpen: true,
                        brokenRules,
                        rawBrokenRules,
                        updateEntityFormData: newEntityDate,
                        actions,
                        rawActions,
                    });
                }
                toast.error(i18next.t('wizard.entity.failedToEdit'));
            },
        },
    );

    return (
        <Formik
            initialValues={getInitialValuesWithDefaults({
                properties: fieldProperties,
                attachmentsProperties: fileProperties,
                template: entityTemplate,
            })}
            onSubmit={async (values, formikHelpers) => {
                formikHelpers.setTouched({});
                updateMutation({ newEntityData: { ...values, template: entityTemplate } });
            }}
            validate={(values) => {
                const nonAttachmentsSchema = filterFieldsFromPropertiesSchema(entityTemplate.properties);
                const propertiesErrors = ajvValidate(nonAttachmentsSchema, values.properties);
                if (Object.keys(propertiesErrors).length === 0) {
                    return {};
                }
                return { properties: propertiesErrors };
            }}
        >
            {({ setFieldValue, values, errors, touched, setFieldTouched, dirty }) => {
                return (
                    <>
                        <Form>
                            <Card>
                                <CardContent>
                                    <Grid container justifyContent="center">
                                        <Grid container>
                                            <Grid size={{ xs: 12, sm: 8 }}>
                                                <BlueTitle
                                                    title={`${i18next.t('actions.editment')} ${entityTemplate.displayName}`}
                                                    component="h6"
                                                    variant="h6"
                                                    style={{ fontWeight: '600', fontSize: '20px' }}
                                                />
                                                <JSONSchemaFormik
                                                    schema={filterFieldsFromPropertiesSchema(entityTemplate.properties)}
                                                    values={values}
                                                    setValues={(propertiesValues) => setFieldValue('properties', propertiesValues)}
                                                    errors={errors.properties ?? {}}
                                                    uniqueErrors={externalErrors.unique}
                                                    touched={touched.properties ?? {}}
                                                    setFieldTouched={(field) => setFieldTouched(`properties.${field}`)}
                                                    isEditMode
                                                />
                                                {externalErrors.action && (
                                                    <Typography color="error" variant="caption" fontSize="14px">
                                                        {externalErrors.action}
                                                    </Typography>
                                                )}
                                            </Grid>
                                            {templateFileKeys.length > 0 && (
                                                <Grid size={{ xs: 12, sm: 4 }}>
                                                    <Grid container>
                                                        <Grid size={{ xs: 1 }}>
                                                            <Divider orientation="vertical" style={{ height: '100%', width: '5px' }} />
                                                        </Grid>
                                                        <Grid size={{ xs: 10 }}>
                                                            <BlueTitle
                                                                title={i18next.t('wizard.entityTemplate.attachments')}
                                                                component="h6"
                                                                variant="h6"
                                                                style={{
                                                                    marginBottom: externalErrors.files ? '0px' : '12px',
                                                                    fontSize: '16px',
                                                                    fontWeight: '600',
                                                                }}
                                                            />
                                                            {externalErrors.files && (
                                                                <p
                                                                    id="error"
                                                                    style={{ color: '#d32f2f', margin: 0, padding: 0, marginBottom: '12px' }}
                                                                >
                                                                    {i18next.t('errorCodes.FILES_TOO_BIG')}
                                                                </p>
                                                            )}
                                                            <>
                                                                {Object.entries(templateFilesProperties).map(([key, value], index) => (
                                                                    <Grid key={key} marginTop={index > 0 ? 5 : 0}>
                                                                        {value.items === undefined ? (
                                                                            <InstanceSingleFileInput
                                                                                fileFieldName={`attachmentsProperties.${key}`}
                                                                                fieldTemplateTitle={value.title}
                                                                                setFieldValue={setFieldValue}
                                                                                required={requiredFilesNames.includes(key)}
                                                                                value={values.attachmentsProperties[key] as File | undefined}
                                                                                error={errors.attachmentsProperties?.[key] as string}
                                                                                setFieldTouched={setFieldTouched}
                                                                                setExternalErrors={setExternalErrors}
                                                                            />
                                                                        ) : (
                                                                            <InstanceFileInput
                                                                                fileFieldName={`attachmentsProperties.${key}`}
                                                                                fieldTemplateTitle={value.title}
                                                                                setFieldValue={setFieldValue}
                                                                                required={requiredFilesNames.includes(key)}
                                                                                value={values.attachmentsProperties[key] as File[] | undefined}
                                                                                error={errors.attachmentsProperties?.[key] as string}
                                                                                setFieldTouched={setFieldTouched}
                                                                                setExternalErrors={setExternalErrors}
                                                                            />
                                                                        )}
                                                                    </Grid>
                                                                ))}
                                                            </>
                                                        </Grid>
                                                    </Grid>
                                                </Grid>
                                            )}
                                        </Grid>
                                        <Grid
                                            container
                                            flexDirection="row"
                                            flexWrap="nowrap"
                                            justifyContent="space-between"
                                            padding="25px 15px 0px 15px"
                                            width="100%"
                                        >
                                            <Grid>
                                                <Button
                                                    style={{ borderRadius: '7px' }}
                                                    variant="outlined"
                                                    startIcon={<ClearIcon />}
                                                    onClick={() => handleClose()}
                                                >
                                                    {i18next.t('entityPage.cancel')}
                                                </Button>
                                            </Grid>
                                            <Grid>
                                                <Button
                                                    style={{ borderRadius: '7px' }}
                                                    type="submit"
                                                    variant="contained"
                                                    startIcon={
                                                        isUpdateLoading ? <CircularProgress sx={{ color: 'white' }} size={20} /> : <DoneIcon />
                                                    }
                                                    disabled={!dirty || isUpdateLoading}
                                                >
                                                    {i18next.t('entityPage.save')}
                                                </Button>
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Form>
                        {updateWithRuleBreachDialogState.isOpen && (
                            <ActionOnEntityWithRuleBreachDialog
                                isLoadingActionOnEntity={isUpdateLoading}
                                handleClose={() => {
                                    setUpdateWithRuleBreachDialogState({ isOpen: false });
                                }}
                                doActionEntity={() => {
                                    return updateMutation({
                                        newEntityData: updateWithRuleBreachDialogState.updateEntityFormData!,
                                        ignoredRules: updateWithRuleBreachDialogState.rawBrokenRules!,
                                    });
                                }}
                                actionType={ActionTypes.UpdateEntity}
                                brokenRules={updateWithRuleBreachDialogState.brokenRules!}
                                rawBrokenRules={updateWithRuleBreachDialogState.rawBrokenRules!}
                                currEntity={entity}
                                entityFormData={updateWithRuleBreachDialogState.updateEntityFormData!}
                                onUpdatedRuleBlock={(brokenRules) =>
                                    setUpdateWithRuleBreachDialogState((prevState) => ({
                                        ...prevState,
                                        brokenRules,
                                    }))
                                }
                                onCreateRuleBreachRequest={() => handleClose()}
                                actions={updateWithRuleBreachDialogState.actions}
                                rawActions={updateWithRuleBreachDialogState.rawActions}
                            />
                        )}
                    </>
                );
            }}
        </Formik>
    );
};

export { EditEntityDetails };
