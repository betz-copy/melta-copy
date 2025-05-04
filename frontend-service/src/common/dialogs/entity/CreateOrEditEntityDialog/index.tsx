import { Grid, Card, CardContent, Box, Divider, Button, IconButton, CircularProgress, Typography } from '@mui/material';
import { Done as DoneIcon, Clear as ClearIcon, Close as CloseIcon } from '@mui/icons-material';
import i18next from 'i18next';
import { Form, Formik } from 'formik';
import isEqual from 'lodash.isequal';
import pickBy from 'lodash.pickby';
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { IEntity, IMultipleSelect } from '../../../../interfaces/entities';
import { EntityWizardValues } from '..';
import { environment } from '../../../../globals';
import { InstanceFileInput } from '../../../inputs/InstanceFilesInput/InstanceFileInput';
import ActionOnEntityWithRuleBreachDialog from '../../../../pages/Entity/components/ActionOnEntityWithRuleBreachDialog';
import { ChooseTemplate } from '../ChooseTemplate';
import { ActionTypes } from '../../../../interfaces/ruleBreaches/actionMetadata';
import { filterFieldsFromPropertiesSchema } from '../../../../utils/pickFieldsPropertiesSchema';
import { BlueTitle } from '../../../BlueTitle';
import { ExportFormats } from '../ExportFormats';
import { InstanceSingleFileInput } from '../../../inputs/InstanceFilesInput/InstanceSingleFileInput';
import { ajvValidate, JSONSchemaFormik } from '../../../inputs/JSONSchemaFormik';
import { DraftWarningDialog } from '../draftWarningDialog';
import { useWorkspaceStore } from '../../../../stores/workspace';
import useDraftEntityDialogHook from './useDraft';
import useMutationHandler from './useMutationHandler';
import { IExternalErrors, ICreateOrUpdateWithRuleBreachDialogState, IMutationProps, MutationActionType } from './interface';
import { ITablesResults } from '../../../../interfaces/excel';

