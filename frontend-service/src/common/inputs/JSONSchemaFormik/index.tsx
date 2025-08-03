/* eslint-disable import/no-extraneous-dependencies */
import { useTheme } from '@mui/material';
import { Form as JSONSchemaForm } from '@rjsf/mui';
import { ErrorSchema, RJSFSchema, WidgetProps } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import Ajv, { ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import { FormikErrors, FormikHelpers, FormikTouched } from 'formik';
import i18next from 'i18next';
import pickBy from 'lodash.pickby';
import React, { memo, useEffect, useState } from 'react';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { matchValueAgainstFilter } from '../../../utils/filters';
import './form.css';
import InputAccordion from './InputAccordion';
import RjsfCheckboxWidget from './RjsfCheckboxWidget';
import RjsfCommentWidget from './RjsfCommentWidget';
import { RjsfDateTimeWidget, RjsfDateWidget } from './RjsfDatesWidgets';
import RjsfLocationWidget, { validateLocation } from './RjsfLocationWidget';
import RjsfSelectWidget from './RjsfSelectWidget';
import RjsfSignatureWidgets from './RjsfSignatureWidgets';
import RjsfTextWidget from './RjsfStringWidget';
import RjsfTemplateReferenceWidget from './RjsfTemplateReferenceWidget';
import RjsfTextAreaWidget from './RjsfTextAreaWidget';
import RjsfUserArrayWidget from './RjsfUserArrayWidget';
import RjsfUserWidget from './RjsfUserWidget';
import { ByCurrentDefaultValue, IMongoChildTemplatePopulated } from '../../../interfaces/childTemplates';
import { environment } from '../../../globals';
import { EntityWizardValues } from '../../dialogs/entity';
import { uiSchemaUtils } from './ utils';

const { dateRegex } = environment;

export type LeafError = { _errors?: string[] };

export type ErrorMessage<T extends string | LeafError> = {
    [key: string]: T | ErrorMessage<T>;
};

const ajvErrorsToFormikErrors = (schema: IMongoEntityTemplatePopulated['properties'], ajvErrors: ErrorObject[]): FormikErrors<any> => {
    const formikErrorsEntries = ajvErrors.map((ajvError) => {
        if (ajvError.keyword === 'required') {
            return [ajvError.params.missingProperty, i18next.t('validation.required')];
        }

        const field = ajvError.instancePath.slice(1); // for example: /field1/subfield2
        const schemaOfField = schema.properties[field];
        if (ajvError.keyword === 'format') {
            return [field, `${i18next.t('validation.mustBeEqualToFormat')}  ${i18next.t(`propertyTypes.${ajvError.params.format}`)}`];
        }

        if (ajvError.keyword === 'pattern') {
            return [field, schemaOfField.patternCustomErrorMessage!];
        }

        return [field, ajvError.message];
    });
    return Object.fromEntries(formikErrorsEntries);
};

const convertErrorsToNestedGroups = <T extends ErrorMessage<string> | ErrorSchema<{}>>(
    template: IMongoEntityTemplatePopulated | IMongoChildTemplatePopulated,
    originalErrors: T,
) => {
    const finalErrors = { ...originalErrors };

    template.fieldGroups?.forEach((fieldGroup) => {
        fieldGroup.fields.forEach((field) => {
            if (originalErrors[field]) {
                finalErrors[fieldGroup.name] = { ...(finalErrors[fieldGroup.name] ?? {}), [field]: originalErrors[field] };
            }
        });
    });

    return finalErrors;
};

export const ajvValidate = (schema: IMongoEntityTemplatePopulated['properties'], data: Record<string, any>): FormikErrors<any> => {
    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);

    ajv.addFormat('date', {
        type: 'string',
        validate: (value: string) => value === ByCurrentDefaultValue.byCurrentDate || dateRegex.test(value),
    });
    ajv.addFormat('date-time', {
        type: 'string',
        validate: (value: string) => value === ByCurrentDefaultValue.byCurrentDate || !isNaN(Date.parse(value)),
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
        'isFilterByUserUnit',
        'display',
    ].forEach((keyword) => ajv.addKeyword({ keyword }));

    ajv.addKeyword({
        keyword: 'identifier',
        type: 'string',
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
        if (!matchValueAgainstFilter({ [field]: value }, parsedFilter)) {
            childTemplateFilterErrors[field] = i18next.t('validation.fieldFilterCondition');
        }
    });

    return { ...formikErrors, ...childTemplateFilterErrors };
};

const formikErrorsToRjsfExtraErrorsRec = (
    formikErrors: ErrorMessage<string> | string,
    template: IMongoEntityTemplatePopulated | IMongoChildTemplatePopulated,
): ErrorSchema<{}> => {
    if (typeof formikErrors === 'string') {
        return { __errors: [formikErrors] };
    }

    if (Array.isArray(formikErrors)) {
        return formikErrors.map((err) => formikErrorsToRjsfExtraErrorsRec(err, template));
    }

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
): ErrorSchema<{}> => {
    const nestedErrors = convertErrorsToNestedGroups(template, formikErrors);
    return formikErrorsToRjsfExtraErrorsRec(nestedErrors, template);
};

const mergeErrorSchemas = (
    errors1: ErrorSchema<{}>,
    errors2: ErrorSchema<{}>,
    template: IMongoEntityTemplatePopulated | IMongoChildTemplatePopulated,
) => {
    const merged = { ...errors1 };
    for (const key in errors2) {
        if (errors2.hasOwnProperty(key)) {
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

            if (schema.format === 'comment') {
                return <Component {...props} />;
            }

            if (checked && schema.type === 'boolean' && (value === null || value === undefined)) onChange(Boolean(value));

            useEffect(() => {
                checkboxProps.onCheckboxChange(name, checked);
            }, [checked, name]);

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

    const getWrappedComponent: React.FC<WidgetProps> = (props: WidgetProps) => {
        return <Component {...props} readonly={!props.schema.isEditableByUser && props.readonly} />;
    };

    return getWrappedComponent;
};

interface JSONSchemaFormFormikProps {
    schema: IMongoEntityTemplatePopulated['properties'];
    values: EntityWizardValues;
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
    touched,
    setFieldTouched,
    isEditMode = false,
    toPrint = false,
    checkboxProps,
}) => {
    const theme = useTheme();

    useEffect(() => {
        // define 100% width to text-area field
        const containerDiv = document.querySelectorAll(
            '#json-schema > .form-group.field.field-object > .MuiFormControl-root > .MuiGrid-root > .MuiGrid-root',
        );
        containerDiv.forEach((innerDiv) => {
            const biggerFieldCss = innerDiv.querySelector('.fullWidth') || checkboxProps;
            const classesToAdd: string[] = [];
            classesToAdd.push(biggerFieldCss ? 'full-width-field' : 'half-width-field');
            if (biggerFieldCss) classesToAdd.push('direction-rtl');
            if (checkboxProps) classesToAdd.push('no-padding-top');

            innerDiv.classList.add(...classesToAdd);
        });
    }, [values.template]);

    const rjsfExtraErrors = formikErrorsToRjsfExtraErrors(errors, values.template);
    const ajvExtraErrorsOnlyTouched: ErrorSchema<{}> = pickBy(rjsfExtraErrors, (_value, key) => {
        const fieldGroup = values.template?.fieldGroups?.find((group) => group.fields.includes(key));
        if (fieldGroup) return touched[`${fieldGroup.name}_${key}`];
        return touched[key];
    });
    const rjsfExtraUniqueErrors = formikErrorsToRjsfExtraErrors(uniqueErrors ?? {}, values.template);

    const notTouchedUnique: ErrorSchema<{}> = pickBy(rjsfExtraUniqueErrors, (_value, key) => !touched[key]);
    const mergedErrors: ErrorSchema<{}> = mergeErrorSchemas(ajvExtraErrorsOnlyTouched, notTouchedUnique, values.template);

    const Widgets = React.useMemo(
        () => ({
            CommentWidget: getComponent(RjsfCommentWidget, checkboxProps),
            SelectWidget: getComponent(RjsfSelectWidget, checkboxProps),
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
        }),
        [],
    );

    const schemaWithGroups = values.template.fieldGroups?.reduce((acc, { fields, displayName, name }) => {
        const properties = fields.reduce((acc, field) => {
            const propertyInSchema = schema.properties[field];
            if (!propertyInSchema) return acc;

            propertyInSchema.default = values.properties[field] || propertyInSchema.defaultValue;

            delete schema.properties[field];
            return { ...acc, [field]: propertyInSchema };
        }, {});

        return {
            ...acc,
            [name]: {
                type: 'object',
                title: displayName,
                properties,
            },
        };
    }, {} as RJSFSchema);

    schema.properties = { ...schema.properties, ...(schemaWithGroups ?? {}) };

    return (
        <JSONSchemaForm
            id="json-schema"
            schema={schema}
            uiSchema={uiSchemaUtils(schema, values, setValues, isEditMode, toPrint, theme.palette.primary.main)}
            onChange={({ formData }) => {
                Object.entries(formData).forEach(([key, value]) => {
                    if (JSON.stringify(value) === JSON.stringify([undefined]) || JSON.stringify(value) === JSON.stringify([null])) {
                        formData[key] = undefined;
                    }
                    if (value && typeof value === 'object') {
                        for (const [groupedKey, groupedValue] of Object.entries(value)) {
                            formData[groupedKey] = groupedValue;
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
            extraErrors={mergedErrors}
            tagName="div"
            readonly={readonly}
            widgets={Widgets}
        >
            <div /> {/* remove the built in submit button */}
        </JSONSchemaForm>
    );
};
