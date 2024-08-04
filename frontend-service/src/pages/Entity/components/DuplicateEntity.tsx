import React, { useState } from 'react';
import { Grid, Card, CardContent, CircularProgress, Box, Divider, Button } from '@mui/material';
import { Done as DoneIcon, Clear as ClearIcon } from '@mui/icons-material';
import { useMutation } from 'react-query';
import i18next from 'i18next';
import { toast } from 'react-toastify';
import { Form, Formik } from 'formik';
import pickBy from 'lodash.pickby';
import { useLocation } from 'react-router';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { IEntity, IEntityExpanded, IUniqueConstraint } from '../../../interfaces/entities';
import { duplicateEntityRequest } from '../../../services/entitiesService';
import { EntityWizardValues } from '../../../common/dialogs/entity';
import { JSONSchemaFormik, ajvValidate } from '../../../common/inputs/JSONSchemaFormik';
import { BlueTitle } from '../../../common/BlueTitle';
import { filterAttachmentsAndEntitiesRefFromPropertiesSchema } from '../../../utils/pickFieldsPropertiesSchema';
import { DuplicateTopBar } from './DuplicateTopBar';
import { environment } from '../../../globals';
import { InstanceFileInput } from '../../../common/inputs/InstanceFilesInput/InstanceFileInput';
import { IRuleBreach, IRuleBreachPopulated } from '../../../interfaces/ruleBreaches/ruleBreach';
import ActionOnEntityWithRuleBreachDialog from './ActionOnEntityWithRuleBreachDialog';
import { ActionTypes } from '../../../interfaces/ruleBreaches/actionMetadata';
import { InstanceSingleFileInput } from '../../../common/inputs/InstanceFilesInput/InstanceSingleFileInput';

const { errorCodes } = environment;

