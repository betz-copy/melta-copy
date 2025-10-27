import { Close as CloseIcon } from '@mui/icons-material';
import { Box, Divider, Grid, IconButton, Typography } from '@mui/material';
import { FormikComputedProps, FormikHelpers, FormikState } from 'formik';
import i18next from 'i18next';
import { DebouncedFunc, isEqual } from 'lodash';
import React, { Dispatch, SetStateAction, useEffect, useMemo } from 'react';
import { IExternalErrors } from '../../../../interfaces/CreateOrEditEntityDialog';
import { IMongoChildTemplatePopulated } from '../../../../interfaces/childTemplates';
import { IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { filterFieldsFromPropertiesSchema } from '../../../../utils/pickFieldsPropertiesSchema';
import { InstanceFileInput } from '../../../inputs/InstanceFilesInput/InstanceFileInput';
import { InstanceSingleFileInput } from '../../../inputs/InstanceFilesInput/InstanceSingleFileInput';
import { JSONSchemaFormik } from '../../../inputs/JSONSchemaFormik';
import BlueTitle from '../../../MeltaDesigns/BlueTitle';
import { EntityWizardValues } from '..';
import { ChooseTemplate, IChooseTemplateMode } from '../ChooseTemplate';
import { Draft } from '../draftWarningDialog/index';
import { getEntityTemplateFilesFieldsInfo } from '.';

const EditProps: React.FC<{
    values: FormikState<EntityWizardValues>['values'];
    setFieldValue: FormikHelpers<EntityWizardValues>['setFieldValue'];
    initialValues: FormikComputedProps<EntityWizardValues>['initialValues'];
    errors: FormikState<EntityWizardValues>['errors'];
    touched: FormikState<EntityWizardValues>['touched'];
    setFieldTouched: FormikHelpers<EntityWizardValues>['setFieldTouched'];
    setInitialValuePropsToFilter: Dispatch<SetStateAction<Record<string, any>>>;
    initialValuePropsToFilter: Record<string, any>;
    isMultipleSelection: boolean;
    entityTemplate: IMongoEntityTemplatePopulated | IMongoChildTemplatePopulated;
    wasDirty: boolean;
    setWasDirty: Dispatch<React.SetStateAction<boolean>>;
    externalErrors: IExternalErrors;
    setExternalErrors: Dispatch<SetStateAction<IExternalErrors>>;
    isEditMode: boolean;
    showCloseButton: boolean;
    handleClose?: () => void;
    multipleSelectionProps?: {
        selectedFields: Record<string, boolean>;
        setSelectedFields: Dispatch<SetStateAction<Record<string, boolean>>>;
    };
    draftId?: string;
    currentDraft?: Draft;
    createOrUpdateDraftDebounced?: DebouncedFunc<(newValues: EntityWizardValues, newDraftId: string) => void>;
    setIsDraftDialogOpen?: Dispatch<SetStateAction<boolean>>;
    showTitle?: boolean;
    chooseMode?: IChooseTemplateMode;
    parentId?: string;
    getInitialProperties?: (newTemplate: IMongoEntityTemplatePopulated | IMongoChildTemplatePopulated) => Record<string, any>;
}> = ({
    setFieldValue,
    values,
    errors,
    touched,
    setFieldTouched,
    initialValues,
    setInitialValuePropsToFilter,
    initialValuePropsToFilter,
    multipleSelectionProps,
    isMultipleSelection,
    entityTemplate,
    createOrUpdateDraftDebounced,
    draftId,
    wasDirty,
    setWasDirty,
    externalErrors,
    setExternalErrors,
    isEditMode,
    currentDraft,
    showCloseButton,
    setIsDraftDialogOpen,
    handleClose,
    showTitle = true,
    chooseMode = IChooseTemplateMode.TemplatesAndChildren,
    parentId,
    getInitialProperties,
}) => {
    const { templateFilesProperties, templateFileKeys, requiredFilesNames } = getEntityTemplateFilesFieldsInfo(values.template || entityTemplate);
    const isPropertiesFirst = (values.template?.propertiesTypeOrder ?? [])[0] === 'properties';
    const schema = filterFieldsFromPropertiesSchema(values.template?.properties, multipleSelectionProps?.selectedFields);

    useEffect(() => {
        setInitialValuePropsToFilter({ ...initialValues.properties });
    }, []);

    useEffect(() => {
        schema.required.forEach((field) => {
            const fieldPropertiesEnum = schema.properties[field]?.enum;
            const itemFieldProperties = schema.properties[field]?.items?.enum;

            if (fieldPropertiesEnum?.length === 1 && fieldPropertiesEnum[0] !== undefined)
                setFieldValue(`properties.${field}`, fieldPropertiesEnum[0]);

            if (itemFieldProperties?.length === 1 && itemFieldProperties[0] !== undefined)
                setFieldValue(`properties.${field}`, [itemFieldProperties[0]]);
        });
    }, [values.template]);

    const absoluteDirty = useMemo(() => {
        // textarea/long-text causes the field to first be undefined, setting dirty to true,
        // so we check for dirty manually while ignoring these fields
        // (if the value changes it won't be undefined and it will consider it dirty)
        const isSignatureField = (key: string) => values.template?.properties.properties[key]?.format === 'signature';
        const valuePropsToFilter = { ...values.properties };
        Object.keys(valuePropsToFilter).forEach((key) =>
            valuePropsToFilter[key] === undefined || isSignatureField(key) ? delete valuePropsToFilter[key] : {},
        );

        Object.keys(initialValuePropsToFilter).forEach((key) =>
            initialValuePropsToFilter[key] === undefined || isSignatureField(key) ? delete initialValuePropsToFilter[key] : {},
        );

        return !isEqual(valuePropsToFilter, initialValuePropsToFilter);
    }, [initialValues, values]);

    useEffect(() => {
        if (!absoluteDirty || !draftId || !createOrUpdateDraftDebounced) return;
        createOrUpdateDraftDebounced(values, draftId);
    }, [absoluteDirty, values, draftId]);

    useEffect(() => {
        setWasDirty(absoluteDirty);
    }, [absoluteDirty]);

    useEffect(() => {
        if (multipleSelectionProps) setWasDirty(!!Object.keys(values.attachmentsProperties).length);
    }, [values.attachmentsProperties]);

    if (isMultipleSelection) {
        const uniqueFields: string[] = [];
        values.template.uniqueConstraints.forEach((groupField) => uniqueFields.push(...groupField.properties));
        uniqueFields.forEach((uniqueField) => {
            schema.properties[uniqueField].readOnly = true;
        });
    }

    const onCheckboxChange = (field: string, checked: boolean) => {
        if (!checked) {
            setFieldTouched(`properties.${field}`, false);
            setFieldValue(`properties.${field}`, undefined);
        } else if (schema.properties[field].defaultValue) setFieldValue(`properties.${field}`, schema.properties[field].defaultValue);

        const relatedUserFields = {};

        if (schema.properties[field].format === 'user') {
            Object.entries(schema.properties).forEach(([key, value]) => {
                if (value.format === 'kartoffelUserField' && value.expandedUserField?.relatedUserField === field) {
                    relatedUserFields[key] = checked;
                }
            });
        }

        multipleSelectionProps?.setSelectedFields((prev) => ({
            ...prev,
            [field]: checked,
            ...relatedUserFields,
        }));
    };

    const isFieldChecked = (field: string) => Boolean(multipleSelectionProps?.selectedFields[field]);

    const propertiesComp = values.template?._id && (
        <JSONSchemaFormik
            schema={schema}
            values={values}
            setValues={(propertiesValues) => setFieldValue('properties', propertiesValues)}
            errors={errors.properties ?? {}}
            uniqueErrors={{ ...externalErrors.unique }}
            touched={touched.properties ?? {}}
            setFieldTouched={(field, isTouched?) => setFieldTouched(`properties.${field}`, isTouched)}
            isEditMode={isEditMode}
            checkboxProps={isMultipleSelection ? { isFieldChecked, onCheckboxChange } : undefined}
        />
    );

    const propertiesFilesComp = !!templateFileKeys.length && (
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
                <Grid key={key} marginTop={index ? 2 : 0}>
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
        <Grid container width="100%">
            <Grid container flexDirection="column" width="100%">
                <Box width="100%">
                    <Grid container flexDirection="row" flexWrap="nowrap" justifyContent="space-between">
                        {showTitle && (
                            <Grid>
                                <BlueTitle
                                    title={`${i18next.t(`actions.${isEditMode ? 'edit' : 'create'}ment`)} ${
                                        values.template?.displayName || i18next.t('wizard.entity.createNewEntity')
                                    }`}
                                    component="h6"
                                    variant="h6"
                                    style={{ fontWeight: '600', fontSize: '20px', marginTop: '0.25rem' }}
                                />
                            </Grid>
                        )}

                        {currentDraft && (
                            <Grid container size={{ xs: 8 }} justifyContent="right">
                                <Typography color="#53566E" marginTop="0.5rem" fontWeight={100}>
                                    {i18next.t('draftSaveDialog.lastSavedAt', {
                                        date: new Date(currentDraft.lastSavedAt).toLocaleString('he'),
                                    })}
                                </Typography>
                            </Grid>
                        )}

                        {showCloseButton && (
                            <Grid>
                                <IconButton
                                    onClick={() => (wasDirty ? setIsDraftDialogOpen?.(true) : handleClose?.())}
                                    sx={{ color: (theme) => theme.palette.primary.main }}
                                >
                                    <CloseIcon />
                                </IconButton>
                            </Grid>
                        )}
                    </Grid>
                    {!entityTemplate._id && (
                        <Grid marginTop="20px">
                            <ChooseTemplate
                                setFieldValue={setFieldValue}
                                values={values}
                                errors={errors}
                                touched={touched}
                                chooseMode={chooseMode}
                                parentId={parentId}
                                getInitialProperties={getInitialProperties}
                            />
                        </Grid>
                    )}
                </Box>
                <Box>
                    <Grid marginTop="20px" marginBottom="20px" style={{ overflowY: 'auto', maxHeight: '48rem' }}>
                        {isPropertiesFirst ? propertiesComp : propertiesFilesComp}

                        {!!templateFileKeys.length && (
                            <Grid container flexDirection="column">
                                <Grid marginTop="20px" marginBottom="20px" alignSelf="stretch">
                                    <Divider orientation="horizontal" style={{ alignSelf: 'stretch', width: '100%' }} />
                                </Grid>
                            </Grid>
                        )}

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
    );
};

export default EditProps;
