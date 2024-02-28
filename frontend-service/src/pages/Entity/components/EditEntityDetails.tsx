import React, { useState } from 'react';
import { Grid, Card, CardContent, CircularProgress, Divider, Button } from '@mui/material';
import { Done as DoneIcon, Clear as ClearIcon } from '@mui/icons-material';
import { useMutation } from 'react-query';
import i18next from 'i18next';
import { toast } from 'react-toastify';
import { Form, Formik } from 'formik';
import pickBy from 'lodash.pickby';
import { AxiosError } from 'axios';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { IEntity } from '../../../interfaces/entities';
import { updateEntityRequestForMultiple } from '../../../services/entitiesService';
import { EntityWizardValuesNew } from '../../../common/dialogs/entity';
import { JSONSchemaFormik, ajvValidate } from '../../../common/inputs/JSONSchemaFormik';
import { BlueTitle } from '../../../common/BlueTitle';
import { filterAttachmentsAndEntitiesRefFromPropertiesSchema } from '../../../utils/pickFieldsPropertiesSchema';
import { IRuleBreach, IRuleBreachPopulated } from '../../../interfaces/ruleBreaches/ruleBreach';
import UpdateEntityWithRuleBreachDialog from './UpdateEntityWithRuleBreachDialog';
import { environment } from '../../../globals';
import { toastConstraintValidationError } from '../../../common/dialogs/entity/toastConstraintValidationError';
import { InstanceFileInput } from '../../../common/inputs/InstanceFilesInput/InstanceFileInput';
import { InstanceSingleFileInput } from '../../../common/inputs/InstanceFilesInput/InstanceSingleFileInput';

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
        rawBrokenRules?: IRuleBreach['brokenRules'];
        updateEntityFormData?: EntityWizardValuesNew;
    }>({ isOpen: false });

    const templateFilesProperties = pickBy(entityTemplate.properties.properties, (value) => (value.type === 'array' && value.items?.format==="fileId") || value.format === "fileId");
    const templateFileKeys = Object.keys(templateFilesProperties);
    const requiredFilesNames = entityTemplate.properties.required.filter((name) => templateFileKeys.includes(name));

    const fieldProperties = pickBy(entity.properties, (_value, key) => !templateFileKeys.includes(key)) as IEntity['properties'];
    const fileIdsProperties = pickBy(entity.properties, (_value, key) => templateFileKeys.includes(key));
    Object.entries(fileIdsProperties).forEach(([key, value]) => {
        if(Array.isArray(value)){
            fileIdsProperties[key] = value?.map((item) => {
                return {name: item}
            });
        }
        else {
            fileIdsProperties[key] =  {name: value};
        }
        
    });
    const fileProperties = fileIdsProperties;
    const { isLoading: isUpdateLoading, mutateAsync: updateMutation } = useMutation(
        ({ newEntityData, ignoredRules }: { newEntityData: EntityWizardValuesNew; ignoredRules?: IRuleBreach['brokenRules'] }) =>
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
                console.log(values);
                updateMutation({ newEntityData: { ...values, template: entityTemplate } });
            }}
            validate={(values) => {
                const nonAttachmentsSchema = filterAttachmentsAndEntitiesRefFromPropertiesSchema(entityTemplate.properties);
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
                                        <Grid container flexDirection="row" width="100%">
                                            <Grid xs={8}>
                                                <BlueTitle
                                                    title={`${i18next.t('actions.editment')} ${entityTemplate.displayName}`}
                                                    component="h6"
                                                    variant="h6"
                                                    style={{ fontWeight: '600', fontSize: '20px' }}
                                                />
                                                <JSONSchemaFormik
                                                    schema={filterAttachmentsAndEntitiesRefFromPropertiesSchema(entityTemplate.properties)}
                                                    values={values}
                                                    setValues={(propertiesValues) => setFieldValue('properties', propertiesValues)}
                                                    errors={errors.properties ?? {}}
                                                    touched={touched.properties ?? {}}
                                                    setFieldTouched={(field) => setFieldTouched(`properties.${field}`)}
                                                    isEditMode
                                                />
                                            </Grid>
                                            {templateFileKeys.length > 0 && (
                                                <Grid container xs={4}>
                                                    <Grid item container flexDirection="row">
                                                        <Grid item>
                                                            <Divider orientation="vertical" style={{ height: '100%', width: '5px' }} />
                                                        </Grid>
                                                        <Grid item flex={1} paddingLeft="20px" marginTop="20px" marginBottom="20px">
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
                                                                        multiple
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
                            <UpdateEntityWithRuleBreachDialog
                                isLoadingUpdateEntity={isUpdateLoading}
                                handleClose={() => setUpdateWithRuleBreachDialogState({ isOpen: false })}
                                onUpdateEntity={() => {
                                    return updateMutation({
                                        newEntityData: updateWithRuleBreachDialogState.updateEntityFormData!,
                                        ignoredRules: updateWithRuleBreachDialogState.rawBrokenRules!,
                                    });
                                }}
                                brokenRules={updateWithRuleBreachDialogState.brokenRules!}
                                rawBrokenRules={updateWithRuleBreachDialogState.rawBrokenRules!}
                                currEntity={entity}
                                updateEntityFormData={updateWithRuleBreachDialogState.updateEntityFormData!}
                                onUpdatedRuleBlock={(brokenRules) =>
                                    setUpdateWithRuleBreachDialogState((prevState) => ({
                                        ...prevState,
                                        brokenRules,
                                    }))
                                }
                            />
                        )}
                    </>
                );
            }}
        </Formik>
    );
};

export { EditEntityDetails };
