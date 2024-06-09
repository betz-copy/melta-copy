import React, { useEffect, useState } from 'react';
import { Grid, Card, CardContent, CircularProgress, Box, Divider, Button, IconButton } from '@mui/material';
import { Done as DoneIcon, Clear as ClearIcon, Close as CloseIcon } from '@mui/icons-material';
import { useMutation } from 'react-query';
import i18next from 'i18next';
import { toast } from 'react-toastify';
import { Form, Formik } from 'formik';
import pickBy from 'lodash.pickby';
import { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { IEntity } from '../../../interfaces/entities';
import { createEntityRequest, updateEntityRequestForMultiple } from '../../../services/entitiesService';
import { EntityWizardValues } from '.';
import { JSONSchemaFormik, ajvValidate } from '../../inputs/JSONSchemaFormik';
import { BlueTitle } from '../../BlueTitle';
import { filterAttachmentsAndEntitiesRefFromPropertiesSchema } from '../../../utils/pickFieldsPropertiesSchema';
import { IRuleBreachPopulated } from '../../../interfaces/ruleBreaches/ruleBreach';
import { environment } from '../../../globals';
import { toastConstraintValidationError } from './toastConstraintValidationError';
import { InstanceFileInput } from '../../inputs/InstanceFilesInput/InstanceFileInput';
import UpdateEntityWithRuleBreachDialog from '../../../pages/Entity/components/UpdateEntityWithRuleBreachDialog';
import { ChooseTemplate } from './ChooseTemplate';
import { InstanceSingleFileInput } from '../../inputs/InstanceFilesInput/InstanceSingleFileInput';

const { errorCodes } = environment;

const getEntityTemplateFilesFieldsInfo = (entityTemplate: IMongoEntityTemplatePopulated) => {
    const templateFilesProperties = pickBy(
        entityTemplate.properties.properties,
        (value) => (value.type === 'array' && value.items?.format === 'fileId') || value.format === 'fileId',
    );
    const templateFileKeys = Object.keys(templateFilesProperties);
    const requiredFilesNames = entityTemplate.properties.required.filter((name) => templateFileKeys.includes(name));

    return { templateFilesProperties, templateFileKeys, requiredFilesNames };
};

const CreateOrEditEntityDetails: React.FC<{
    isEditMode?: boolean;
    entityTemplate: IMongoEntityTemplatePopulated;
    entity: IEntity;
    onSuccessUpdate: (data: IEntity) => void;
    onCancelUpdate: () => void;
}> = ({ isEditMode = false, entityTemplate, entity, onSuccessUpdate, onCancelUpdate }) => {
    const [updateWithRuleBreachDialogState, setUpdateWithRuleBreachDialogState] = useState<{
        isOpen: boolean;
        brokenRules?: IRuleBreachPopulated['brokenRules'];
        rawBrokenRules?: {
            ruleId: string;
            relationshipIds: string[];
        }[];
        updateEntityFormData?: EntityWizardValues;
    }>({ isOpen: false });

    const { templateFileKeys: initialTemplateFileKeys } = getEntityTemplateFilesFieldsInfo(entityTemplate);

    // for initial values
    const fieldProperties = pickBy(entity.properties, (_value, key) => !initialTemplateFileKeys.includes(key)) as IEntity['properties'];
    const fileIdsProperties = pickBy(entity.properties, (_value, key) => initialTemplateFileKeys.includes(key));
    Object.entries(fileIdsProperties)?.forEach(([key, value]) => {
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
        ({
            newEntityData,
            ignoredRules,
        }: {
            newEntityData: EntityWizardValues;
            ignoredRules?: {
                ruleId: string;
                relationshipIds: string[];
            }[];
        }) => updateEntityRequestForMultiple(entity.properties._id, newEntityData, ignoredRules),
        {
            onSuccess: (data) => {
                toast.success(i18next.t('wizard.entity.editedSuccefully'));
                onSuccessUpdate(data);
                onCancelUpdate();
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
    const navigate = useNavigate();

    const { isLoading: isCreateLoading, mutateAsync: createMutation } = useMutation(
        (entityToCreate: EntityWizardValues) => createEntityRequest(entityToCreate),
        {
            onSuccess: (newEntity) => {
                toast.success(i18next.t('wizard.entity.createdSuccessfully'));
                onCancelUpdate();
                navigate(`/entity/${newEntity.properties._id}`);
            },
            onError: (err: AxiosError, { template }: EntityWizardValues) => {
                const errorMetadata = err.response?.data?.metadata;
                if (errorMetadata?.errorCode === errorCodes.failedConstraintsValidation) {
                    toastConstraintValidationError(errorMetadata, template);
                    return;
                }

                toast.error(i18next.t('wizard.entity.failedToCreate'));
            },
        },
    );
    return (
        <Formik
            initialValues={{ properties: fieldProperties, attachmentsProperties: fileProperties, template: entityTemplate }}
            onSubmit={async (values) => {
                if (isEditMode) updateMutation({ newEntityData: values });
                else createMutation(values);
            }}
            validate={(values) => {
                const nonAttachmentsSchema = filterAttachmentsAndEntitiesRefFromPropertiesSchema(values.template.properties);
                const propertiesErrors = ajvValidate(nonAttachmentsSchema, values.properties);
                if (Object.keys(propertiesErrors).length === 0) {
                    return {};
                }
                return { properties: propertiesErrors };
            }}
        >
            {({ setFieldValue, values, errors, touched, setFieldTouched, dirty }) => {
                const { templateFilesProperties, templateFileKeys, requiredFilesNames } = getEntityTemplateFilesFieldsInfo(
                    values.template || entityTemplate,
                );
                const isPropertiesFirst = values.template?.propertiesTypeOrder[0] === 'properties';
                const schema = filterAttachmentsAndEntitiesRefFromPropertiesSchema(values.template.properties);

                // eslint-disable-next-line react-hooks/rules-of-hooks
                useEffect(() => {
                    schema.required.forEach((field) => {
                        const properties = schema.properties[field].enum;
                        const itemFieldProperties = schema.properties[field]?.items?.enum;
                        if (properties?.length === 1 && properties[0] !== undefined) {
                            setFieldValue(`properties.${field}`, properties[0]);
                        }
                        if (itemFieldProperties?.length === 1 && itemFieldProperties[0] !== undefined) {
                            setFieldValue(`properties.${field}`, [itemFieldProperties[0]]);
                        }
                    });

                    if (!isEditMode) {
                        Object.entries(schema.properties).forEach(([propertyName, propertyValues]) => {
                            if (propertyValues.serialCurrent !== undefined) {
                                setFieldValue(`properties.${propertyName}`, propertyValues.serialCurrent);
                            }
                        });
                    }
                }, [values.template]);

                const propertiesComp = values.template?._id && (
                    <JSONSchemaFormik
                        schema={schema}
                        values={values}
                        setValues={(propertiesValues) => setFieldValue('properties', propertiesValues)}
                        errors={errors.properties ?? {}}
                        touched={touched.properties ?? {}}
                        setFieldTouched={(field) => setFieldTouched(`properties.${field}`)}
                        isEditMode={isEditMode}
                    />
                );

                const propertiesFilesComp = templateFileKeys.length > 0 && (
                    <>
                        <BlueTitle
                            title={i18next.t('wizard.entityTemplate.attachments')}
                            component="h6"
                            variant="h6"
                            style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}
                        />
                        {Object.entries(templateFilesProperties).map(([key, value], index) => (
                            <Grid item key={key} marginTop={index > 0 ? 2 : 0}>
                                {value.items ? (
                                    <InstanceFileInput
                                        key={key}
                                        fileFieldName={`attachmentsProperties.${key}`}
                                        fieldTemplateTitle={value.title}
                                        setFieldValue={setFieldValue}
                                        required={requiredFilesNames.includes(key)}
                                        value={values.attachmentsProperties[key]}
                                        error={errors.attachmentsProperties?.[key] as string}
                                        setFieldTouched={setFieldTouched}
                                    />
                                ) : (
                                    <InstanceSingleFileInput
                                        key={key}
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
                );
                return (
                    <>
                        <Form>
                            <Card>
                                <CardContent>
                                    <Grid container justifyContent="center">
                                        <Grid item container xs={12}>
                                            <Grid container flexDirection="column">
                                                <Box width="100%">
                                                    <Grid item container justifyContent="space-between">
                                                        <BlueTitle
                                                            title={`${isEditMode ? i18next.t('actions.editment') : i18next.t('actions.createment')} ${
                                                                values.template?.displayName || i18next.t('wizard.entity.createNewEntity')
                                                            }`}
                                                            component="h6"
                                                            variant="h6"
                                                            style={{ fontWeight: '600', fontSize: '20px' }}
                                                        />
                                                        <Grid item>
                                                            <IconButton
                                                                aria-label="close"
                                                                onClick={() => onCancelUpdate()}
                                                                sx={{
                                                                    color: (theme) => theme.palette.grey[500],
                                                                }}
                                                            >
                                                                <CloseIcon />
                                                            </IconButton>
                                                        </Grid>
                                                    </Grid>

                                                    {!entityTemplate._id && (
                                                        <Grid item marginTop="20px">
                                                            <ChooseTemplate
                                                                setFieldValue={setFieldValue}
                                                                values={values}
                                                                errors={errors}
                                                                touched={touched}
                                                            />
                                                        </Grid>
                                                    )}
                                                </Box>
                                                <Box width="95%" maxWidth="95%" paddingLeft="20px">
                                                    <Grid marginTop="20px" marginBottom="20px">
                                                        {isPropertiesFirst ? propertiesComp : propertiesFilesComp}
                                                    </Grid>
                                                    {templateFileKeys.length > 0 && (
                                                        <Grid item container flexDirection="column">
                                                            <Grid marginTop="20px" alignSelf="stretch">
                                                                <Divider orientation="horizontal" style={{ alignSelf: 'stretch', width: '100%' }} />
                                                            </Grid>
                                                        </Grid>
                                                    )}

                                                    <Grid marginTop="20px" marginBottom="20px">
                                                        {isPropertiesFirst ? propertiesFilesComp : propertiesComp}
                                                    </Grid>
                                                </Box>
                                            </Grid>
                                        </Grid>
                                        <Grid
                                            container
                                            item
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
                                                        isUpdateLoading || isCreateLoading ? (
                                                            <CircularProgress sx={{ color: 'white' }} size={20} />
                                                        ) : (
                                                            <DoneIcon />
                                                        )
                                                    }
                                                    disabled={!dirty || isUpdateLoading || isCreateLoading}
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

export { CreateOrEditEntityDetails };
