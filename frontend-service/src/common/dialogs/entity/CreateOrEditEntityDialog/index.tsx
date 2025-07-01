import { Grid, Card, CardContent, Divider, Button, CircularProgress } from '@mui/material';
import { Done as DoneIcon, Clear as ClearIcon } from '@mui/icons-material';
import i18next from 'i18next';
import { Form, Formik } from 'formik';
import pickBy from 'lodash.pickby';
import React, { useEffect, useMemo, useState } from 'react';
import { IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { IEntity } from '../../../../interfaces/entities';
import { EntityWizardValues } from '..';
import { environment } from '../../../../globals';
import ActionOnEntityWithRuleBreachDialog from '../../../../pages/Entity/components/ActionOnEntityWithRuleBreachDialog';
import { ActionTypes } from '../../../../interfaces/ruleBreaches/actionMetadata';
import { filterFieldsFromPropertiesSchema } from '../../../../utils/pickFieldsPropertiesSchema';
import { ExportFormats } from '../ExportFormats';
import { ajvValidate } from '../../../inputs/JSONSchemaFormik';
import { DraftWarningDialog } from '../draftWarningDialog';
import { useWorkspaceStore } from '../../../../stores/workspace';
import useDraftEntityDialogHook from './useDraft';
import useMutationHandler from './useMutationHandler';
import { IExternalErrors, ICreateOrUpdateWithRuleBreachDialogState, IMutationProps } from '../../../../interfaces/CreateOrEditEntityDialog';
import EditProps from './EditProps';
import { useClientSideUserStore } from '../../../../stores/clientSideUser';

const { signaturePrefix } = environment;

export const getEntityTemplateFilesFieldsInfo = (entityTemplate: IMongoEntityTemplatePopulated) => {
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
    handleClose: () => void;
    externalErrors: IExternalErrors;
    setExternalErrors: React.Dispatch<React.SetStateAction<IExternalErrors>>;
    createOrUpdateWithRuleBreachDialogState: ICreateOrUpdateWithRuleBreachDialogState;
    setCreateOrUpdateWithRuleBreachDialogState: React.Dispatch<React.SetStateAction<ICreateOrUpdateWithRuleBreachDialogState>>;
    showActionButtons?: boolean;
    childTemplateId?: string;
}> = ({
    mutationProps,
    entityTemplate,
    initialCurrValues,
    handleClose,
    externalErrors,
    setExternalErrors,
    createOrUpdateWithRuleBreachDialogState,
    setCreateOrUpdateWithRuleBreachDialogState,
    childTemplateId,
    showActionButtons = true,
}) => {
    const { payload, actionType } = mutationProps;
    const [isDraftDialogOpen, setIsDraftDialogOpen] = useState(false);
    const [wasDirty, setWasDirty] = useState(false);
    const [initialValuePropsToFilter, setInitialValuePropsToFilter] = useState<Record<string, any>>({});

    const isEditMode = actionType === ActionTypes.UpdateEntity;

    const workspace = useWorkspaceStore((state) => state.workspace);
    const { shouldNavigateToEntityPage } = workspace.metadata;

    const { templateFileKeys: initialTemplateFileKeys } = getEntityTemplateFilesFieldsInfo(entityTemplate);
    const initialValues = useMemo(() => {
        if (isEditMode) return convertIEntityToEntityWizardValues(payload!, entityTemplate, initialTemplateFileKeys);
        if (initialCurrValues) return initialCurrValues;

        return {
            properties: {
                disabled: false,
            },
            attachmentsProperties: {},
            template: entityTemplate,
        };
    }, [payload, entityTemplate, initialTemplateFileKeys]);

    const clientSideUserEntity: IEntity = useClientSideUserStore((state) => state.clientSideUserEntity);

    const finalMutationProps = useMemo(() => {
        if (Object.keys(clientSideUserEntity).length > 0) {
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
        childTemplateId,
        clientSideUserEntity,
    );

    const [deleteDraft, currentDraft, originalDrafts, createOrUpdateDraftDebounced, draftId] = useDraftEntityDialogHook(
        entityTemplate,
        setInitialValuePropsToFilter,
        signaturePrefix,
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
                const nonAttachmentsSchema = filterFieldsFromPropertiesSchema(values.template.properties);
                const propertiesErrors = ajvValidate(nonAttachmentsSchema, values.properties);

                if (Object.keys(propertiesErrors).length === 0) {
                    return {};
                }

                return { properties: propertiesErrors };
            }}
        >
            {({ setFieldValue, values, errors, touched, setFieldTouched, setValues, dirty, initialValues: formInitialValues }) => {
                useEffect(() => {
                    if (initialCurrValues) setValues(initialCurrValues);
                }, [initialCurrValues]);

                return (
                    <>
                        <Form>
                            <Card>
                                <CardContent>
                                    <Grid container justifyContent="center">
                                        <EditProps
                                            setFieldValue={setFieldValue}
                                            values={values}
                                            errors={errors}
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
                                        />

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
                                                        createdAt: payload?.properties.createdAt || new Date(),
                                                        updatedAt: payload?.properties.updatedAt || new Date(),
                                                        ...values.properties,
                                                    }}
                                                    documentTemplateIds={entityTemplate.documentTemplatesIds || values.template.documentTemplatesIds}
                                                    templateId={values.template._id}
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
                                                        startIcon={isLoading ? <CircularProgress sx={{ color: 'white' }} size={20} /> : <DoneIcon />}
                                                        onClick={() =>
                                                            Object.keys(errors).length > 0
                                                                ? ''
                                                                : setTimeout(() => (externalErrors ? undefined : handleClose()), 5000)
                                                        }
                                                        disabled={!dirty || isLoading}
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