const DuplicateEntity: React.FC<{}> = () => {
    const { state } = useLocation();
    const { entityTemplate, expandedEntity } = state as {
        entityTemplate: IMongoEntityTemplatePopulated;
        expandedEntity: IEntityExpanded;
    };
    const { entity } = expandedEntity;
    const navigate = useNavigate();
    if (!state) {
        navigate(`/entity/${entity?.properties._id}`);
    }
    const [externalErrors, setExternalErrors] = useState({ files: false, unique: {} });

    const [duplicateEntityWithRuleBreachDialogState, setDuplicateEntityWithRuleBreachDialogState] = useState<{
        isOpen: boolean;
        brokenRules?: IRuleBreachPopulated['brokenRules'];
        rawBrokenRules?: IRuleBreach['brokenRules'];
    }>({ isOpen: false });

    const { isLoading: isDuplicateLoading, mutateAsync: duplicateMutation } = useMutation(
        ({ newEntityDate, ignoredRules }: { newEntityDate: EntityWizardValues; ignoredRules?: IRuleBreach['brokenRules'] }) =>
            duplicateEntityRequest(entity.properties._id, newEntityDate, ignoredRules),
        {
            onSuccess: (data) => {
                toast.success(i18next.t('wizard.entity.duplicatedSuccessfully'));
                navigate(`/entity/${data?.properties._id}`);
                setExternalErrors({ files: false, unique: {} });
            },
            onError: (err: AxiosError) => {
                if (err.response?.status === 413) setExternalErrors((prev) => ({ ...prev, files: true }));
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

                if (errorMetadata?.errorCode === errorCodes.ruleBlock) {
                    setDuplicateEntityWithRuleBreachDialogState({
                        isOpen: true,
                        brokenRules: errorMetadata.brokenRules,
                        rawBrokenRules: errorMetadata.rawBrokenRules,
                    });
                }

                toast.error(i18next.t('wizard.entity.failedToDuplicate'));
            },
        },
    );

    const templateFilesProperties = pickBy(
        entityTemplate.properties.properties,
        (value) => (value.type === 'array' && value.items?.format === 'fileId') || value.format === 'fileId',
    );
    const templateFileKeys = Object.keys(templateFilesProperties);
    const requiredFilesNames = entityTemplate.properties.required.filter((name) => templateFileKeys.includes(name));

    const { _id, createdAt, updatedAt, disabled, ...entityToDuplicateData } = entity.properties;

    const fieldProperties = pickBy(entityToDuplicateData, (_value, key) => !templateFileKeys.includes(key)) as IEntity['properties'];
    const fileIdsProperties = pickBy(entityToDuplicateData, (_value, key) => templateFileKeys.includes(key));
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

    return (
        <Formik
            initialValues={{ properties: fieldProperties, attachmentsProperties: fileProperties }}
            onSubmit={async (values, formikHelpers) => {
                formikHelpers.setTouched({});
                duplicateMutation({ newEntityDate: { ...values, template: entityTemplate } });
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
            {({ setFieldValue, values, errors, touched, setFieldTouched }) => {
                return (
                    <>
                        <DuplicateTopBar entityTemplate={entityTemplate} />
                        <Form>
                            <Grid className="pageMargin">
                                <Grid item marginTop="20px">
                                    <Card style={{ marginTop: '20px' }}>
                                        <CardContent>
                                            <Grid container justifyContent="center">
                                                <Grid item xs={12}>
                                                    <Grid container flexDirection="row">
                                                        <Box sx={{ marginRight: '50px' }}>
                                                            <BlueTitle
                                                                title={i18next.t('wizard.entityTemplate.properties')}
                                                                component="h6"
                                                                variant="h6"
                                                            />
                                                            <JSONSchemaFormik
                                                                schema={filterAttachmentsAndEntitiesRefFromPropertiesSchema(
                                                                    entityTemplate.properties,
                                                                )}
                                                                values={values}
                                                                setValues={(propertiesValues) => setFieldValue('properties', propertiesValues)}
                                                                errors={errors.properties ?? {}}
                                                                uniqueErrors={{ ...externalErrors.unique }}
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
                                                                    style={{
                                                                        marginBottom: externalErrors.files ? '0px' : '12px',
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
                                                                <div style={{ color: '#666666', fontSize: '0.9rem', padding: '2%' }}>
                                                                    {i18next.t('wizard.entityTemplate.dragAndDropFile')}
                                                                </div>
                                                                <>
                                                                    {Object.entries(templateFilesProperties).map(([key, value], index) => (
                                                                        <Grid item key={key} marginTop={index > 0 ? 5 : 0}>
                                                                            {value.items === undefined ? (
                                                                                <InstanceSingleFileInput
                                                                                    key={key}
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
                                                                                    key={key}
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
                                                                </>
                                                            </Box>
                                                        )}
                                                    </Grid>
                                                </Grid>
                                                <Grid item xs={12} marginTop="50px">
                                                    <Divider />
                                                </Grid>
                                                <Grid item marginTop="20px">
                                                    <Grid container spacing={4}>
                                                        <Grid item>
                                                            <Button
                                                                type="submit"
                                                                variant="contained"
                                                                startIcon={
                                                                    isDuplicateLoading ? (
                                                                        <CircularProgress sx={{ color: 'white' }} size={20} />
                                                                    ) : (
                                                                        <DoneIcon />
                                                                    )
                                                                }
                                                            >
                                                                {i18next.t('entityPage.duplicate')}
                                                            </Button>
                                                        </Grid>
                                                        <Grid item>
                                                            <Button
                                                                variant="outlined"
                                                                startIcon={<ClearIcon />}
                                                                onClick={() => {
                                                                    navigate(`/entity/${entity.properties._id}`);
                                                                    setExternalErrors({ files: false, unique: {} });
                                                                }}
                                                            >
                                                                {i18next.t('entityPage.cancel')}
                                                            </Button>
                                                        </Grid>
                                                    </Grid>
                                                </Grid>
                                            </Grid>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        </Form>
                        {duplicateEntityWithRuleBreachDialogState.isOpen && (
                            <ActionOnEntityWithRuleBreachDialog
                                isLoadingActionOnEntity={isDuplicateLoading}
                                handleClose={() => setDuplicateEntityWithRuleBreachDialogState({ isOpen: false })}
                                doActionEntity={() =>
                                    duplicateMutation({
                                        newEntityDate: { ...values, template: entityTemplate },
                                        ignoredRules: duplicateEntityWithRuleBreachDialogState.rawBrokenRules!,
                                    })
                                }
                                actionType={ActionTypes.DuplicateEntity}
                                brokenRules={duplicateEntityWithRuleBreachDialogState.brokenRules!}
                                rawBrokenRules={duplicateEntityWithRuleBreachDialogState.rawBrokenRules!}
                                currEntity={entity}
                                entityFormData={{ ...values, template: entityTemplate }}
                                onUpdatedRuleBlock={(brokenRules) =>
                                    setDuplicateEntityWithRuleBreachDialogState((prevState) => ({
                                        ...prevState,
                                        brokenRules,
                                    }))
                                }
                                onCreateRuleBreachRequest={() => {
                                    setDuplicateEntityWithRuleBreachDialogState({ isOpen: false });
                                    navigate(`/entity/${entity.properties._id}`); // go back to entity. todo: use shirel's link to request
                                    setExternalErrors({ files: false, unique: {} });
                                }}
                            />
                        )}
                    </>
                );
            }}
        </Formik>
    );
};

export default DuplicateEntity;
