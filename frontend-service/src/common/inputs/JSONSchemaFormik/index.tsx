import { useTheme } from '@mui/material';
import { Form as JSONSchemaForm } from '@rjsf/mui';
import { ErrorSchema, RegistryWidgetsType, RJSFSchema, WidgetProps } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import Ajv, { ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import { FormikErrors, FormikHelpers, FormikTouched } from 'formik';
import i18next from 'i18next';
import { pickBy } from 'lodash';
import React, { memo, useEffect, useState } from 'react';
import { environment } from '../../../globals';
import { ByCurrentDefaultValue, IMongoChildTemplatePopulated } from '../../../interfaces/childTemplates';
import { IEntitySingleProperty, IMongoEntityTemplatePopulated, IWalletTransfer } from '../../../interfaces/entityTemplates';
import { matchValueAgainstFilter } from '../../../utils/filters';
import { uiSchemaUtils } from './ utils';
import './form.css';
import InputAccordion from './InputAccordion';
import RjsfCheckboxWidget from './Widgets/RjsfCheckboxWidget';
import RjsfCommentWidget from './Widgets/RjsfCommentWidget';
import { RjsfDateTimeWidget, RjsfDateWidget } from './Widgets/RjsfDatesWidgets';
import RjsfLocationWidget, { validateLocation } from './Widgets/RjsfLocationWidget';
import RjsfSelectWidget from './Widgets/RjsfSelectWidget';
import RjsfSignatureWidgets from './Widgets/RjsfSignatureWidgets';
import RjsfTextWidget from './Widgets/RjsfStringWidget';
import RjsfTemplateReferenceWidget from './Widgets/RjsfTemplateReferenceWidget';
import RjsfTextAreaWidget from './Widgets/RjsfTextAreaWidget';
import RjsfUnitSelectWidget from './Widgets/RjsfUnitSelectWidget';
import RjsfUserArrayWidget from './Widgets/RjsfUserArrayWidget';
import RjsfUserAvatarWidget from './Widgets/RjsfUserAvarWidget';
import RjsfUserWidget from './Widgets/RjsfUserWidget';

const { dateRegex } = environment;

export type LeafError = { _errors?: string[] };

export type ErrorMessage<T extends string | LeafError> = {
    [key: string]: T | ErrorMessage<T>;
};

const ajvErrorsToFormikErrors = (schema: IMongoEntityTemplatePopulated['properties'], ajvErrors: ErrorObject[]): FormikErrors<any> => {
    const formikErrorsEntries = ajvErrors.map((ajvError) => {
        if (ajvError.keyword === 'required') return [ajvError.params.missingProperty, i18next.t('validation.required')];

        const field = ajvError.instancePath.slice(1); // for example: /field1/subfield2
        const schemaOfField = schema.properties[field];
        if (ajvError.keyword === 'format')
            return [field, `${i18next.t('validation.mustBeEqualToFormat')}  ${i18next.t(`propertyTypes.${ajvError.params.format}`)}`];

        if (ajvError.keyword === 'pattern') return [field, schemaOfField.patternCustomErrorMessage!];

        return [field, ajvError.message];
    });
    return Object.fromEntries(formikErrorsEntries);
};

const convertErrorsToNestedGroups = <T extends ErrorMessage<string> | ErrorSchema<{}>>(
    template: IMongoEntityTemplatePopulated | IMongoChildTemplatePopulated,
    originalErrors: T,
) => {
    const finalErrors = { ...originalErrors };

    template?.fieldGroups?.forEach((fieldGroup) => {
        fieldGroup.fields.forEach((field) => {
            if (originalErrors[field]) finalErrors[fieldGroup.name] = { ...(finalErrors[fieldGroup.name] ?? {}), [field]: originalErrors[field] };
        });
    });

    return finalErrors;
};

export const ajvValidate = (
    schema: IMongoEntityTemplatePopulated['properties'],
    data: Record<string, any>,
    walletTransfer?: IWalletTransfer | null,
): FormikErrors<any> => {
    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);

    ajv.addFormat('date', {
        type: 'string',
        validate: (value: string) => value === ByCurrentDefaultValue.byCurrentDate || dateRegex.test(value),
    });
    ajv.addFormat('date-time', {
        type: 'string',
        validate: (value: string) => value === ByCurrentDefaultValue.byCurrentDate || !Number.isNaN(Date.parse(value)),
    });
    ajv.addFormat('fileId', /.*/);
    ajv.addFormat('signature', /.*/);
    ajv.addFormat('kartoffelUserField', /.*/);
    ajv.addFormat('unitField', /.*/);
    ajv.addFormat('user', {
        type: 'string',
        validate: (user) => {
            if (user === ByCurrentDefaultValue.byCurrentUser) return true;

            try {
                const userObj = JSON.parse(user);
                return userObj._id && userObj.fullName && userObj.jobTitle && userObj.hierarchy && userObj.mail;
            } catch {
                return false;
            }
        },
    });
    ajv.addFormat('text-area', /.*/);
    ajv.addFormat('location', (value: string) => validateLocation(JSON.parse(value), true) === false);
    ajv.addFormat('comment', /.*/);

    ajv.addVocabulary(['patternCustomErrorMessage', 'hide']);

    [
        'dateNotification',
        'isDailyAlert',
        'isEditableByUser',
        'isDatePastAlert',
        'calculateTime',
        'archive',
        'serialStarter',
        'relationshipReference',
        'expandedUserField',
        'serialCurrent',
        'comment',
        'hideFromDetailsPage',
        'color',
        'filters',
        'defaultValue',
        'isFilterByCurrentUser',
        'filterByCurrentUserField',
        'filterByUnitUserField',
        'isFilterByUserUnit',
        'display',
        'accountBalance',
        'isProfileImage',
    ].forEach((keyword) => ajv.addKeyword({ keyword }));

    ajv.addKeyword({
        keyword: 'identifier',
        schema: false,
        validate: (v) => v !== undefined,
        errors: false,
    });

    const formats = ['location', 'relationshipReference'];
    const schemaToValidate = {
        ...schema,
        properties: pickBy(schema.properties, (value) => !formats.includes(value.format ?? '')),
    };

    const validateFunction = ajv.compile(schemaToValidate);
    validateFunction(data);
    const ajvErrors = validateFunction.errors ?? [];
    const formikErrors = ajvErrorsToFormikErrors(schema, ajvErrors);

    const childTemplateFilterErrors: FormikErrors<any> = {};

    Object.entries(schema.properties || {}).forEach(([field, propertySchema]) => {
        const propertyFilter = propertySchema?.filters;
        if (!propertyFilter) return;

        const parsedFilter = typeof propertyFilter === 'string' ? JSON.parse(propertyFilter) : propertyFilter;
        if (typeof parsedFilter !== 'object' || parsedFilter === null) return;

        const value = data[field];
        if (!matchValueAgainstFilter({ [field]: value }, parsedFilter))
            childTemplateFilterErrors[field] = i18next.t('validation.fieldFilterCondition');
    });

    const walletTemplateErrors: FormikErrors<any> = {};
    if (walletTransfer) {
        const { from, to } = walletTransfer;
        const sourceWalletEntityId = data[from]?.properties?._id;
        const destWalletEntityId = data[to]?.properties?._id;

        if (sourceWalletEntityId && sourceWalletEntityId === destWalletEntityId) {
            const error = i18next.t('validation.sameSourceAndDestWallet');
            walletTemplateErrors[from] = error;
            walletTemplateErrors[to] = error;
        }
    }

    return { ...formikErrors, ...childTemplateFilterErrors, ...walletTemplateErrors };
};

