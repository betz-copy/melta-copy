import { Clear as ClearIcon, Done as DoneIcon } from '@mui/icons-material';
import { Box, Button, Card, CardContent, CircularProgress, Divider, Grid, Typography } from '@mui/material';
import { ActionTypes, IAction, IActionPopulated } from '@packages/action';
import { IEntity, IEntityExpanded, IUniqueConstraint } from '@packages/entity';
import { IMongoEntityTemplateWithConstraintsPopulated } from '@packages/entity-template';
import { IRuleBreach, IRuleBreachPopulated } from '@packages/rule-breach';
import { AxiosError } from 'axios';
import { Form, Formik } from 'formik';
import { StatusCodes } from 'http-status-codes';
import i18next from 'i18next';
import { pickBy } from 'lodash';
import React, { useState } from 'react';
import { useMutation } from 'react-query';
import { toast } from 'react-toastify';
import { useLocation, useRoute } from 'wouter';
import { EntityWizardValues } from '../../../common/dialogs/entity';
import { getInitialValuesWithDefaults } from '../../../common/dialogs/entity/CreateOrEditEntityDialog';
import { InstanceFileInput } from '../../../common/inputs/InstanceFilesInput/InstanceFileInput';
import { InstanceSingleFileInput } from '../../../common/inputs/InstanceFilesInput/InstanceSingleFileInput';
import { ajvValidate, JSONSchemaFormik } from '../../../common/inputs/JSONSchemaFormik';
import BlueTitle from '../../../common/MeltaDesigns/BlueTitle';
import { environment } from '../../../globals';
import { IErrorResponse } from '../../../interfaces/error';
import { duplicateEntityRequest } from '../../../services/entitiesService';
import { useSearchParams } from '../../../utils/hooks/useSearchParams';
import { filterFieldsFromPropertiesSchema } from '../../../utils/pickFieldsPropertiesSchema';
import ActionOnEntityWithRuleBreachDialog from './ActionOnEntityWithRuleBreachDialog';
import { DuplicateTopBar } from './DuplicateTopBar';

const { errorCodes } = environment;

