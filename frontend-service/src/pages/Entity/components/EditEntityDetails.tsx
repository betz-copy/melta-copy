import { Clear as ClearIcon, Done as DoneIcon } from '@mui/icons-material';
import { Button, Card, CardContent, CircularProgress, Divider, Grid } from '@mui/material';
import { AxiosError } from 'axios';
import { Form, Formik } from 'formik';
import i18next from 'i18next';
import pickBy from 'lodash.pickby';
import React, { useState } from 'react';
import { useMutation } from 'react-query';
import { toast } from 'react-toastify';
import { BlueTitle } from '../../../common/BlueTitle';
import { EntityWizardValues } from '../../../common/dialogs/entity';
import { toastConstraintValidationError } from '../../../common/dialogs/entity/toastConstraintValidationError';
import { InstanceFileInput } from '../../../common/inputs/InstanceFilesInput/InstanceFileInput';
import { InstanceSingleFileInput } from '../../../common/inputs/InstanceFilesInput/InstanceSingleFileInput';
import { JSONSchemaFormik, ajvValidate } from '../../../common/inputs/JSONSchemaFormik';
import { environment } from '../../../globals';
import { IEntity } from '../../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { ActionTypes } from '../../../interfaces/ruleBreaches/actionMetadata';
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
    }>({ isOpen: false });

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
                toast.success(i18next.t('wizard.entity.editedSuccefully'));
                onSuccessUpdate(data);
            },
            onError: (err: AxiosError, { newEntityData: newEntityDate }) => {
                const errorMetadata = err.response?.data?.metadata;
                if (errorMetadata?.errorCode === errorCodes.failedConstraintsValidation) {
                    toastConstraintValidationError(errorMetadata, entityTemplate);
                    return;
                }

                if (errorMetadata?.errorCode === errorCodes.ruleBlock) {
                    setUpdateWithRuleBreachDialogState({
                        isOpen: true,
                        brokenRules: errorMetadata.brokenRules,
                        rawBrokenRules: errorMetadata.rawBrokenRules,
                        updateEntityFormData: newEntityDate,
                    });
                }
                toast.error(i18next.t('wizard.entity.failedToEdit'));
            },
        },
    );
    return (
        <Formik
            initialValues={{ properties: fieldProperties, attachmentsProperties: fileProperties }}
            onSubmit={async (values) => {
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
                                            <Grid item xs={12} sm={8}>
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
                                                    touched={touched.properties ?? {}}
                                                    setFieldTouched={(field) => setFieldTouched(`properties.${field}`)}
                                                    isEditMode
                                                />
                                            </Grid>
                                            {templateFileKeys.length > 0 && (
                                                <Grid item xs={12} sm={4}>
                                                    <Grid container>
                                                        <Grid item xs={1}>
                                                            <Divider orientation="vertical" style={{ height: '100%', width: '5px' }} />
                                                        </Grid>
                                                        <Grid item xs={10}>
                                                            <BlueTitle
                                                                title={i18next.t('wizard.entityTemplate.attachments')}
                                                                component="h6"
                                                                variant="h6"
                                                                style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}
                                                            />
                                                            <>
                                                                {Object.entries(templateFilesProperties).map(([key, value], index) => (
                                                                    <Grid item key={key} marginTop={index > 0 ? 5 : 0}>
                                                                        {value.items === undefined ? (
                                                                            <InstanceSingleFileInput
                                                                                fileFieldName={`attachmentsProperties.${key}`}
                                                                                fieldTemplateTitle={value.title}
                                                                                setFieldValue={setFieldValue}
                                                                                required={requiredFilesNames.includes(key)}
                                                                                value={values.attachmentsProperties[key]}
                                                                                error={errors.attachmentsProperties?.[key] as string}
                                                                                setFieldTouched={setFieldTouched}
                                                                            />
                                                                        ) : (
                                                                            <InstanceFileInput
                                                                                fileFieldName={`attachmentsProperties.${key}`}
                                                                                fieldTemplateTitle={value.title}
                                                                                setFieldValue={setFieldValue}
                                                                                required={requiredFilesNames.includes(key)}
                                                                                value={values.attachmentsProperties[key]}
                                                                                error={errors.attachmentsProperties?.[key] as string}
                                                                                setFieldTouched={setFieldTouched}
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
                                        >
                                            <Grid item>
                                                <Button
                                                    style={{ borderRadius: '7px' }}
                                                    variant="outlined"
                                                    startIcon={<ClearIcon />}
                                                    onClick={() => onCancelUpdate()}
                                                >
                                                    {i18next.t('entityPage.cancel')}
                                                </Button>
                                            </Grid>
                                            <Grid item>
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
                                onCreateRuleBreachRequest={() => onCancelUpdate()}
                            />
                        )}
                    </>
                );
            }}
        </Formik>
    );
};

export { EditEntityDetails };