const formikErrorsToRjsfExtraErrorsRec = (
    formikErrors: ErrorMessage<string> | string,
    template: IMongoEntityTemplatePopulated | IMongoChildTemplatePopulated,
): ErrorSchema<{}> => {
    if (typeof formikErrors === 'string') return { __errors: [formikErrors] };

    if (Array.isArray(formikErrors)) return formikErrors.map((err) => formikErrorsToRjsfExtraErrorsRec(err, template));

    if (typeof formikErrors === 'object' && formikErrors !== null) {
        const newObj: Record<string, any> = {};
        for (const key in formikErrors) {
            newObj[key] = formikErrorsToRjsfExtraErrorsRec(formikErrors[key], template);
        }
        return newObj;
    }

    return formikErrors;
};

const formikErrorsToRjsfExtraErrors = (
    formikErrors: ErrorMessage<string> | string,
    template: IMongoEntityTemplatePopulated | IMongoChildTemplatePopulated,
): ErrorSchema<object> => {
    const nestedErrors = convertErrorsToNestedGroups(template, formikErrors);
    return formikErrorsToRjsfExtraErrorsRec(nestedErrors, template);
};

const mergeErrorSchemas = (
    errors1: ErrorSchema<object>,
    errors2: ErrorSchema<object>,
    template: IMongoEntityTemplatePopulated | IMongoChildTemplatePopulated,
): ErrorSchema<object> => {
    const merged = { ...errors1 };
    for (const key in errors2) {
        if (Object.hasOwn(errors2, key)) {
            if (!merged[key]) merged[key] = errors2[key];
            else merged[key].__errors = [...new Set([...merged[key].__errors, ...errors2[key].__errors])];
        }
    }

    return convertErrorsToNestedGroups(template, merged);
};