const DuplicateEntity: React.FC = () => {
    const { state } = window.history;

    const [_, navigate] = useLocation();
    const [_match, params] = useRoute('/entity/:entityId/duplicate');

    if (!state) {
        console.error('No state found in history. Redirecting to entity page.');
        const { entityId } = params!;
        navigate(`/entity/${entityId}`);
    }

    const {
        entityTemplate,
        expandedEntity: { entity },
    } = state as {
        entityTemplate: IMongoEntityTemplateWithConstraintsPopulated;
        expandedEntity: IEntityExpanded;
    };

    const [searchParams, _setSearchParams] = useSearchParams();
    const childTemplateId = searchParams.get('childTemplateId') ?? undefined;

    const [externalErrors, setExternalErrors] = useState({ files: false, unique: {}, action: '' });

    const [duplicateEntityWithRuleBreachDialogState, setDuplicateEntityWithRuleBreachDialogState] = useState<{
        isOpen: boolean;
        brokenRules?: IRuleBreachPopulated['brokenRules'];
        rawBrokenRules?: IRuleBreach['brokenRules'];
        actions?: IActionPopulated[];
        rawActions?: IAction[];
    }>({ isOpen: false });

    const { isLoading: isDuplicateLoading, mutateAsync: duplicateMutation } = useMutation(
        ({ newEntityDate, ignoredRules }: { newEntityDate: EntityWizardValues; ignoredRules?: IRuleBreach['brokenRules'] }) =>
            duplicateEntityRequest(entity.properties._id, newEntityDate, ignoredRules),
        {
            onSuccess: (data) => {
                toast.success(i18next.t('wizard.entity.duplicatedSuccessfully'));
                navigate(`/entity/${data?.properties._id}${childTemplateId ? `?childTemplateId=${childTemplateId}` : ''}`);
                setExternalErrors({ files: false, unique: {}, action: '' });
            },
            onError: (err: AxiosError) => {
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
                    setExternalErrors((prev) => ({ ...prev, action: externalErrors.action }));

                if (errorMetadata?.errorCode === errorCodes.ruleBlock) {
                    const { brokenRules, rawBrokenRules, actions, rawActions } = errorMetadata;

                    setDuplicateEntityWithRuleBreachDialogState({
                        isOpen: true,
                        brokenRules,
                        rawBrokenRules,
                        actions,
                        rawActions,
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

    const { _id, _createdAt, _updatedAt, _disabled, ...entityToDuplicateData } = entity.properties;

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
            initialValues={getInitialValuesWithDefaults({
                properties: { ...fieldProperties, disabled: false },
                attachmentsProperties: fileProperties,
                template: entityTemplate,
            })}
            onSubmit={async (values, formikHelpers) => {
                formikHelpers.setTouched({});
                duplicateMutation({ newEntityDate: { ...values, template: entityTemplate } });
            }}
            validate={(values) => {
                const nonAttachmentsSchema = filterFieldsFromPropertiesSchema(entityTemplate.properties);
                const propertiesErrors = ajvValidate(nonAttachmentsSchema, values.properties, values.template.walletTransfer);
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
                                <Grid marginTop="20px">
                                    <Card style={{ marginTop: '20px' }}>
                                        <CardContent>
                                            <Grid container justifyContent="center">
                                                <Grid size={{ xs: 12 }}>
                                                    <Grid container flexDirection="row">
                                                        <Box sx={{ marginRight: '50px' }}>
                                                            <BlueTitle
                                                                title={i18next.t('wizard.entityTemplate.properties')}
                                                                component="h6"
                                                                variant="h6"
                                                            />
                                                            <JSONSchemaFormik
                                                                schema={filterFieldsFromPropertiesSchema(entityTemplate.properties)}
                                                                values={values}
                                                                setValues={(propertiesValues) => setFieldValue('properties', propertiesValues)}
                                                                errors={errors.properties ?? {}}
                                                                uniqueErrors={{ ...externalErrors.unique }}
                                                                touched={touched.properties ?? {}}
                                                                setFieldTouched={(field) => setFieldTouched(`properties.${field}`)}
                                                            />
                                                            {externalErrors.action && (
                                                                <Typography color="error" variant="caption" fontSize="14px">
                                                                    {externalErrors.action}
                                                                </Typography>
                                                            )}
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
                                                                        style={{ color: 'error', margin: 0, padding: 0, marginBottom: '12px' }}
                                                                    >
                                                                        {i18next.t('errorCodes.FILES_TOO_BIG')}
                                                                    </p>
                                                                )}
                                                                <div style={{ color: '#666666', fontSize: '0.9rem', padding: '2%' }}>
                                                                    {i18next.t('wizard.entityTemplate.dragAndDropFile')}
                                                                </div>

                                                                {Object.entries(templateFilesProperties).map(([key, value], index) => (
                                                                    <Grid key={key} marginTop={index > 0 ? 5 : 0}>
                                                                        {value.items === undefined ? (
                                                                            <InstanceSingleFileInput
                                                                                key={key}
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
                                                                                key={key}
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
                                                            </Box>
                                                        )}
                                                    </Grid>
                                                </Grid>
                                                <Grid size={{ xs: 12 }} marginTop="50px">
                                                    <Divider />
                                                </Grid>
                                                <Grid marginTop="20px">
                                                    <Grid container spacing={4}>
                                                        <Grid>
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
                                                        <Grid>
                                                            <Button
                                                                variant="outlined"
                                                                startIcon={<ClearIcon />}
                                                                onClick={() => {
                                                                    childTemplateId
                                                                        ? navigate(
                                                                              `/entity/${entity.properties._id}?childTemplateId=${childTemplateId}`,
                                                                          )
                                                                        : navigate(`/entity/${entity.properties._id}`);
                                                                    setExternalErrors({ files: false, unique: {}, action: '' });
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
                                    setExternalErrors({ files: false, unique: {}, action: '' });
                                }}
                                actions={duplicateEntityWithRuleBreachDialogState.actions}
                                rawActions={duplicateEntityWithRuleBreachDialogState.rawActions}
                            />
                        )}
                    </>
                );
            }}
        </Formik>
    );
};

export default DuplicateEntity;
