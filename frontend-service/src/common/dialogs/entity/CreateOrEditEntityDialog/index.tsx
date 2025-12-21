import { Clear as ClearIcon, Done as DoneIcon } from '@mui/icons-material';
import { Button, Card, CardContent, CircularProgress, Divider, Grid } from '@mui/material';
import { ByCurrentDefaultValue, IMongoChildTemplateWithConstraintsPopulated } from '@packages/child-template';
import { IEntity } from '@packages/entity';
import { IMongoEntityTemplateWithConstraintsPopulated } from '@packages/entity-template';
import { ActionTypes } from '@packages/rule-breach';
import { format } from 'date-fns';
import { Form, Formik } from 'formik';
import i18next from 'i18next';
import pickBy from 'lodash.pickby';
import React, { useEffect, useMemo, useState } from 'react';
import { environment } from '../../../../globals';
import { ICreateOrUpdateWithRuleBreachDialogState, IExternalErrors, IMutationProps } from '../../../../interfaces/CreateOrEditEntityDialog';
import ActionOnEntityWithRuleBreachDialog from '../../../../pages/Entity/components/ActionOnEntityWithRuleBreachDialog';
import { useClientSideUserStore } from '../../../../stores/clientSideUser';
import { UserState, useUserStore } from '../../../../stores/user';
import { useWorkspaceStore } from '../../../../stores/workspace';
import { filterFieldsFromPropertiesSchema } from '../../../../utils/pickFieldsPropertiesSchema';
import { ajvValidate } from '../../../inputs/JSONSchemaFormik';
import { EntityWizardValues } from '..';
import { IChooseTemplateMode } from '../ChooseTemplate';
import { DraftWarningDialog } from '../draftWarningDialog';
import { ExportFormats } from '../ExportFormats';
import EditProps from './EditProps';
import useDraftEntityDialogHook from './useDraft';
import useMutationHandler from './useMutationHandler';

export const getEntityTemplateFilesFieldsInfo = (
    entityTemplate: IMongoEntityTemplateWithConstraintsPopulated | IMongoChildTemplateWithConstraintsPopulated,
) => {
    const templateFilesProperties = pickBy(
        entityTemplate.properties.properties,
        (value) => ((value.type === 'array' && value.items?.format === 'fileId') || value.format === 'fileId') && value.display !== false,
    );
    const templateFileKeys = Object.keys(templateFilesProperties);
    const requiredFilesNames = entityTemplate.properties.required.filter((name) => templateFileKeys.includes(name));

    return { templateFilesProperties, templateFileKeys, requiredFilesNames };
};

