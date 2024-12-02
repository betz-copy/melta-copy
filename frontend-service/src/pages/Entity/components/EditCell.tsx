import { Grid } from '@mui/material';
import { AxiosError } from 'axios';
import pickBy from 'lodash.pickby';
import i18next from 'i18next';
import { Form, Formik } from 'formik';
import React, { useState } from 'react';
import { useMutation } from 'react-query';
import { toast } from 'react-toastify';
import { StatusCodes } from 'http-status-codes';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { IEntity, IUniqueConstraint } from '../../../interfaces/entities';
import { updateEntityRequestForMultiple } from '../../../services/entitiesService';
import { EntityWizardValues } from '../../../common/dialogs/entity';
import { JSONSchemaFormik, ajvValidate } from '../../../common/inputs/JSONSchemaFormik';
import { IBrokenRule, IRuleBreach, IRuleBreachPopulated } from '../../../interfaces/ruleBreaches/ruleBreach';
import { environment } from '../../../globals';
import { InstanceFileInput } from '../../../common/inputs/InstanceFilesInput/InstanceFileInput';
import { InstanceSingleFileInput } from '../../../common/inputs/InstanceFilesInput/InstanceSingleFileInput';
import { ActionTypes, IAction, IActionPopulated } from '../../../interfaces/ruleBreaches/actionMetadata';
import { filterFieldsFromPropertiesSchema } from '../../../utils/pickFieldsPropertiesSchema';
import ActionOnEntityWithRuleBreachDialog from './ActionOnEntityWithRuleBreachDialog';

const { errorCodes } = environment;

const EditCell: React.FC<{
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
                const errorMetadata = err.response?.data?.metadata;

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
            initialValues={{ properties: fieldProperties, attachmentsProperties: fileProperties }}
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
            {({ setFieldValue, values, errors, touched, setFieldTouched }) => {
                return (
                    <>
                        <Form style={{ width: '200%' }}>
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
                            {templateFileKeys.length > 0 && (
                                <Grid item xs={12} sm={4}>
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
                                                    setExternalErrors={setExternalErrors}
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
                                                    setExternalErrors={setExternalErrors}
                                                />
                                            )}
                                        </Grid>
                                    ))}
                                </Grid>
                            )}
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

export { EditCell };
