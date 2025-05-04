/* eslint-disable import/no-extraneous-dependencies */
import React, { useEffect } from 'react';
import { Form as JSONSchemaForm } from '@rjsf/mui';
import Ajv, { ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import i18next from 'i18next';
import { FormikErrors, FormikHelpers, FormikTouched } from 'formik';
import mapValues from 'lodash.mapvalues';
import pickBy from 'lodash.pickby';
import validator from '@rjsf/validator-ajv8';
import { ErrorSchema, UiSchema } from '@rjsf/utils';
import { cloneDeep } from 'lodash';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { RjfsDateWidget, RjfsDateTimeWidget } from './RjfsDatesWidgets';
import RjfsSelectWidget from './RjfsSelectWidget';
import RjsfTextWidget from './RjsfStringWidget';
import RjfsTextAreaWidget from './RjfsTextAreaWidget';
import './form.css';
import RjfsTemplateReferenceWidget from './RjfsTemplateReferenceWidget';
import RjsfLocationWidget, { validateLocation } from './RjsfLocationWidget';
import RjfsUserWidget from './RjfsUserWidget';
import RjfsUserArrayWidget from './RjfsUserArrayWidget';
import { IKartoffelUser } from '../../../interfaces/users';
import RjfsSignatureWidget from './RjfsSignatureWidgets';

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

export const ajvValidate = (schema: IMongoEntityTemplatePopulated['properties'], data: any): FormikErrors<any> => {
    const ajv = new Ajv({ allErrors: true });
    ajv.addFormat('fileId', /.*/);
    ajv.addFormat('signature', /.*/);
    ajv.addFormat('kartoffelUserField', /.*/);
    ajv.addFormat('user', {
        type: 'string',
        validate: (user) => {
            const userObj = JSON.parse(user);
            return userObj._id && userObj.fullName && userObj.jobTitle && userObj.hierarchy && userObj.mail;
        },
    });
    ajv.addKeyword({ keyword: 'user', type: 'string' });
    ajv.addFormat('text-area', /.*/);
    ajv.addFormat('location', (value: string) => validateLocation(JSON.parse(value), true) === false);
    addFormats(ajv);
    ajv.addVocabulary(['patternCustomErrorMessage', 'hide']);
    ajv.addKeyword({
        keyword: 'dateNotification',
    });
    ajv.addKeyword({ keyword: 'isDailyAlert' });
    ajv.addKeyword({ keyword: 'isDatePastAlert' });
    ajv.addKeyword({ keyword: 'calculateTime' });
    ajv.addKeyword({ keyword: 'archive', type: 'boolean' });
    ajv.addKeyword({
        keyword: 'serialStarter',
    });
    ajv.addKeyword({
        keyword: 'relationshipReference',
        type: 'string',
    });
    ajv.addKeyword({
        keyword: 'expandedUserField',
        type: 'string',
    });
    ajv.addKeyword({
        keyword: 'serialCurrent',
    });

    ajv.addKeyword('identifier', {
        modifying: true,
        // eslint-disable-next-line @typescript-eslint/no-shadow
        validate: (_schema, data) => data !== undefined,
        errors: false,
        keyword: '',
    });

    const schemaToValidate = {
        ...schema,
        properties: pickBy(schema.properties, (value) => value.format !== 'relationshipReference' && value.format !== 'location'),
    };

    const validateFunction = ajv.compile(schemaToValidate);
    validateFunction(data);

    const ajvErrors = validateFunction.errors ?? [];
    return ajvErrorsToFormikErrors(schema, ajvErrors);
};

const formikErrorsToRjsfExtraErrors = (formikErrors: Record<string, string>): ErrorSchema<{}> => {
    // assuming no complex fields (nested/array). need recursion for nested fields

    return mapValues(formikErrors, (errorMessage) => ({ __errors: [errorMessage] }));
};

const mergeErrorSchemas = (errors1: ErrorSchema<{}>, errors2: ErrorSchema<{}>) => {
    const merged = { ...errors1 };
    // eslint-disable-next-line no-restricted-syntax
    for (const key in errors2) {
        // eslint-disable-next-line no-prototype-builtins
        if (errors2.hasOwnProperty(key)) {
            if (!merged[key]) merged[key] = errors2[key];
            // eslint-disable-next-line no-underscore-dangle
            else merged[key].__errors = [...new Set([...merged[key].__errors, ...errors2[key].__errors])];
        }
    }
    return merged;
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
}) => {
    useEffect(() => {
        // define 100% width to text-area field
        const containerDiv = document.querySelectorAll(
            '#json-schema > .form-group.field.field-object > .MuiFormControl-root > .MuiGrid-root > .MuiGrid-root',
        );
        containerDiv.forEach((innerDiv) => {
            const biggerFieldCss = innerDiv.querySelector('.text-area') || innerDiv.querySelector('.signature');
            innerDiv.classList.add(biggerFieldCss ? 'has-bigger-field-child' : 'has-field-child');
        });
    }, [values.template]);

    const rjsfExtraErrors = formikErrorsToRjsfExtraErrors(errors as Record<string, string>);
    const ajvExtraErrorsOnlyTouched: ErrorSchema<{}> = pickBy(rjsfExtraErrors, (_value, key) => touched[key]);
    const rjsfExtraUniqueErrors = formikErrorsToRjsfExtraErrors(uniqueErrors as Record<string, string>);

    const notTouchedUnique: ErrorSchema<{}> = pickBy(rjsfExtraUniqueErrors, (_value, key) => !touched[key]);
    const mergedErrors: ErrorSchema<{}> = mergeErrorSchemas(ajvExtraErrorsOnlyTouched, notTouchedUnique);

    return (
        <JSONSchemaForm
            id="json-schema"
            schema={schema}
            uiSchema={mapValues(schema.properties, (propertySchema, propertyKey): UiSchema => {
                if (propertySchema.archive) return {};
                if (propertySchema.format === 'signature')
                    return {
                        'ui:widget': 'SignatureWidget',
                    };
                if (propertySchema.readOnly)
                    return {
                        'ui:options': {
                            disabled: true,
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
                        'ui:classNames': 'text-area',
                        'ui:options': { toPrint },
                    };
                if (propertySchema.format === 'relationshipReference')
                    return {
                        'ui:widget': 'TemplateReferenceWidget',
                    };
                if (propertySchema.format === 'location')
                    return {
                        'ui:widget': 'LocationWidget',
                    };
                return {};
            })}
            onChange={({ formData }) => {
                Object.entries(formData).forEach(([key, value]) => {
                    if (JSON.stringify(value) === JSON.stringify([undefined]) || JSON.stringify(value) === JSON.stringify([null])) {
                        // eslint-disable-next-line no-param-reassign
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
            widgets={{
                SelectWidget: RjfsSelectWidget,
                DateWidget: RjfsDateWidget,
                DateTimeWidget: RjfsDateTimeWidget,
                TextWidget: RjsfTextWidget,
                EmailWidget: RjsfTextWidget,
                TextAreaWidget: RjfsTextAreaWidget,
                TemplateReferenceWidget: RjfsTemplateReferenceWidget,
                LocationWidget: RjsfLocationWidget,
                UserWidget: RjfsUserWidget,
                UserArrayWidget: RjfsUserArrayWidget,
                SignatureWidget: RjfsSignatureWidget,
            }}
        >
            <div /> {/* remove the built in submit button */}
        </JSONSchemaForm>
    );
};