const { errorCodes, signaturePrefix } = environment;

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
    mutationProps: IMutationProps;
    entityTemplate: IMongoEntityTemplatePopulated;
    initialCurrValues?: EntityWizardValues;
    // entityToUpdate?: IEntity;
    // entitiesToUpdate?: IMultipleSelect<boolean>;
    onSuccess: ((entity: IEntity) => void) | ((entity: ITablesResults) => void); // rename maybe or insert it to mutation prop
    handleClose: () => void;
    onError: (entity: EntityWizardValues) => void;
    externalErrors: IExternalErrors;
    setExternalErrors: React.Dispatch<React.SetStateAction<IExternalErrors>>;
    createOrUpdateWithRuleBreachDialogState: ICreateOrUpdateWithRuleBreachDialogState; // TODO understand this
    setCreateOrUpdateWithRuleBreachDialogState: React.Dispatch<React.SetStateAction<ICreateOrUpdateWithRuleBreachDialogState>>;
    showActionButtons?: boolean;
    createDraft?: boolean;
}> = ({
    mutationProps,
    entityTemplate,
    // entityToUpdate,
    // entitiesToUpdate,
    initialCurrValues,
    handleClose,
    onSuccess,
    onError,
    externalErrors,
    setExternalErrors,
    createOrUpdateWithRuleBreachDialogState,
    setCreateOrUpdateWithRuleBreachDialogState,
    showActionButtons = true,
    createDraft = true,
}) => {
    const { payload, actionType } = mutationProps;
    const [isDraftDialogOpen, setIsDraftDialogOpen] = useState(false);
    const [wasDirty, setWasDirty] = useState(false);
    const { templateFileKeys: initialTemplateFileKeys } = getEntityTemplateFilesFieldsInfo(entityTemplate);
    const [selectedFields, setSelectedFields] = useState<Record<string, boolean> | undefined>(
        actionType === MutationActionType.UpdateMultiple ? {} : undefined,
    );
    const isEditMode = actionType === MutationActionType.Update || actionType === MutationActionType.UpdateMultiple;

    const initialValues = useMemo(() => {
        if (actionType === MutationActionType.Update) {
            return convertIEntityToEntityWizardValues(payload, entityTemplate, initialTemplateFileKeys);
            // if (entityToUpdate) {
            //     return convertIEntityToEntityWizardValues(entityToUpdate, entityTemplate, initialTemplateFileKeys);
        }
        if (initialCurrValues) return initialCurrValues;
        return {
            properties: {
                disabled: false,
            },
            attachmentsProperties: {},
            template: entityTemplate,
        };
    }, [payload, entityTemplate, initialTemplateFileKeys]);

    // const handleMutationError = (err: AxiosError, template: IMongoEntityTemplatePopulated, newEntityData?: EntityWizardValues | undefined) => {
    //     if (err.response?.status === StatusCodes.REQUEST_TOO_LONG) setExternalErrors((prev) => ({ ...prev, files: true }));

    //     const errorMetadata = err.response?.data?.metadata;

    //     switch (errorMetadata?.errorCode) {
    //         case errorCodes.failedConstraintsValidation: {
    //             const { properties } = errorMetadata.constraint as Omit<IUniqueConstraint, 'constraintName'>;

    //             const constraintPropsDisplayNames = properties.map((prop) => `${prop}-${template.properties.properties[prop].title}`);

    //             constraintPropsDisplayNames.forEach((uniqueProp) => {
    //                 const [propKey, propTitle] = uniqueProp.split('-');

    //                 setExternalErrors((prev) => ({
    //                     ...prev,
    //                     unique: {
    //                         ...prev.unique,
    //                         [propKey]: `${i18next.t(
    //                             `wizard.entity.someEntityAlreadyHasTheSameField${constraintPropsDisplayNames.length > 1 ? 's' : ''}`,
    //                         )} ${propTitle}`,
    //                     },
    //                 }));
    //             });
    //             break;
    //         }

    //         case errorCodes.actionsCustomError:
    //             setExternalErrors((prev) => ({ ...prev, action: errorMetadata?.message }));
    //             break;

    //         case errorCodes.ruleBlock: {
    //             const { brokenRules, rawBrokenRules, actions, rawActions } = errorMetadata;

    //             setCreateOrUpdateWithRuleBreachDialogState!({
    //                 isOpen: true,
    //                 brokenRules,
    //                 rawBrokenRules,
    //                 newEntityData,
    //                 actions,
    //                 rawActions,
    //             });
    //             break;
    //         }

    //         default:
    //             break;
    //     }
    // };

    const [_, navigate] = useLocation();
    const workspace = useWorkspaceStore((state) => state.workspace);
    const { shouldNavigateToEntityPage } = workspace.metadata;
    // const { isLoading: isUpdateLoading, mutateAsync: updateMutation } = useMutation(
    //     ({ newEntityData, ignoredRules }: { newEntityData: EntityWizardValues; ignoredRules?: IRuleBreach['brokenRules'] }) =>
    //         updateEntityRequestForMultiple(entityToUpdate!.properties._id, newEntityData, ignoredRules),
    //     {
    //         onSuccess: (data) => {
    //             if (onSuccessUpdate) onSuccessUpdate(data);
    //             if (Object.values(externalErrors.unique).length === 0 || !externalErrors.files || externalErrors.action.length === 0) {
    //                 if (shouldNavigateToEntityPage === true) {
    //                     navigate(`/entity/${data.properties._id}`);
    //                 }
    //             }
    //         },
    //         onError: (err: AxiosError, { newEntityData }) => {
    //             handleMutationError(err, entityTemplate, newEntityData);
    //         },
    //     },    if (onSuccessUpdate) onSuccessUpdate(data);
    //         },
    //         onError: (err: AxiosError, { newEntityData }) => {
    //             handleMutationError(err, entityTemplate, newEntityData);
    //         },
    //     },
    // ); // TODO move this and all mutation func to another file and return only the wanted func
    // );

    // const { isLoading: isCreateLoading, mutateAsync: createMutation } = useMutation(
    //     ({ newEntityData, ignoredRules }: { newEntityData: EntityWizardValues; ignoredRules?: IRuleBreach['brokenRules'] }) =>
    //         createEntityRequest(newEntityData, ignoredRules),
    //     {
    //         onSuccess: (currEntity: IEntity) => {
    //             onSuccessCreate?.(currEntity);
    //             onSuccessUpdate?.(currEntity);
    //             entityId = currEntity.properties._id;

    //             if (Object.values(externalErrors.unique).length === 0 || !externalErrors.files || externalErrors.action.length === 0) {
    //                 if (shouldNavigateToEntityPage === true) {
    //                     navigate(`/entity/${currEntity.properties._id}`);
    //                 }
    //             }
    //         },
    //         onError: (err: AxiosError, { newEntityData }) => {
    //             handleMutationError(err, entityTemplate, newEntityData);
    //         },
    //     },
    // );
    // // TODO add another mutation for mult edit
    // const { isLoading: isMultUpdateLoading, mutateAsync: updateMultMutation } = useMutation(
    //     ({ newEntityData, ignoredRules }: { newEntityData: EntityWizardValues; ignoredRules?: IRuleBreach['brokenRules'] }) =>
    //         updateMultEntitiesRequestForMultiple(entitiesToUpdate!, newEntityData, ignoredRules),
    //     {
    //         onSuccess: (data) => {
    //             if (onSuccessUpdate) onSuccessUpdate(data);
    //         },
    //         onError: (err: AxiosError, { newEntityData }) => {
    //             handleMutationError(err, entityTemplate, newEntityData);
    //         },
    //     },
    // ); // TODO move this and all mutation func to another file and return only the wanted func

    const [isLoading, mutationPromiseToastify] = useMutationHandler(
        onSuccess,
        externalErrors,
        shouldNavigateToEntityPage,
        entityTemplate,
        mutationProps,
        setExternalErrors,
        errorCodes,
        setCreateOrUpdateWithRuleBreachDialogState,
        onError,
    );

    // const mutationPromiseToastify = async (values: EntityWizardValues, ignoredRules?: IRuleBreach['brokenRules']) => {
    //     // eslint-disable-next-line no-nested-ternary
    //     const mutationPromise =
    //         // !isEditMode
    //         //     ? createMutation({ newEntityData: values, ignoredRules })
    //         //     : entityToUpdate
    //         //     ? updateMutation({ newEntityData: values, ignoredRules })
    //         //     : updateMultMutation({ newEntityData: values, ignoredRules });
    //         mutateAsync?.({ newEntityData: values, ignoredRules });
    //     toast.dismiss();

    //     await new Promise<void>((resolve) => {
    //         toast.promise(
    //             mutationPromise,
    //             {
    //                 pending: `${i18next.t(`actions.${isEditMode ? 'update' : 'create'}`)} ${
    //                     entityTemplate.displayName.length > 0 ? entityTemplate.displayName : i18next.t('entity')
    //                 }`,
    //                 success: {
    //                     render({ data }: { data?: IEntity }) {
    //                         // TODO add mult
    //                         return (
    //                             <Grid display="flex" alignItems="center">
    //                                 <span>{`${i18next.t(`wizard.entity.${isEditMode ? 'editedSuccessfully' : 'createdSuccessfully'}`)}. `}</span>
    //                                 {data?.properties?._id && (
    //                                     <Button
    //                                         variant="text"
    //                                         onClick={() => {
    //                                             navigate(`/entity/${data?.properties?._id}`);
    //                                         }}
    //                                         sx={{ marginRight: '5px' }}
    //                                     >
    //                                         {i18next.t('entityPage.linkToEntityPage')}
    //                                     </Button>
    //                                 )}
    //                             </Grid>
    //                         );
    //                     },
    //                 },
    //                 error: {
    //                     render({ data }: { data?: IEntity }) {
    //                         // TODO add mult
    //                         return (
    //                             <Grid display="flex" alignItems="center">
    //                                 <span>{i18next.t(`wizard.entity.${isEditMode ? 'failedToEdit' : 'failedToCreate'}`)}</span>
    //                                 <Button
    //                                     variant="text"
    //                                     onClick={() => {
    //                                         if (data) onError({ ...values, properties: { ...data?.properties } });
    //                                     }}
    //                                     sx={{ marginRight: '5px' }}
    //                                 >
    //                                     {i18next.t('entityPage.error')}
    //                                 </Button>
    //                             </Grid>
    //                         );
    //                     },
    //                 },
    //             },
    //             {
    //                 autoClose: false,
    //                 style: { width: '335px' },
    //             },
    //         );
    //         mutationPromise?.finally(resolve);
    //     });
    // };

    const [initialValuePropsToFilter, setInitialValuePropsToFilter] = useState<object>({});

    const [deleteDraft, currentDraft, originalDrafts, createOrUpdateDraftDebounced, draftId] = useDraftEntityDialogHook(
        entityTemplate,
        setInitialValuePropsToFilter,
        signaturePrefix,
        actionType === MutationActionType.Update ? payload : undefined,
    );

    return (
        <Formik<EntityWizardValues>
            initialValues={initialValues}
            onSubmit={async (values, formikHelpers) => {
                formikHelpers.setTouched({});
                await mutationPromiseToastify(values);
                if (!draftId) return;

                // delete the draft after the debounce
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
                const nonAttachmentsSchema = filterFieldsFromPropertiesSchema(values.template.properties, selectedFields);
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
                const schema = filterFieldsFromPropertiesSchema(values.template.properties, selectedFields);
                // eslint-disable-next-line react-hooks/rules-of-hooks
                useEffect(() => {
                    setInitialValuePropsToFilter({ ...formInitialValues.properties });
                }, []);
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

                // eslint-disable-next-line react-hooks/rules-of-hooks
                const absoluteDirty = useMemo(() => {
                    // textarea/long-text causes the field to first be undefined, setting dirty to true,
                    // so we check for dirty manually while ignoring these fields
                    // (if the value changes it won't be undefined and it will consider it dirty)
                    const valuePropsToFilter = { ...values.properties };
                    Object.keys(valuePropsToFilter).forEach((key) => {
                        const isSignatureField = values.template.properties.properties[key]?.format === 'signature';
                        return valuePropsToFilter[key] === undefined || isSignatureField ? delete valuePropsToFilter[key] : {};
                    });

                    Object.keys(initialValuePropsToFilter).forEach((key) => {
                        const isSignatureField = values.template.properties.properties[key]?.format === 'signature';
                        return initialValuePropsToFilter[key] === undefined || isSignatureField ? delete initialValuePropsToFilter[key] : {};
                    });

                    return !isEqual(valuePropsToFilter, initialValuePropsToFilter);
                }, [formInitialValues, values]);
                // eslint-disable-next-line react-hooks/rules-of-hooks
                useEffect(() => {
                    if (!absoluteDirty) return;
                    if (createDraft) createOrUpdateDraftDebounced?.(values, draftId);
                    // eslint-disable-next-line react-hooks/exhaustive-deps
                }, [absoluteDirty, values, draftId]);

                // eslint-disable-next-line react-hooks/rules-of-hooks
                useEffect(() => {
                    if (absoluteDirty && !wasDirty) setWasDirty(true);
                }, [absoluteDirty]);

                if (actionType === MutationActionType.UpdateMultiple) {
                    const uniqueFields: string[] = [];
                    values.template.uniqueConstraints.forEach((groupField) => uniqueFields.push(...groupField.properties));
                    uniqueFields.forEach((uniqueField) => {
                        schema.properties[uniqueField].readOnly = true;
                    });
                }

                const onCheckboxChange =
                    actionType === MutationActionType.UpdateMultiple
                        ? (field: string, checked: boolean) => {
                              if (!checked) {
                                  setFieldTouched(`properties.${field}`, false);
                                  const { [field]: removedField, ...rest } = values.properties;
                                  setFieldValue('properties', rest);
                              }
                              setSelectedFields((prev) => {
                                  return { ...prev, [field]: checked };
                              });
                          }
                        : undefined;

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
                        setFieldTouched={(field, isTouched?) => setFieldTouched(`properties.${field}`, isTouched)}
                        isEditMode={isEditMode}
                        multipleEntities={actionType === MutationActionType.UpdateMultiple}
                        onCheckboxChange={onCheckboxChange}
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
                                                            // TODO change if mult
                                                            // ?  this is  the last update in the modal
                                                            <Grid item container xs={8} justifyContent="right">
                                                                <Typography color="#53566E" marginTop="0.5rem" fontWeight={100}>
                                                                    {i18next.t('draftSaveDialog.lastSavedAt', {
                                                                        date: new Date(currentDraft.lastSavedAt).toLocaleString('he'),
                                                                    })}
                                                                </Typography>
                                                            </Grid>
                                                        )}

                                                        {showActionButtons && (
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
                                                        )}
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
                                                    <Grid marginTop="20px" style={{ overflowY: 'auto', maxHeight: '24rem' }}>
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
                                        {showActionButtons && (
                                            <>
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
                                                    {(entityTemplate.documentTemplatesIds || values.template.documentTemplatesIds)?.length &&
                                                    actionType === MutationActionType.Update ? (
                                                        <ExportFormats
                                                            properties={{
                                                                createdAt: payload?.properties.createdAt || new Date(),
                                                                updatedAt: payload?.properties.updatedAt || new Date(),
                                                                ...values.properties,
                                                            }}
                                                            documentTemplateIds={
                                                                entityTemplate.documentTemplatesIds || values.template.documentTemplatesIds
                                                            }
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
                                                                    isLoading ? ( // TODO add mult
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
                                                                disabled={!dirty || isLoading} // TODO add mult
                                                            >
                                                                {i18next.t('entityPage.save')}
                                                            </Button>
                                                        </Grid>
                                                    </Grid>
                                                </Grid>
                                            </>
                                        )}
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Form>
                        {createOrUpdateWithRuleBreachDialogState.isOpen && (
                            <ActionOnEntityWithRuleBreachDialog // ? do later
                                isLoadingActionOnEntity={isLoading} // TODO add mult
                                handleClose={() => setCreateOrUpdateWithRuleBreachDialogState({ isOpen: false })}
                                doActionEntity={() => {
                                    return mutationPromiseToastify(
                                        createOrUpdateWithRuleBreachDialogState.newEntityData!,
                                        createOrUpdateWithRuleBreachDialogState.rawBrokenRules!,
                                    );
                                }}
                                actionType={isEditMode ? ActionTypes.UpdateEntity : ActionTypes.CreateEntity} // maybe add mult
                                brokenRules={createOrUpdateWithRuleBreachDialogState.brokenRules!}
                                rawBrokenRules={createOrUpdateWithRuleBreachDialogState.rawBrokenRules!}
                                currEntity={actionType === MutationActionType.Update ? payload : undefined}
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
                            values={{ ...values, entityId: actionType === MutationActionType.Update ? payload?.properties._id : undefined }}
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
