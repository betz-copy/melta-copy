import { Grid, Card, CardContent, Box, Divider, Button, IconButton, CircularProgress, Typography } from '@mui/material';
import { Done as DoneIcon, Clear as ClearIcon, Close as CloseIcon } from '@mui/icons-material';
import i18next from 'i18next';
import { Form, Formik } from 'formik';
import { AxiosError } from 'axios';
import debounce from 'lodash.debounce';
import isEqual from 'lodash.isequal';
import pickBy from 'lodash.pickby';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation } from 'react-query';
import { toast } from 'react-toastify';
import { v4 as uuid } from 'uuid';
import { useLocation } from 'wouter';
import { cloneDeep } from 'lodash';
import { StatusCodes } from 'http-status-codes';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { IEntity, IUniqueConstraint } from '../../../interfaces/entities';
import { createEntityRequest, updateEntityRequestForMultiple } from '../../../services/entitiesService';
import { EntityWizardValues } from '.';
import { environment } from '../../../globals';
import { InstanceFileInput } from '../../inputs/InstanceFilesInput/InstanceFileInput';
import ActionOnEntityWithRuleBreachDialog from '../../../pages/Entity/components/ActionOnEntityWithRuleBreachDialog';
import { ChooseTemplate } from './ChooseTemplate';
import { ActionTypes, IAction, IActionPopulated } from '../../../interfaces/ruleBreaches/actionMetadata';
import { IRuleBreach, IRuleBreachPopulated } from '../../../interfaces/ruleBreaches/ruleBreach';
import { filterFieldsFromPropertiesSchema } from '../../../utils/pickFieldsPropertiesSchema';
import { BlueTitle } from '../../BlueTitle';
import { ExportFormats } from './ExportFormats';
import { InstanceSingleFileInput } from '../../inputs/InstanceFilesInput/InstanceSingleFileInput';
import { ajvValidate, JSONSchemaFormik } from '../../inputs/JSONSchemaFormik';
import { DraftWarningDialog } from './draftWarningDialog';
import { useDraftIdStore, useDraftsStore } from '../../../stores/drafts';

const { errorCodes } = environment;

export type ICreateOrUpdateWithRuleBreachDialogState = {
    isOpen: boolean;
    brokenRules?: IRuleBreachPopulated['brokenRules'];
    rawBrokenRules?: IRuleBreach['brokenRules'];
    newEntityData?: EntityWizardValues;
    actions?: IActionPopulated[];
    rawActions?: IAction[];
};

const getEntityTemplateFilesFieldsInfo = (entityTemplate: IMongoEntityTemplatePopulated) => {
    const templateFilesProperties = pickBy(
        entityTemplate.properties.properties,
        (value) => (value.type === 'array' && value.items?.format === 'fileId') || value.format === 'fileId',
    );
    const templateFileKeys = Object.keys(templateFilesProperties);
    const requiredFilesNames = entityTemplate.properties.required.filter((name) => templateFileKeys.includes(name));

    return { templateFilesProperties, templateFileKeys, requiredFilesNames };
};

const convertIEntityToEntityWizardValues = (
    entityToUpdate: IEntity,
    entityTemplate: IMongoEntityTemplatePopulated,
    initialTemplateFileKeys: string[],
): EntityWizardValues => {
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

    return {
        properties: { ...fieldProperties, disabled: fieldProperties.disabled ?? false },
        attachmentsProperties: fileProperties,
        template: entityTemplate,
    };
};

