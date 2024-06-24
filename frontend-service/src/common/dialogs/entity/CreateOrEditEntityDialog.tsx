import { Clear as ClearIcon, Close as CloseIcon, Done as DoneIcon } from '@mui/icons-material';
import { Autocomplete, Box, Button, Card, CardContent, CircularProgress, Divider, Grid, IconButton, TextField, Typography } from '@mui/material';
import { AxiosError } from 'axios';
import { Form, Formik } from 'formik';
import i18next from 'i18next';
import pickBy from 'lodash.pickby';
import React, { useEffect, useState } from 'react';
import { useMutation } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { EntityWizardValues } from '.';
import { environment } from '../../../globals';
import { IEntity } from '../../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { IRuleBreach, IRuleBreachPopulated } from '../../../interfaces/ruleBreaches/ruleBreach';
import UpdateEntityWithRuleBreachDialog from '../../../pages/Entity/components/UpdateEntityWithRuleBreachDialog';
import { createEntityRequest, updateEntityRequestForMultiple } from '../../../services/entitiesService';
import { filterAttachmentsAndEntitiesRefFromPropertiesSchema } from '../../../utils/pickFieldsPropertiesSchema';
import { BlueTitle } from '../../BlueTitle';
import { InstanceFileInput } from '../../inputs/InstanceFilesInput/InstanceFileInput';
import { InstanceSingleFileInput } from '../../inputs/InstanceFilesInput/InstanceSingleFileInput';
import { JSONSchemaFormik, ajvValidate } from '../../inputs/JSONSchemaFormik';
import { ChooseTemplate } from './ChooseTemplate';
import { toastConstraintValidationError } from './toastConstraintValidationError';
import { AreYouSureDialog } from '../AreYouSureDialog';
import { DraftSaveDialog } from './draftWarningDialog';

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
    onSuccessUpdate?: (data: IEntity) => void;
    onCancelUpdate: () => void;
    onSuccessCreate?: (entity: IEntity) => void;
}> = ({ isEditMode = false, entityTemplate, entity, onSuccessUpdate, onCancelUpdate, onSuccessCreate }) => {
    const [updateWithRuleBreachDialogState, setUpdateWithRuleBreachDialogState] = useState<{
        isOpen: boolean;
        brokenRules?: IRuleBreachPopulated['brokenRules'];
        rawBrokenRules?: IRuleBreach['brokenRules'];
        updateEntityFormData?: EntityWizardValues;
    }>({ isOpen: false });

    const [isAreYouSureDialogOpen, setIsAreYouSureDialogOpen] = useState(false);
    const [isSaveDraftDialogOpen, setIsSaveDraftDialogOpen] = useState(false);

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
        ({ newEntityData, ignoredRules }: { newEntityData: EntityWizardValues; ignoredRules?: IRuleBreach['brokenRules'] }) =>
            updateEntityRequestForMultiple(entity.properties._id, newEntityData, ignoredRules),
        {
            onSuccess: (data) => {
                toast.success(i18next.t('wizard.entity.editedSuccefully'));
                if (onSuccessUpdate) onSuccessUpdate(data);
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
                if (onSuccessCreate) onSuccessCreate(newEntity);
                else navigate(`/entity/${newEntity.properties._id}`);
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
                        const fieldPropertiesEnum = schema.properties[field].enum;
                        const itemFieldProperties = schema.properties[field]?.items?.enum;

                        if (fieldPropertiesEnum?.length === 1 && fieldPropertiesEnum[0] !== undefined) {
                            setFieldValue(`properties.${field}`, fieldPropertiesEnum[0]);
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
                                                    <Grid item container flexDirection="row" flexWrap="nowrap" justifyContent="space-between">
                                                        <Grid item>
                                                            <BlueTitle
                                                                title={`${
                                                                    isEditMode ? i18next.t('actions.editment') : i18next.t('actions.createment')
                                                                } ${values.template?.displayName || i18next.t('wizard.entity.createNewEntity')}`}
                                                                component="h6"
                                                                variant="h6"
                                                                style={{ fontWeight: '600', fontSize: '20px', marginTop: '0.25rem' }}
                                                            />
                                                        </Grid>
                                                        {/* omer TODO: change this to display the last  time this was saved in the local storage, only if saved at all */}
                                                        {!entityTemplate._id && (
                                                            <Grid item container xs={8} justifyContent="right">
                                                                <Typography color="#53566E" marginTop="0.5rem">
                                                                    lmfao
                                                                </Typography>
                                                            </Grid>
                                                        )}
                                                        <Grid item>
                                                            <IconButton
                                                                aria-label="close"
                                                                onClick={() => setIsAreYouSureDialogOpen(!isAreYouSureDialogOpen)}
                                                                sx={{
                                                                    color: (theme) => theme.palette.primary.main,
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
                                                    <Grid marginTop="20px" style={{ overflowY: 'scroll', maxHeight: '37rem' }}>
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
                                        {/* TODO color from theme */}
                                        <Divider orientation="horizontal" style={{ alignSelf: 'stretch', width: '100%' }} />
                                        <Grid
                                            container
                                            item
                                            flexDirection="row"
                                            flexWrap="nowrap"
                                            justifyContent="space-between"
                                            alignItems="center"
                                            paddingTop="25px"
                                        >
                                            {/* omer TODO: change this to only show if entity template has export file/s */}
                                            <Grid item container>
                                                <Autocomplete
                                                    id="template"
                                                    options={[1, 2, 3, 4]}
                                                    onChange={(_e, value) => setFieldValue('template', value || '')}
                                                    renderInput={(params) => (
                                                        <TextField
                                                            {...params}
                                                            size="medium"
                                                            error={Boolean(touched.template && errors.template)}
                                                            fullWidth
                                                            sx={{
                                                                '& .MuiInputBase-root': {
                                                                    borderRadius: '10px',
                                                                    width: 300,
                                                                },
                                                                '& fieldset': {
                                                                    borderColor: '#CCCFE5',
                                                                    color: '#CCCFE5',
                                                                },
                                                                '& label': {
                                                                    color: '#9398C2',
                                                                },
                                                            }}
                                                            helperText={
                                                                (touched.template && errors.template?._id) ||
                                                                errors.template?.displayName ||
                                                                errors.template?.properties
                                                            }
                                                            name="template"
                                                            variant="outlined"
                                                            label={i18next.t('entityTemplate')}
                                                        />
                                                    )}
                                                />
                                            </Grid>
                                            <Grid item>
                                                <Button
                                                    sx={{
                                                        borderRadius: '7px',
                                                        bgcolor: '#EBEFFA',
                                                        color: (theme) => theme.palette.primary.main,
                                                        ':hover': { color: 'white' },
                                                    }}
                                                    variant="contained"
                                                    startIcon={<ClearIcon />}
                                                    onClick={() => onCancelUpdate()}
                                                >
                                                    {i18next.t('test')}
                                                </Button>
                                            </Grid>
                                            <Grid item container justifyContent="space-between">
                                                <Grid item container flexDirection="row" justifyContent="right">
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
                        <DraftSaveDialog
                            open={isAreYouSureDialogOpen}
                            handleClose={() => {
                                setIsAreYouSureDialogOpen(!isAreYouSureDialogOpen);
                            }}
                            onYes={() => {
                                setIsSaveDraftDialogOpen(!isSaveDraftDialogOpen);
                                setIsAreYouSureDialogOpen(!isAreYouSureDialogOpen);
                                // omer TODO create draft in local storage THROUGH HERE
                            }}
                            title={i18next.t('draftSaveDialog.exitTitle')}
                            body={<Typography>{i18next.t('draftSaveDialog.exitDescription')}</Typography>}
                            noButtonTitle={i18next.t('draftSaveDialog.exit')}
                            yesButtonTitle={i18next.t('draftSaveDialog.save')}
                        />
                        <DraftSaveDialog
                            open={isSaveDraftDialogOpen}
                            handleClose={() => {
                                setIsSaveDraftDialogOpen(!isSaveDraftDialogOpen);
                            }}
                            onYes={() => {
                                // omer TODO this
                            }}
                            title={i18next.t('draftSaveDialog.notSavedTitle')}
                            body={<Typography>{i18next.t('draftSaveDialog.notSavedDescription')}</Typography>}
                            noButtonTitle={i18next.t('draftSaveDialog.backToEdit')}
                            yesButtonTitle={i18next.t('draftSaveDialog.saveAsDraft')}
                        />
                    </>
                );
            }}
        </Formik>
    );
};

export { CreateOrEditEntityDetails };