const getComponent = (
    Component: React.ComponentType<WidgetProps>,
    checkboxProps?: {
        isFieldChecked: (fieldName: string) => boolean;
        onCheckboxChange: (fieldName: string, isChecked: boolean) => void;
    },
) => {
    if (checkboxProps) {
        const WrappedComponent: React.FC<WidgetProps> = (props: WidgetProps) => {
            const { label, disabled, name, value, schema, onChange } = props;
            const [checked, setChecked] = useState(checkboxProps.isFieldChecked(name));

            // biome-ignore lint/correctness/useExhaustiveDependencies: important
            useEffect(() => {
                checkboxProps.onCheckboxChange(name, checked);
            }, [checked, name]);

            if (schema.format === 'comment') return <Component {...props} />;

            if (checked && schema.type === 'boolean' && (value === null || value === undefined)) onChange(Boolean(value));

            return (
                <InputAccordion label={label} disabled={disabled} checked={checked} setChecked={setChecked}>
                    <Component {...props} />
                </InputAccordion>
            );
        };

        const MemoWrapped = memo(WrappedComponent);
        const getWrappedComponent: React.FC<WidgetProps> = (props: WidgetProps) => <MemoWrapped {...props} />;

        return getWrappedComponent;
    }

    const getWrappedComponent: React.FC<WidgetProps> = (props: WidgetProps) => (
        <Component {...props} readonly={!props.schema.isEditableByUser && props.readonly} />
    );
    return getWrappedComponent;
};

interface JSONSchemaFormFormikProps {
    schema: IMongoEntityTemplatePopulated['properties'];
    values: any;
    setValues: FormikHelpers<any>['setValues'];
    errors: FormikErrors<{}>;
    uniqueErrors?: FormikErrors<{}>;
    touched: FormikTouched<any>;
    setFieldTouched: FormikHelpers<any>['setFieldTouched'];
    isEditMode?: boolean;
    readonly?: boolean;
    toPrint?: boolean;
    checkboxProps?: {
        isFieldChecked: (fieldName: string) => boolean;
        onCheckboxChange: (fieldName: string, isChecked: boolean) => void;
    };
}