const CreateOrEditEntityDetails: React.FC<{
    isEditMode?: boolean;
    entityTemplate: IMongoEntityTemplatePopulated;
    initialCurrValues?: EntityWizardValues;
    entityToUpdate?: IEntity;
    onSuccessUpdate?: (entity: IEntity) => void;
    onSuccessCreate?: (entity: IEntity) => void;
    handleClose: () => void;
    onError: (entity: EntityWizardValues) => void;
    externalErrors: {
        files: boolean;
        unique: {};
        action: string;
    };
    setExternalErrors: React.Dispatch<
        React.SetStateAction<{
            files: boolean;
            unique: {};
            action: string;
        }>
    >;
    createOrUpdateWithRuleBreachDialogState: ICreateOrUpdateWithRuleBreachDialogState;
    setCreateOrUpdateWithRuleBreachDialogState: React.Dispatch<React.SetStateAction<ICreateOrUpdateWithRuleBreachDialogState>>;
}> = ({
    isEditMode = false,
    entityTemplate,
    entityToUpdate,
    initialCurrValues,
    onSuccessUpdate,
    handleClose,
    onSuccessCreate,
    onError,
    externalErrors,
    setExternalErrors,
    createOrUpdateWithRuleBreachDialogState,
    setCreateOrUpdateWithRuleBreachDialogState,
}) => {
    const [isDraftDialogOpen, setIsDraftDialogOpen] = useState(false);
    const [wasDirty, setWasDirty] = useState(false);

    const { templateFileKeys: initialTemplateFileKeys } = getEntityTemplateFilesFieldsInfo(entityTemplate);
    let entityId = entityToUpdate?.properties._id;

    const initialValues = useMemo(() => {
        if (entityToUpdate) {
            return convertIEntityToEntityWizardValues(entityToUpdate, entityTemplate, initialTemplateFileKeys);
        }
        if (initialCurrValues) return initialCurrValues;
        return {
            properties: {
                disabled: false,
            },
            attachmentsProperties: {},
            template: entityTemplate,
        };
    }, [entityToUpdate, entityTemplate, initialTemplateFileKeys]);

    const handleMutationError = (err: AxiosError, template: IMongoEntityTemplatePopulated, newEntityData?: EntityWizardValues | undefined) => {
        if (err.response?.status === StatusCodes.REQUEST_TOO_LONG) setExternalErrors((prev) => ({ ...prev, files: true }));

        const errorMetadata = err.response?.data?.metadata;

        switch (errorMetadata?.errorCode) {
            case errorCodes.failedConstraintsValidation: {
                const { properties } = errorMetadata.constraint as Omit<IUniqueConstraint, 'constraintName'>;

                const constraintPropsDisplayNames = properties.map((prop) => `${prop}-${template.properties.properties[prop].title}`);

                constraintPropsDisplayNames.forEach((uniqueProp) => {
                    const [propKey, propTitle] = uniqueProp.split('-');

                    setExternalErrors((prev) => ({
                        ...prev,
                        unique: {
                            ...prev.unique,
                            [propKey]: `${i18next.t(
                                `wizard.entity.someEntityAlreadyHasTheSameField${constraintPropsDisplayNames.length > 1 ? 's' : ''}`,
                            )} ${propTitle}`,
                        },
                    }));
                });
                break;
            }

            case errorCodes.actionsCustomError:
                setExternalErrors((prev) => ({ ...prev, action: errorMetadata?.message }));
                break;

            case errorCodes.ruleBlock: {
                const { brokenRules, rawBrokenRules, actions, rawActions } = errorMetadata;

                setCreateOrUpdateWithRuleBreachDialogState!({
                    isOpen: true,
                    brokenRules,
                    rawBrokenRules,
                    newEntityData,
                    actions,
                    rawActions,
                });
                break;
            }

            default:
                break;
        }
    };

    const { isLoading: isUpdateLoading, mutateAsync: updateMutation } = useMutation(
        ({ newEntityData, ignoredRules }: { newEntityData: EntityWizardValues; ignoredRules?: IRuleBreach['brokenRules'] }) =>
            updateEntityRequestForMultiple(entityToUpdate!.properties._id, newEntityData, ignoredRules),
        {
            onSuccess: (data) => {
                if (onSuccessUpdate) onSuccessUpdate(data);
            },
            onError: (err: AxiosError, { newEntityData }) => {
                handleMutationError(err, entityTemplate, newEntityData);
            },
        },
    );

    const [_, navigate] = useLocation();

    const { isLoading: isCreateLoading, mutateAsync: createMutation } = useMutation(
        ({ newEntityData, ignoredRules }: { newEntityData: EntityWizardValues; ignoredRules?: IRuleBreach['brokenRules'] }) =>
            createEntityRequest(newEntityData, ignoredRules),
        {
            onSuccess: (currEntity: IEntity) => {
                onSuccessCreate?.(currEntity);
                onSuccessUpdate?.(currEntity);
                entityId = currEntity.properties._id;
            },
            onError: (err: AxiosError, { newEntityData }) => {
                handleMutationError(err, entityTemplate, newEntityData);
            },
        },
    );

    const mutationPromiseToastify = async (values: EntityWizardValues, ignoredRules?: IRuleBreach['brokenRules']) => {
        const mutationPromise = isEditMode
            ? updateMutation({ newEntityData: values, ignoredRules })
            : createMutation({ newEntityData: values, ignoredRules });
        toast.dismiss();

        await new Promise<void>((resolve) => {
            toast.promise(
                mutationPromise,
                {
                    pending: `${i18next.t(`actions.${isEditMode ? 'update' : 'create'}`)} ${
                        entityTemplate.displayName.length > 0 ? entityTemplate.displayName : i18next.t('entity')
                    }`,
                    success: {
                        render() {
                            return (
                                <Grid display="flex" alignItems="center">
                                    <span>{`${i18next.t(`wizard.entity.${isEditMode ? 'editedSuccessfully' : 'createdSuccessfully'}`)}. `}</span>
                                    <Button
                                        variant="text"
                                        onClick={() => {
                                            navigate(!values.properties._id ? `/entity/${entityId}` : `/entity/${values.properties._id}`);
                                        }}
                                        sx={{ marginRight: '5px' }}
                                    >
                                        {i18next.t('entityPage.linkToEntityPage')}
                                    </Button>
                                </Grid>
                            );
                        },
                    },
                    error: {
                        render() {
                            return (
                                <Grid display="flex" alignItems="center">
                                    <span>{i18next.t(`wizard.entity.${isEditMode ? 'failedToEdit' : 'failedToCreate'}`)}</span>
                                    <Button
                                        variant="text"
                                        onClick={() => {
                                            onError({ ...values, properties: { ...values.properties, _id: entityId } });
                                        }}
                                        sx={{ marginRight: '5px' }}
                                    >
                                        {i18next.t('entityPage.error')}
                                    </Button>
                                </Grid>
                            );
                        },
                    },
                },
                {
                    autoClose: false,
                    style: { width: '335px' },
                },
            );
            mutationPromise.finally(resolve);
        });
    };
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
            onSubmit={(values, formikHelpers) => {
                formikHelpers.setTouched({});
                mutationPromiseToastify(values);

                if (!draftId) return;

                // ? created via debounce, this counters that (waits for the debounce to complete and then removes the draft)
                setTimeout(
                    () =>
                        deleteDraft(
                            entityTemplate.category._id ? entityTemplate.category._id : values.template.category._id,
                            entityTemplate._id ? entityTemplate._id : values.template._id,
                            draftId,
                        ),
                    environment.draftAutoSaveDebounce,
                );
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
            {({ setFieldValue, values, errors, touched, setFieldTouched, setValues, dirty, initialValues: formInitialValues }) => {
                const { templateFilesProperties, templateFileKeys, requiredFilesNames } = getEntityTemplateFilesFieldsInfo(
                    values.template || entityTemplate,
                );
                const isPropertiesFirst = (values.template?.propertiesTypeOrder ?? [])[0] === 'properties';
                const schema = filterFieldsFromPropertiesSchema(values.template.properties);

                // eslint-disable-next-line react-hooks/rules-of-hooks
                useEffect(() => {
                    if (initialCurrValues) setValues(initialCurrValues);
                }, [initialCurrValues]);

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
                const absoluteDirty = useMemo(() => {
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
                    if (!absoluteDirty) return;
                    createOrUpdateDraftDebounced(values, draftId);
                    // eslint-disable-next-line react-hooks/exhaustive-deps
                }, [absoluteDirty, values, draftId]);

                // eslint-disable-next-line react-hooks/rules-of-hooks
                useEffect(() => {
                    if (absoluteDirty && !wasDirty) setWasDirty(true);
                }, [absoluteDirty]);

                const propertiesComp = values.template?._id && (
                    <JSONSchemaFormik
                        schema={schema}
                        values={values}
                        setValues={(propertiesValues) => {
                            return setFieldValue('properties', propertiesValues);
                        }}
                        errors={errors.properties ?? {}}
                        uniqueErrors={{ ...externalErrors.unique }}
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
                            style={{ marginBottom: externalErrors.files ? '0px' : '12px', fontSize: '16px', fontWeight: '600' }}
                        />
                        {externalErrors.files && (
                            <p id="error" style={{ color: '#d32f2f', margin: 0, padding: 0, marginBottom: '12px' }}>
                                {i18next.t('errorCodes.FILES_TOO_BIG')}
                            </p>
                        )}
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
                                        setExternalErrors={setExternalErrors}
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
                                        setExternalErrors={setExternalErrors}
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
                                                    {externalErrors.action && (
                                                        <Typography color="error" variant="caption" fontSize="16px">
                                                            {externalErrors.action}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Grid>
                                        </Grid>
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
                                            {(entityTemplate.documentTemplatesIds || values.template.documentTemplatesIds)?.length && isEditMode ? (
                                                <ExportFormats
                                                    properties={{
                                                        createdAt: isEditMode ? entityToUpdate?.properties.createdAt : new Date(),
                                                        updatedAt: isEditMode ? entityToUpdate?.properties.updatedAt : new Date(),
                                                        ...values.properties,
                                                    }}
                                                    documentTemplateIds={entityTemplate.documentTemplatesIds || values.template.documentTemplatesIds}
                                                />
                                            ) : (
                                                <Grid item xs={6}>
                                                    <Button
                                                        style={{ borderRadius: '7px' }}
                                                        variant="outlined"
                                                        startIcon={<ClearIcon />}
                                                        onClick={() => (wasDirty ? setIsDraftDialogOpen(true) : handleClose())}
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
                                                        onClick={() =>
                                                            Object.keys(errors).length > 0
                                                                ? ''
                                                                : setTimeout(() => (externalErrors ? undefined : handleClose()), 5000)
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
                                    return mutationPromiseToastify(
                                        createOrUpdateWithRuleBreachDialogState.newEntityData!,
                                        createOrUpdateWithRuleBreachDialogState.rawBrokenRules!,
                                    );
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
                                actions={createOrUpdateWithRuleBreachDialogState.actions}
                                rawActions={createOrUpdateWithRuleBreachDialogState.rawActions}
                            />
                        )}

                        <DraftWarningDialog
                            isOpen={isDraftDialogOpen}
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
