import React, { useState } from 'react';
import { Grid, Card, CardContent, CircularProgress, Box, Divider, Button } from '@mui/material';
import { Done as DoneIcon, Clear as ClearIcon } from '@mui/icons-material';
import { useMutation } from 'react-query';
import i18next from 'i18next';
import { toast } from 'react-toastify';
import { Form, Formik } from 'formik';
import mapValues from 'lodash.mapvalues';
import pickBy from 'lodash.pickby';
import { AxiosError } from 'axios';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { IEntity } from '../../../interfaces/entities';
import { updateEntityRequest } from '../../../services/entitiesService';
import { EntityWizardValues } from '../../../common/wizards/entity';
import { EntityFilesInput } from '../../../common/inputs/EntityFilesInput';
import { JSONSchemaFormik, ajvValidate } from '../../../common/inputs/JSONSchemaFormik';
import { BlueTitle } from '../../../common/BlueTitle';
import { filterAttachmentsPropertiesFromSchema } from '../../../utils/filterAttachmentsFromSchema';
import { IRuleBreach, IRuleBreachPopulated } from '../../../interfaces/ruleBreaches/ruleBreach';
import UpdateEntityWithRuleBreachDialog from './UpdateEntityWithRuleBreachDialog';
import { environment } from '../../../globals';
import { toastConstraintValidationError } from '../../../common/wizards/entity/toastConstraintValidationError';

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
        updateEntityFormData?: EntityWizardValues;
    }>({ isOpen: false });

    const templateFilesProperties = pickBy(entityTemplate.properties.properties, (value) => value.format === 'fileId');
    const templateFileKeys = Object.keys(templateFilesProperties);
    const requiredFilesNames = entityTemplate.properties.required.filter((name) => templateFileKeys.includes(name));
    
    const fieldProperties = pickBy(entity.properties, (_value, key) => !templateFileKeys.includes(key)) as IEntity['properties'];
    const fileIdsProperties = pickBy(entity.properties, (_value, key) => templateFileKeys.includes(key));
    const fileProperties = mapValues(fileIdsProperties, (value) => ({ name: value }));

    const { isLoading: isUpdateLoading, mutateAsync: updateMutation } = useMutation(
        ({ newEntityData, ignoredRules }: { newEntityData: EntityWizardValues; ignoredRules?: IRuleBreach['brokenRules'] }) =>
            updateEntityRequest(entity.properties._id, newEntityData, ignoredRules),
        {
            onSuccess: (data) => {
                toast.success(i18next.t('wizard.entity.editedSuccefully'));
                onSuccessUpdate(data);
            },
            onError: (err: AxiosError, { newEntityData: newEntityDate }) => {
                const errorMetadata = err.response?.data?.metadata;
                if (errorMetadata?.errorCode === errorCodes.failedConstraintsValidation) {
                    toastConstraintValidationError(errorMetadata, entityTemplate );
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
                const nonAttachmentsSchema = filterAttachmentsPropertiesFromSchema(entityTemplate.properties);
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
                                        <Grid item xs={12}>
                                            <Grid container flexDirection="row">
                                                <Box>
                                                    <BlueTitle title={i18next.t('wizard.entityTemplate.properties')} component="h6" variant="h6" />
                                                    <JSONSchemaFormik
                                                        schema={filterAttachmentsPropertiesFromSchema(entityTemplate.properties)}
                                                        values={values}
                                                        setValues={(propertiesValues) => setFieldValue('properties', propertiesValues)}
                                                        errors={errors.properties ?? {}}
                                                        touched={touched.properties ?? {}}
                                                        setFieldTouched={(field) => setFieldTouched(`properties.${field}`)}
                                                    />
                                                </Box>
                                                {templateFileKeys.length > 0 && (
                                                    <Box>
                                                        <BlueTitle
                                                            title={i18next.t('wizard.entityTemplate.attachments')}
                                                            component="h6"
                                                            variant="h6"
                                                            style={{ marginBottom: '22px' }}
                                                        />
                                                        <EntityFilesInput
                                                            requiredFilesNames={requiredFilesNames}
                                                            filesProperties={templateFilesProperties}
                                                            setFieldValue={setFieldValue}
                                                            errors={errors}
                                                            values={values}
                                                        />
                                                    </Box>
                                                )}
                                            </Grid>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Divider />
                                        </Grid>
                                        <Grid item marginTop="20px">
                                            <Grid container spacing={4}>
                                                <Grid item>
                                                    <Button
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
                                                <Grid item>
                                                    <Button variant="outlined" startIcon={<ClearIcon />} onClick={() => onCancelUpdate()}>
                                                        {i18next.t('entityPage.cancel')}
                                                    </Button>
                                                </Grid>
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