export const JSONSchemaFormik: React.FC<JSONSchemaFormFormikProps> = ({
    readonly,
    schema,
    values,
    setValues,
    errors,
    uniqueErrors,
    setFieldTouched,
    isEditMode = false,
    toPrint = false,
    checkboxProps,
}) => {
    const theme = useTheme();

    // biome-ignore lint/correctness/useExhaustiveDependencies: important
    useEffect(() => {
        const allInnerDivs = document.querySelectorAll('#json-schema .MuiGrid-root > .MuiGrid-root');

        // Make cells not fullWidth in groups
        allInnerDivs.forEach((innerDiv) => {
            if (innerDiv.querySelector('.rjsf-field.rjsf-field-object')) return;

            const biggerFieldCss = innerDiv.querySelector('.fullWidth') || checkboxProps;
            const classesToAdd: string[] = [];

            classesToAdd.push(biggerFieldCss ? 'full-width-field' : 'half-width-field');
            if (biggerFieldCss) classesToAdd.push('direction-rtl');
            if (checkboxProps) classesToAdd.push('no-padding-top');

            innerDiv.classList.add(...classesToAdd);
        });
    }, [values.template]);

    const rjsfExtraErrors = formikErrorsToRjsfExtraErrors(errors ?? {}, values.template);
    const rjsfExtraUniqueErrors = formikErrorsToRjsfExtraErrors(uniqueErrors ?? {}, values.template);

    // biome-ignore lint/correctness/useExhaustiveDependencies: important
    const Widgets: RegistryWidgetsType = React.useMemo(
        () => ({
            CommentWidget: getComponent(RjsfCommentWidget, checkboxProps),
            SelectWidget: getComponent(RjsfSelectWidget, checkboxProps),
            UnitSelectWidget: getComponent(RjsfUnitSelectWidget, checkboxProps),
            DateWidget: getComponent(RjsfDateWidget, checkboxProps),
            DateTimeWidget: getComponent(RjsfDateTimeWidget, checkboxProps),
            TextWidget: getComponent(RjsfTextWidget, checkboxProps),
            EmailWidget: getComponent(RjsfTextWidget, checkboxProps),
            TextAreaWidget: getComponent(RjsfTextAreaWidget, checkboxProps),
            TemplateReferenceWidget: getComponent(RjsfTemplateReferenceWidget, checkboxProps),
            LocationWidget: getComponent(RjsfLocationWidget, checkboxProps),
            UserWidget: getComponent(RjsfUserWidget, checkboxProps),
            UserArrayWidget: getComponent(RjsfUserArrayWidget, checkboxProps),
            CheckboxWidget: getComponent(RjsfCheckboxWidget, checkboxProps),
            SignatureWidget: getComponent(RjsfSignatureWidgets, checkboxProps),
            UserAvatarWidget: getComponent(RjsfUserAvatarWidget, checkboxProps),
        }),
        [],
    );

    const schemaWithGroups = values.template?.fieldGroups?.reduce((acc, { fields, displayName, name }) => {
        const properties = fields.reduce(
            (propsAcc, field) => {
                const propertyInSchema = schema.properties[field];
                if (!propertyInSchema) return propsAcc;

                propertyInSchema.default = values.properties[field] || propertyInSchema.defaultValue;
                delete schema.properties[field];

                propsAcc[field] = propertyInSchema;
                return propsAcc;
            },
            {} as Record<string, any>,
        );

        acc[name] = {
            type: 'object',
            title: displayName,
            properties,
        };
        return acc;
    }, {} as RJSFSchema);

    schema.properties = { ...schema.properties, ...(schemaWithGroups ?? {}) };

    return (
        <JSONSchemaForm
            id="json-schema"
            schema={schema}
            uiSchema={uiSchemaUtils(schema, values, setValues, isEditMode, toPrint, theme.palette.primary.main)}
            onChange={({ formData }) => {
                Object.entries(formData as Record<string, IEntitySingleProperty>).forEach(([key, value]) => {
                    if (JSON.stringify(value) === JSON.stringify([undefined]) || JSON.stringify(value) === JSON.stringify([null]))
                        formData[key] = undefined;

                    // if the value is an object without properties, we assume it's a grouped field and flatten it
                    // rjsf library does support grouped fields, but we do not save them as so in the db.
                    if (
                        value &&
                        typeof value === 'object' &&
                        !value.properties &&
                        schema.properties[key] &&
                        schema.properties[key]?.format !== 'location'
                    ) {
                        for (const [groupedKey, groupedValue] of Object.entries(value)) {
                            if (Array.isArray(groupedValue)) {
                                const isPlaceHolderArray = groupedValue.length === 1 && (groupedValue[0] === undefined || groupedValue[0] === null);

                                if (!groupedValue.length) formData[groupedKey] = [undefined];
                                else if (!isPlaceHolderArray) formData[groupedKey] = groupedValue;
                            } else formData[groupedKey] = groupedValue;
                        }
                    }
                });

                setValues(formData);
            }}
            formData={values.properties}
            showErrorList={false}
            noHtml5Validate
            onBlur={(id) => {
                const [_, field] = id.split('root_');
                setFieldTouched(field);
            }}
            experimental_defaultFormStateBehavior={{
                emptyObjectFields: 'skipEmptyDefaults', // library has for array a default empty array ([]). disable this
            }}
            validator={validator}
            extraErrors={mergeErrorSchemas(rjsfExtraErrors, rjsfExtraUniqueErrors, values.template)}
            tagName="div"
            readonly={readonly}
            widgets={Widgets}
        >
            <div /> {/* remove the built in submit button */}
        </JSONSchemaForm>
    );
};
