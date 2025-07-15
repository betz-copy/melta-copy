/* eslint-disable import/no-extraneous-dependencies */
import { Form as JSONSchemaForm } from '@rjsf/mui';
import { ErrorSchema, UiSchema, WidgetProps } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import Ajv, { ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import { FormikErrors, FormikHelpers, FormikTouched } from 'formik';
import i18next from 'i18next';
import { cloneDeep } from 'lodash';
import mapValues from 'lodash.mapvalues';
import pickBy from 'lodash.pickby';
import React, { memo, useEffect, useState } from 'react';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { IKartoffelUser } from '../../../interfaces/users';
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

export const ajvValidate = (schema: IMongoEntityTemplatePopulated['properties'], data: Record<string, any>): FormikErrors<any> => {
    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);

    ajv.addFormat('fileId', /.*/);
    ajv.addFormat('signature', /.*/);
    ajv.addFormat('kartoffelUserField', /.*/);
    ajv.addFormat('unitField', /.*/);
    ajv.addFormat('user', {
        type: 'string',
        validate: (user) => {
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
        'isFilterByUserUnit'
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
    console.log({ childTemplateFilterErrors });

    return { ...formikErrors, ...childTemplateFilterErrors };
};

const formikErrorsToRjsfExtraErrors = (formikErrors: Record<string, string>): ErrorSchema<{}> => {
    // assuming no complex fields (nested/array). need recursion for nested fields

    return mapValues(formikErrors, (errorMessage) => ({ __errors: [errorMessage] }));
};

const mergeErrorSchemas = (errors1: ErrorSchema<{}>, errors2: ErrorSchema<{}>) => {
    const merged = { ...errors1 };
    for (const key in errors2) {
        if (errors2.hasOwnProperty(key)) {
            if (!merged[key]) merged[key] = errors2[key];
            else merged[key].__errors = [...new Set([...merged[key].__errors, ...errors2[key].__errors])];
        }
    }
    return merged;
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
    values: any;
    setValues: FormikHelpers<any>['setValues'];
    errors: FormikErrors<any>;
    uniqueErrors?: FormikErrors<any>;
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

    const rjsfExtraErrors = formikErrorsToRjsfExtraErrors(errors as Record<string, string>);
    const ajvExtraErrorsOnlyTouched: ErrorSchema<{}> = pickBy(rjsfExtraErrors, (_value, key) => touched[key]);
    const rjsfExtraUniqueErrors = formikErrorsToRjsfExtraErrors(uniqueErrors as Record<string, string>);

    const notTouchedUnique: ErrorSchema<{}> = pickBy(rjsfExtraUniqueErrors, (_value, key) => !touched[key]);
    const mergedErrors: ErrorSchema<{}> = mergeErrorSchemas(ajvExtraErrorsOnlyTouched, notTouchedUnique);

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

    return (
        <JSONSchemaForm
            id="json-schema"
            schema={schema}
            uiSchema={mapValues(schema.properties, (propertySchema, propertyKey): UiSchema => {
                const defaultValue = values.template?.properties?.properties?.[propertyKey].defaultValue ?? undefined;
                if (propertySchema.archive) return {};
                if (propertySchema.format === 'comment')
                    return {
                        'ui:options': {
                            hide: schema.hide.includes(propertyKey),
                        },
                        'ui:classNames': 'fullWidth',
                        'ui:widget': 'CommentWidget',
                    };
                if (propertySchema.format === 'signature')
                    return {
                        'ui:widget': 'SignatureWidget',
                        'ui:classNames': 'fullWidth',
                    };
                if (propertySchema.readOnly)
                    return {
                        'ui:options': {
                            disabled: true,
                            defaultValue,
                        },
                    };
                if (propertySchema.serialCurrent !== undefined)
                    return {
                        'ui:options': {
                            inputType: 'text',
                            disabled: true,
                            hardCodedValue: isEditMode ? undefined : i18next.t('wizard.entity.serialNumberAutoGenerated'),
                        },
                    };

                if (propertySchema.items?.enum || propertySchema?.enum) {
                    return {
                        'ui:widget': 'SelectWidget',
                        'ui:options': {
                            defaultValue,
                            enumOptions: (propertySchema.items?.enum || propertySchema?.enum)!.map((option) => ({
                                label: option,
                                value: option,
                                color: values.template?.enumPropertiesColors?.[propertyKey]?.[option],
                            })),
                        },
                    };
                }

                if (propertySchema.type === 'array' && propertySchema.items?.format === 'user') {
                    return {
                        'ui:widget': 'UserArrayWidget',
                        'ui:options': {
                            defaultValue,
                        },
                    };
                }
                if (propertySchema.format === 'user') {
                    return {
                        'ui:widget': 'UserWidget',
                        'ui:options': {
                            globalValues: values,
                            updateExpandedUserFields: (user: IKartoffelUser | null, curValues: any) => {
                                const userFieldsToUpdate = Object.keys(schema.properties).filter(
                                    (key) => schema.properties[key].expandedUserField?.relatedUserField === propertyKey,
                                );

                                const clonedValues = cloneDeep(curValues);

                                const propertiesToUpdate = clonedValues.properties;

                                userFieldsToUpdate.forEach((key) => {
                                    const kartoffelField = schema.properties[key].expandedUserField?.kartoffelField;
                                    propertiesToUpdate[key] = user && kartoffelField ? user[kartoffelField] : undefined;
                                });

                                propertiesToUpdate[propertyKey] = user
                                    ? JSON.stringify({
                                          _id: user?._id || user?.id,
                                          fullName: user?.fullName,
                                          jobTitle: user?.jobTitle,
                                          hierarchy: user?.hierarchy,
                                          mail: user?.mail,
                                      })
                                    : undefined;

                                setValues({
                                    ...propertiesToUpdate,
                                });
                            },
                        },
                    };
                }
                if (propertySchema.format === 'text-area')
                    return {
                        'ui:widget': 'TextAreaWidget',
                        'ui:classNames': 'fullWidth',
                        'ui:options': { toPrint, defaultValue },
                    };
                if (propertySchema.format === 'relationshipReference')
                    return {
                        'ui:widget': 'TemplateReferenceWidget',
                    };
                if (propertySchema.format === 'location')
                    return {
                        'ui:widget': 'LocationWidget',
                    };
                return {
                    'ui:options': { defaultValue },
                };
            })}
            onChange={({ formData }) => {
                Object.entries(formData).forEach(([key, value]) => {
                    if (JSON.stringify(value) === JSON.stringify([undefined]) || JSON.stringify(value) === JSON.stringify([null])) {
                        formData[key] = undefined;
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
