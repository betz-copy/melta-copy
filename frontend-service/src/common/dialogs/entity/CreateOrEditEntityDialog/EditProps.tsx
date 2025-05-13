import { Box, Divider, Grid, IconButton, Typography } from '@mui/material';
import { isEqual } from 'date-fns';
import i18next from 'i18next';
import React, { useEffect, useMemo, useState } from 'react';
import { Close as CloseIcon } from '@mui/icons-material';
import { filterFieldsFromPropertiesSchema } from '../../../../utils/pickFieldsPropertiesSchema';
import { BlueTitle } from '../../../BlueTitle';
import { InstanceFileInput } from '../../../inputs/InstanceFilesInput/InstanceFileInput';
import { InstanceSingleFileInput } from '../../../inputs/InstanceFilesInput/InstanceSingleFileInput';
import { JSONSchemaFormik } from '../../../inputs/JSONSchemaFormik';
import { ChooseTemplate } from '../ChooseTemplate';
import { getEntityTemplateFilesFieldsInfo } from '.';

const EditProps: React.FC<{
    setFieldValue;
    values;
    errors;
    touched;
    setFieldTouched;
    setValues;
    // dirty;
    initialValues;
    // submitForm;
    // getEntityTemplateFilesFieldsInfo;
    setInitialValuePropsToFilter;
    initialValuePropsToFilter;
    isMultipleSelection: boolean;
    initialCurrValues?;
    entityTemplate;
    createOrUpdateDraftDebounced?;
    draftId;
    wasDirty;
    setWasDirty;
    externalErrors;
    setExternalErrors;
    isEditMode;
    currentDraft;
    showActionButtons;
    setIsDraftDialogOpen;
    handleClose;
}> = ({
    setFieldValue,
    values,
    errors,
    touched,
    setFieldTouched,
    setValues,
    // dirty,
    initialValues: formInitialValues,
    // submitForm,
    // getEntityTemplateFilesFieldsInfo,
    setInitialValuePropsToFilter,
    initialValuePropsToFilter,
    isMultipleSelection,
    initialCurrValues,
    entityTemplate,
    createOrUpdateDraftDebounced,
    draftId,
    wasDirty,
    setWasDirty,
    externalErrors,
    setExternalErrors,
    isEditMode,
    currentDraft,
    showActionButtons,
    setIsDraftDialogOpen,
    handleClose,
}) => {
    const { templateFilesProperties, templateFileKeys, requiredFilesNames } = getEntityTemplateFilesFieldsInfo(values.template || entityTemplate);
    const isPropertiesFirst = (values.template?.propertiesTypeOrder ?? [])[0] === 'properties';
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [selectedFields, setSelectedFields] = useState<Record<string, boolean> | undefined>(isMultipleSelection ? {} : undefined);
    const schema = filterFieldsFromPropertiesSchema(values.template.properties, selectedFields);

    console.log({ formInitialValues });

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
            // TODO for now
            // eslint-disable-next-line no-param-reassign
            return initialValuePropsToFilter[key] === undefined || isSignatureField ? delete initialValuePropsToFilter[key] : {};
        });

        return !isEqual(valuePropsToFilter, initialValuePropsToFilter);
    }, [formInitialValues, values]);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
        if (!absoluteDirty) return;
        createOrUpdateDraftDebounced?.(values, draftId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [absoluteDirty, values, draftId]);

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
        if (absoluteDirty && !wasDirty) setWasDirty(true);
    }, [absoluteDirty]);

    if (isMultipleSelection) {
        const uniqueFields: string[] = [];
        values.template.uniqueConstraints.forEach((groupField) => uniqueFields.push(...groupField.properties));
        uniqueFields.forEach((uniqueField) => {
            schema.properties[uniqueField].readOnly = true;
        });
    }

    const onCheckboxChange = isMultipleSelection
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
            multipleEntities={isMultipleSelection}
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
        <Grid item container xs={12}>
            <Grid container flexDirection="column">
                <Box width="100%">
                    <Grid item container flexDirection="row" flexWrap="nowrap" justifyContent="space-between">
                        <Grid item>
                            <BlueTitle
                                title={`${isEditMode ? i18next.t('actions.editment') : i18next.t('actions.createment')} ${
                                    values.template?.displayName || i18next.t('wizard.entity.createNewEntity')
                                }`}
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
                            <ChooseTemplate setFieldValue={setFieldValue} values={values} errors={errors} touched={touched} />
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
    );
};

export default EditProps;
