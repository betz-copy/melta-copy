import {
    Clear as ClearIcon,
    Close as CloseIcon,
    Done as DoneIcon,
    FileDownloadOutlined as FileDownloadOutlinedIcon,
    Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { Autocomplete, Box, Button, Card, CardContent, CircularProgress, Divider, Grid, IconButton, TextField, Typography } from '@mui/material';
import { AxiosError } from 'axios';
import { Form, Formik } from 'formik';
import i18next from 'i18next';
import cloneDeep from 'lodash.clonedeep';
import debounce from 'lodash.debounce';
import isEqual from 'lodash.isequal';
import pickBy from 'lodash.pickby';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { v4 as uuid } from 'uuid';
import fileDownload from 'js-file-download';
import { EntityWizardValues } from '.';
import { environment } from '../../../globals';
import { IEntity } from '../../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { ActionTypes } from '../../../interfaces/ruleBreaches/actionMetadata';
import { IRuleBreach, IRuleBreachPopulated } from '../../../interfaces/ruleBreaches/ruleBreach';
import ActionOnEntityWithRuleBreachDialog from '../../../pages/Entity/components/ActionOnEntityWithRuleBreachDialog';
import { createEntityRequest, updateEntityRequestForMultiple } from '../../../services/entitiesService';
import { useDraftIdStore, useDraftsStore } from '../../../stores/drafts';
import { filterFieldsFromPropertiesSchema } from '../../../utils/pickFieldsPropertiesSchema';
import { BlueTitle } from '../../BlueTitle';
import { InstanceFileInput } from '../../inputs/InstanceFilesInput/InstanceFileInput';
import { InstanceSingleFileInput } from '../../inputs/InstanceFilesInput/InstanceSingleFileInput';
import { JSONSchemaFormik, ajvValidate } from '../../inputs/JSONSchemaFormik';
import { ChooseTemplate } from './ChooseTemplate';
import { DraftWarningDialog } from './draftWarningDialog';
import { toastConstraintValidationError } from './toastConstraintValidationError';
import { getFileName } from '../../../utils/getFileName';
import { exportEntityToFormatFile } from '../../../services/templates/enitityTemplatesService';
import { getLongDate } from '../../../utils/date';

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
    entityToUpdate?: IEntity;
    onSuccessUpdate?: (data: IEntity) => void;
    onSuccessCreate?: (entity: IEntity) => void;
    handleClose: () => void;
}> = ({ isEditMode = false, entityTemplate, entityToUpdate, onSuccessUpdate, onSuccessCreate, handleClose }) => {
    const [createOrUpdateWithRuleBreachDialogState, setCreateOrUpdateWithRuleBreachDialogState] = useState<{
        isOpen: boolean;
        brokenRules?: IRuleBreachPopulated['brokenRules'];
        rawBrokenRules?: IRuleBreach['brokenRules'];
        newEntityData?: EntityWizardValues;
    }>({ isOpen: false });

    const [isDraftDialogOpen, setIsDraftDialogOpen] = useState(false);
    const [wasDirty, setWasDirty] = useState(false);
    const [selectedFileToExport, setSelectedFileToExport] = useState<string>('');
    const [exportedFile, setExportedFile] = useState<string>('');

    const { templateFileKeys: initialTemplateFileKeys } = getEntityTemplateFilesFieldsInfo(entityTemplate);

    let initialValues: EntityWizardValues;
    if (entityToUpdate) {
        const { _id, createdAt, updatedAt, disabled, ...entityToUpdateData } = entityToUpdate.properties;

        const fieldProperties = pickBy(entityToUpdateData, (_value, key) => !initialTemplateFileKeys.includes(key));
        const fileIdsProperties = pickBy(entityToUpdateData, (_value, key) => initialTemplateFileKeys.includes(key));
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

        initialValues = {
            properties: { ...fieldProperties, disabled },
            attachmentsProperties: fileProperties,
            template: entityTemplate,
        };
    } else {
        initialValues = {
            properties: {
                disabled: false,
            },
            attachmentsProperties: {},
            template: entityTemplate,
        };
    }

    const { isLoading: isUpdateLoading, mutateAsync: updateMutation } = useMutation(
        ({ newEntityData, ignoredRules }: { newEntityData: EntityWizardValues; ignoredRules?: IRuleBreach['brokenRules'] }) =>
            updateEntityRequestForMultiple(entityToUpdate!.properties._id, newEntityData, ignoredRules),
        {
            onSuccess: (data) => {
                toast.success(i18next.t('wizard.entity.editedSuccefully'));
                handleClose();
                if (onSuccessUpdate) onSuccessUpdate(data);
            },
            onError: (err: AxiosError, { newEntityData }) => {
                const errorMetadata = err.response?.data?.metadata;
                if (errorMetadata?.errorCode === errorCodes.failedConstraintsValidation) {
                    toastConstraintValidationError(errorMetadata, entityTemplate);
                    return;
                }

                if (errorMetadata?.errorCode === errorCodes.ruleBlock) {
                    setCreateOrUpdateWithRuleBreachDialogState({
                        isOpen: true,
                        brokenRules: errorMetadata.brokenRules,
                        rawBrokenRules: errorMetadata.rawBrokenRules,
                        newEntityData,
                    });
                }
                toast.error(i18next.t('wizard.entity.failedToEdit'));
            },
        },
    );

    const navigate = useNavigate();

    const { isLoading: isCreateLoading, mutateAsync: createMutation } = useMutation(
        ({ newEntityData, ignoredRules }: { newEntityData: EntityWizardValues; ignoredRules?: IRuleBreach['brokenRules'] }) =>
            createEntityRequest(newEntityData, ignoredRules),
        {
            onSuccess: (newEntity) => {
                toast.success(i18next.t('wizard.entity.createdSuccessfully'));
                handleClose();
                if (onSuccessCreate) onSuccessCreate(newEntity);
                else navigate(`/entity/${newEntity.properties._id}`);
            },
            onError: (err: AxiosError, { newEntityData }) => {
                const errorMetadata = err.response?.data?.metadata;
                if (errorMetadata?.errorCode === errorCodes.failedConstraintsValidation) {
                    toastConstraintValidationError(errorMetadata, newEntityData.template);
                    return;
                }

                if (errorMetadata?.errorCode === errorCodes.ruleBlock) {
                    setCreateOrUpdateWithRuleBreachDialogState({
                        isOpen: true,
                        brokenRules: errorMetadata.brokenRules,
                        rawBrokenRules: errorMetadata.rawBrokenRules,
                        newEntityData,
                    });
                }

                toast.error(i18next.t('wizard.entity.failedToCreate'));
            },
        },
    );

    const drafts = useDraftsStore((state) => state.drafts);
    const createOrUpdateDraft = useDraftsStore((state) => state.createOrUpdateDraft);
    const deleteDraft = useDraftsStore((state) => state.deleteDraft);

    const draftId = useDraftIdStore((state) => state.draftId);
    const setDraftId = useDraftIdStore((state) => state.setDraftId);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const originalDrafts = useMemo(() => cloneDeep(drafts), []);

    const currentDraft = useMemo(
        () => drafts[entityTemplate.category._id]?.[entityTemplate._id]?.find(({ uniqueId }) => uniqueId === draftId),
        [drafts, entityTemplate._id, entityTemplate.category._id, draftId],
    );

    return (
        <Formik<EntityWizardValues>
            initialValues={initialValues}
            onSubmit={async (values) => {
                if (isEditMode && entityToUpdate?.properties._id) updateMutation({ newEntityData: values });
                else createMutation({ newEntityData: values });

                if (!draftId) return;
                deleteDraft(entityTemplate.category._id, entityTemplate._id, draftId);
            }}
            validate={(values) => {
                const nonAttachmentsSchema = filterFieldsFromPropertiesSchema(values.template.properties);
                const propertiesErrors = ajvValidate(nonAttachmentsSchema, values.properties);
                if (Object.keys(propertiesErrors).length === 0) {
                    return {};
                }
                return { properties: propertiesErrors };
            }}
        >
            {({ setFieldValue, values, errors, touched, setFieldTouched, dirty, initialValues: formInitialValues }) => {
                const { templateFilesProperties, templateFileKeys, requiredFilesNames } = getEntityTemplateFilesFieldsInfo(
                    values.template || entityTemplate,
                );
                const isPropertiesFirst = (values.template?.propertiesTypeOrder ?? [])[0] === 'properties';
                const schema = filterFieldsFromPropertiesSchema(values.template.properties);

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
                    // eslint-disable-next-line react-hooks/exhaustive-deps
                }, [values.template]);

                // eslint-disable-next-line react-hooks/rules-of-hooks, react-hooks/exhaustive-deps
                const createOrUpdateDraftDebounced = useCallback(
                    debounce((newValues: EntityWizardValues, newDraftId: string) => {
                        let uniqueDraftId = newDraftId;

                        if (!newDraftId) {
                            const createdDraftId = uuid();
                            setDraftId(createdDraftId);
                            uniqueDraftId = createdDraftId;
                        }

                        createOrUpdateDraft(
                            newValues.template.category._id,
                            newValues.template._id,
                            { ...newValues, entityId: entityToUpdate?.properties._id },
                            uniqueDraftId,
                        );
                    }, environment.draftAutoSaveDebounce),
                    [],
                );

                // eslint-disable-next-line react-hooks/rules-of-hooks
                const betterDirty = useMemo(() => {
                    // textarea/long-text causes the field to first be undefined, setting dirty to true,
                    // so we check for dirty manually while ignoring these fields
                    // (if the value changes it won't be undefined and it will consider it dirty)
                    const valuePropsToFilter = { ...values.properties };
                    const initialValuePropsToFilter = { ...formInitialValues.properties };

                    Object.keys(valuePropsToFilter).forEach((key) => (valuePropsToFilter[key] === undefined ? delete valuePropsToFilter[key] : {}));
                    Object.keys(initialValuePropsToFilter).forEach((key) =>
                        initialValuePropsToFilter[key] === undefined ? delete initialValuePropsToFilter[key] : {},
                    );

                    return !isEqual(valuePropsToFilter, initialValuePropsToFilter);
                }, [formInitialValues, values]);

                // eslint-disable-next-line react-hooks/rules-of-hooks
                useEffect(() => {
                    if (!betterDirty) return;
                    createOrUpdateDraftDebounced(values, draftId);
                    // eslint-disable-next-line react-hooks/exhaustive-deps
                }, [betterDirty, values, draftId]);

                // eslint-disable-next-line react-hooks/rules-of-hooks
                useEffect(() => {
                    if (betterDirty && !wasDirty) setWasDirty(true);
                }, [betterDirty]);

                // eslint-disable-next-line react-hooks/rules-of-hooks
                const { isLoading: isExportToFileLoading, mutateAsync: exportMutation } = useMutation(
                    ({ entityId, templateId }: { entityId: string; templateId: string }) => exportEntityToFormatFile(entityId, templateId),
                    {
                        onSuccess: (data) => setExportedFile(data),
                        onError: () => {
                            toast.error(i18next.t('errorPage.fileDownloadError'));
                        },
                    },
                );

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
                                        value={values.attachmentsProperties[key] as File[] | undefined}
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
                                        value={values.attachmentsProperties[key] as File | undefined}
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

                                                        {currentDraft && (
                                                            <Grid item container xs={8} justifyContent="right">
                                                                <Typography color="#53566E" marginTop="0.5rem" fontWeight={100}>
                                                                    {i18next.t('draftSaveDialog.lastSavedAt', {
                                                                        date: new Date(currentDraft.lastSavedAt).toLocaleString('he'),
                                                                    })}
                                                                </Typography>
                                                            </Grid>
                                                        )}

                                                        <Grid item>
                                                            <IconButton
                                                                onClick={() => (wasDirty ? setIsDraftDialogOpen(true) : handleClose())}
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
                                            width="100%"
                                        >
                                            {entityTemplate.pdfTemplatesIds?.length ? (
                                                <Grid item container xs={6} flexDirection="row" flexWrap="nowrap" spacing={2} alignItems="center">
                                                    <Grid item>
                                                        <Autocomplete
                                                            options={
                                                                entityTemplate.pdfTemplatesIds?.map((fileName) => ({
                                                                    label: getFileName(fileName),
                                                                    value: fileName,
                                                                })) || []
                                                            }
                                                            onChange={(_e, selectedOption) => setSelectedFileToExport(selectedOption?.value!)}
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
                                                                    name="selectedExportFormat"
                                                                    variant="outlined"
                                                                    label={i18next.t('wizard.entityTemplate.exportFormats')}
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
                                                                textWrap: 'nowrap',
                                                            }}
                                                            variant="contained"
                                                            startIcon={<VisibilityIcon />}
                                                            onClick={() => handleClose()}
                                                            disabled={!(selectedFileToExport?.length && !values.properties._id)}
                                                        >
                                                            {i18next.t('entityPage.preview')}
                                                        </Button>
                                                    </Grid>
                                                    <Grid item>
                                                        <Button
                                                            sx={{
                                                                borderRadius: '7px',
                                                                bgcolor: '#EBEFFA',
                                                                color: (theme) => theme.palette.primary.main,
                                                                ':hover': { color: 'white' },
                                                                textWrap: 'nowrap',
                                                            }}
                                                            variant="contained"
                                                            startIcon={<FileDownloadOutlinedIcon />}
                                                            onClick={async () => {
                                                                const file = await exportMutation({
                                                                    entityId: values.properties._id || entityToUpdate?.properties._id,
                                                                    templateId: selectedFileToExport,
                                                                });

                                                                fileDownload(
                                                                    file,
                                                                    `${getFileName(selectedFileToExport).split('.')[0]}_${getLongDate(
                                                                        new Date(),
                                                                    )}.docx`,
                                                                );
                                                            }}
                                                            disabled={!(selectedFileToExport?.length && !values.properties._id)}
                                                        >
                                                            {i18next.t('entityPage.download')}
                                                        </Button>
                                                    </Grid>
                                                </Grid>
                                            ) : (
                                                <Grid item xs={6}>
                                                    <Button
                                                        style={{ borderRadius: '7px' }}
                                                        variant="outlined"
                                                        startIcon={<ClearIcon />}
                                                        onClick={async () => {
                                                            const file = await exportMutation({
                                                                entityId: values.properties._id || entityToUpdate?.properties._id,
                                                                templateId: selectedFileToExport,
                                                            });

                                                            fileDownload(file, 'simple-template');
                                                        }}
                                                    >
                                                        {i18next.t('entityPage.cancel')}
                                                    </Button>
                                                </Grid>
                                            )}
                                            <Grid item xs={6} container justifyContent="space-between">
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
                        {createOrUpdateWithRuleBreachDialogState.isOpen && (
                            <ActionOnEntityWithRuleBreachDialog
                                isLoadingActionOnEntity={isEditMode ? isUpdateLoading : isCreateLoading}
                                handleClose={() => setCreateOrUpdateWithRuleBreachDialogState({ isOpen: false })}
                                doActionEntity={() => {
                                    if (isEditMode) {
                                        return updateMutation({
                                            newEntityData: createOrUpdateWithRuleBreachDialogState.newEntityData!,
                                            ignoredRules: createOrUpdateWithRuleBreachDialogState.rawBrokenRules!,
                                        });
                                    }

                                    return createMutation({
                                        newEntityData: createOrUpdateWithRuleBreachDialogState.newEntityData!,
                                        ignoredRules: createOrUpdateWithRuleBreachDialogState.rawBrokenRules!,
                                    });
                                }}
                                actionType={isEditMode ? ActionTypes.UpdateEntity : ActionTypes.CreateEntity}
                                brokenRules={createOrUpdateWithRuleBreachDialogState.brokenRules!}
                                rawBrokenRules={createOrUpdateWithRuleBreachDialogState.rawBrokenRules!}
                                currEntity={entityToUpdate}
                                entityFormData={createOrUpdateWithRuleBreachDialogState.newEntityData!}
                                onUpdatedRuleBlock={(brokenRules) =>
                                    setCreateOrUpdateWithRuleBreachDialogState((prevState) => ({
                                        ...prevState,
                                        brokenRules,
                                    }))
                                }
                                onCreateRuleBreachRequest={() => handleClose()}
                            />
                        )}

                        <DraftWarningDialog
                            open={isDraftDialogOpen}
                            handleClose={() => setIsDraftDialogOpen(false)}
                            closeCreateOrEditDialog={handleClose}
                            values={{ ...values, entityId: entityToUpdate?.properties._id }}
                            isEditMode={isEditMode}
                            originalDrafts={originalDrafts}
                        />
                    </>
                );
            }}
        </Formik>
    );
};

export { CreateOrEditEntityDetails };