const convertIEntityToEntityWizardValues = (
    entityToUpdate: IEntity,
    entityTemplate: IMongoEntityTemplateWithConstraintsPopulated | IMongoChildTemplateWithConstraintsPopulated,
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

export const getInitialValuesWithDefaults = (initialCurrValues: EntityWizardValues, currentUser?: UserState['user']): EntityWizardValues => {
    const { attachmentsProperties, properties, template } = initialCurrValues;

    const mergedProperties = {
        ...Object.fromEntries(
            Object.entries(template.properties.properties)
                .map(([key, { defaultValue, format: formatProperty }]) => {
                    if (
                        (formatProperty === 'user' && currentUser && defaultValue === ByCurrentDefaultValue.byCurrentUser) ||
                        ('filterByCurrentUserField' in template && template.filterByCurrentUserField === key)
                    )
                        // When preselecting a user - its _id shouldn't be the melta user id, but the kartoffelId should
                        properties[key] = JSON.stringify({ ...currentUser, _id: currentUser?.kartoffelId });

                    if ((formatProperty === 'date' || formatProperty === 'date-time') && defaultValue === ByCurrentDefaultValue.byCurrentDate) {
                        const currentDate = new Date();
                        properties[key] = formatProperty === 'date-time' ? currentDate.toISOString() : format(currentDate, 'yyyy-MM-dd');
                    }

                    return [key, properties[key] ?? defaultValue];
                })
                .filter(([_key, value]) => value !== null && value !== undefined),
        ),
        disabled: properties.disabled ?? false,
    };

    return {
        properties: mergedProperties,
        attachmentsProperties,
        template,
    };
};

const CreateOrEditEntityDetails: React.FC<{
    mutationProps: IMutationProps;
    entityTemplate: IMongoEntityTemplateWithConstraintsPopulated | IMongoChildTemplateWithConstraintsPopulated;
    initialCurrValues?: EntityWizardValues;
    handleClose: () => void;
    externalErrors: IExternalErrors;
    setExternalErrors: React.Dispatch<React.SetStateAction<IExternalErrors>>;
    createOrUpdateWithRuleBreachDialogState: ICreateOrUpdateWithRuleBreachDialogState;
    setCreateOrUpdateWithRuleBreachDialogState: React.Dispatch<React.SetStateAction<ICreateOrUpdateWithRuleBreachDialogState>>;
    showActionButtons?: boolean;
    chooseMode?: IChooseTemplateMode;
    parentId?: string;
    getInitialProperties?: (
        newTemplate: IMongoEntityTemplateWithConstraintsPopulated | IMongoChildTemplateWithConstraintsPopulated,
    ) => Record<string, any>;
}> = ({
    mutationProps,
    entityTemplate,
    initialCurrValues,
    handleClose,
    externalErrors,
    setExternalErrors,
    createOrUpdateWithRuleBreachDialogState,
    setCreateOrUpdateWithRuleBreachDialogState,
    showActionButtons = true,
    chooseMode = IChooseTemplateMode.TemplatesAndChildren,
    parentId,
    getInitialProperties,
}) => {
    const { payload, actionType } = mutationProps;
    const [isDraftDialogOpen, setIsDraftDialogOpen] = useState(false);
    const [wasDirty, setWasDirty] = useState(false);
    const [isSubmitPressed, setIsSubmitPressed] = useState(false);
    const [initialValuePropsToFilter, setInitialValuePropsToFilter] = useState<Record<string, any>>({});

    const isEditMode = actionType === ActionTypes.UpdateEntity;

    const workspace = useWorkspaceStore((state) => state.workspace);
    const currentUser = useUserStore((state) => state.user);
    const { shouldNavigateToEntityPage } = workspace.metadata;

    const { templateFileKeys: initialTemplateFileKeys } = getEntityTemplateFilesFieldsInfo(entityTemplate);

    const initialValues = useMemo(() => {
        if (isEditMode)
            return getInitialValuesWithDefaults(convertIEntityToEntityWizardValues(payload!, entityTemplate, initialTemplateFileKeys), currentUser);

        return getInitialValuesWithDefaults(
            initialCurrValues ?? {
                properties: {
                    disabled: false,
                },
                attachmentsProperties: {},
                template: entityTemplate,
            },
            // TODO don't add currentUser default value to each form user field
            currentUser,
        );
    }, [payload, entityTemplate, initialTemplateFileKeys, currentUser]);

    const clientSideUserEntity: IEntity = useClientSideUserStore((state) => state.clientSideUserEntity);

    const finalMutationProps = useMemo(() => {
        if (Object.keys(clientSideUserEntity).length) {
            return {
                ...mutationProps,
                actionType: ActionTypes.CreateClientSideEntity,
            };
        }
        return mutationProps;
    }, [mutationProps, clientSideUserEntity]) as IMutationProps;

    const [isLoading, mutationPromiseToastify] = useMutationHandler(
        externalErrors,
        shouldNavigateToEntityPage,
        entityTemplate,
        finalMutationProps,
        setExternalErrors,
        setCreateOrUpdateWithRuleBreachDialogState,
        clientSideUserEntity,
    );

    const [deleteDraft, currentDraft, originalDrafts, createOrUpdateDraftDebounced, draftId] = useDraftEntityDialogHook(
        entityTemplate,
        setInitialValuePropsToFilter,
        payload,
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
                const nonAttachmentsSchema = filterFieldsFromPropertiesSchema(values.template?.properties);
                const propertiesErrors = ajvValidate(nonAttachmentsSchema, values.properties);

                if (Object.keys(propertiesErrors).length === 0) {
                    return {};
                }

                return { properties: propertiesErrors };
            }}
        >
            {({ setFieldValue, values, errors, touched, setFieldTouched, setValues, dirty, initialValues: formInitialValues }) => {
                useEffect(() => {
                    if (initialCurrValues) setValues(getInitialValuesWithDefaults(initialCurrValues, currentUser));
                }, [initialCurrValues]);

                return (
                    <>
                        <Form>
                            <Card sx={{ display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
                                <CardContent
                                    sx={{
                                        flex: 1,
                                        overflowY: 'auto',
                                        position: 'relative',
                                        paddingTop: 0,
                                    }}
                                >
                                    <Grid container justifyContent="center">
                                        <EditProps
                                            setFieldValue={setFieldValue}
                                            values={values}
                                            errors={isSubmitPressed ? errors : {}}
                                            touched={touched}
                                            setFieldTouched={setFieldTouched}
                                            initialValues={formInitialValues}
                                            setInitialValuePropsToFilter={setInitialValuePropsToFilter}
                                            initialValuePropsToFilter={initialValuePropsToFilter}
                                            createOrUpdateDraftDebounced={createOrUpdateDraftDebounced}
                                            isMultipleSelection={false}
                                            entityTemplate={entityTemplate}
                                            draftId={draftId}
                                            wasDirty={wasDirty}
                                            setWasDirty={setWasDirty}
                                            externalErrors={externalErrors}
                                            setExternalErrors={setExternalErrors}
                                            isEditMode={isEditMode}
                                            currentDraft={currentDraft}
                                            showCloseButton={showActionButtons}
                                            setIsDraftDialogOpen={setIsDraftDialogOpen}
                                            handleClose={handleClose}
                                            chooseMode={chooseMode}
                                            parentId={parentId}
                                            getInitialProperties={getInitialProperties}
                                        />
                                    </Grid>
                                </CardContent>
                                <Divider />
                                <div style={{ position: 'sticky', bottom: 0, zIndex: 2 }}>
                                    <Grid
                                        container
                                        flexDirection="row"
                                        flexWrap="nowrap"
                                        justifyContent="space-between"
                                        alignItems="center"
                                        padding="0.8rem"
                                        width="100%"
                                    >
                                        {(entityTemplate.documentTemplatesIds || values.template?.documentTemplatesIds)?.length && isEditMode ? (
                                            <ExportFormats
                                                properties={{
                                                    createdAt: payload?.properties.createdAt || new Date(),
                                                    updatedAt: payload?.properties.updatedAt || new Date(),
                                                    ...values.properties,
                                                }}
                                                documentTemplateIds={entityTemplate.documentTemplatesIds || values.template?.documentTemplatesIds}
                                                templateId={values.template._id}
                                            />
                                        ) : (
                                            <Grid size={{ xs: 6 }}>
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
                                        <Grid size={{ xs: 6 }} container justifyContent="end">
                                            <Button
                                                style={{ borderRadius: '7px' }}
                                                type="submit"
                                                variant="contained"
                                                startIcon={isLoading ? <CircularProgress sx={{ color: 'white' }} size={20} /> : <DoneIcon />}
                                                onClick={() => {
                                                    setIsSubmitPressed(true);
                                                    Object.keys(errors).length
                                                        ? ''
                                                        : setTimeout(() => (externalErrors ? undefined : handleClose()), 5000);
                                                }}
                                                disabled={!dirty || isLoading}
                                            >
                                                {i18next.t('entityPage.save')}
                                            </Button>
                                        </Grid>
                                    </Grid>
                                </div>
                            </Card>
                        </Form>
                        {createOrUpdateWithRuleBreachDialogState.isOpen && (
                            <ActionOnEntityWithRuleBreachDialog
                                isLoadingActionOnEntity={isLoading}
                                handleClose={() => setCreateOrUpdateWithRuleBreachDialogState({ isOpen: false })}
                                doActionEntity={() => {
                                    return mutationPromiseToastify(
                                        createOrUpdateWithRuleBreachDialogState.newEntityData!,
                                        createOrUpdateWithRuleBreachDialogState.rawBrokenRules!,
                                    );
                                }}
                                actionType={actionType}
                                brokenRules={createOrUpdateWithRuleBreachDialogState.brokenRules!}
                                rawBrokenRules={createOrUpdateWithRuleBreachDialogState.rawBrokenRules!}
                                currEntity={payload}
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
                            values={{ ...values, entityId: payload?.properties?._id }}
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
