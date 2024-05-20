/* eslint-disable import/no-extraneous-dependencies */
import React from 'react';
import { Form as JSONSchemaForm } from '@rjsf/mui';
import Ajv, { ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import i18next from 'i18next';
import { FormikErrors, FormikHelpers, FormikTouched } from 'formik';
import mapValues from 'lodash.mapvalues';
import pickBy from 'lodash.pickby';
import validator from '@rjsf/validator-ajv8';
import { ErrorSchema, UiSchema } from '@rjsf/utils';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { RjfsDateWidget, RjfsDateTimeWidget } from './RjfsDatesWidgets';
import RjfsSelectWidget from './RjfsSelectWidget';
import RjsfTextWidget from './RjsfStringWidget';
import './form.css';

const ajvErrorsToFormikErrors = (schema: IMongoEntityTemplatePopulated['properties'], ajvErrors: ErrorObject[]): FormikErrors<any> => {
    const formikErrorsEntries = ajvErrors.map((ajvError) => {
        if (ajvError.keyword === 'required') {
            return [ajvError.params.missingProperty, i18next.t('validation.required')];
        }

        const field = ajvError.instancePath.slice(1); // for example: /field1/subfield2
        const schemaOfField = schema.properties[field];

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
    addFormats(ajv);
    ajv.addVocabulary(['patternCustomErrorMessage', 'hide']);
    ajv.addKeyword({
        keyword: 'dateNotification',
        type: 'string',
    });
    ajv.addKeyword({ keyword: 'calculateTime' });
    ajv.addKeyword({
        keyword: 'serialStarter',
    });
    ajv.addKeyword({
        keyword: 'serialCurrent',
    });

    const validateFunction = ajv.compile(schema);
    validateFunction(data);

    const ajvErrors = validateFunction.errors ?? [];
    return ajvErrorsToFormikErrors(schema, ajvErrors);
};

const formikErrorsToRjsfExtraErrors = (formikErrors: Record<string, string>): ErrorSchema<{}> => {
    // assuming no complex fields (nested/array). need recursion for nested fields

    return mapValues(formikErrors, (errorMessage) => ({ __errors: [errorMessage] }));
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
    isDialog?: boolean;
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
    isDialog = false,
}) => {
    const newErrors: FormikErrors<any> = Object.entries(errors).reduce((acc, [key, message]) => {
        if (typeof message === 'string' && message.includes('must match format "email"')) {
            acc[key] = i18next.t('validation.mailIsntValid');
        } else {
            acc[key] = message;
        }
        return acc;
    }, {} as FormikErrors<any>);

    const rjsfExtraErrors = formikErrorsToRjsfExtraErrors(newErrors as Record<string, string>);
    const ajvExtraErrorsOnlyTouched: ErrorSchema<{}> = pickBy(rjsfExtraErrors, (_value, key) => touched[key]);
    const rjsfExtraUniqueErrors = formikErrorsToRjsfExtraErrors(uniqueErrors as Record<string, string>);
    const ajvExtraUniqueErrorsOnlyTouched: ErrorSchema<{}> = pickBy(rjsfExtraUniqueErrors, (_value, key) => touched[key]);
    let mergedErrors: ErrorSchema<{}>;

    if (isDialog) {
        const notTouchedUnique: ErrorSchema<{}> = pickBy(rjsfExtraUniqueErrors, (_value, key) => !touched[key]);
        mergedErrors = {
            ...ajvExtraErrorsOnlyTouched,
            ...Object.keys(notTouchedUnique).reduce((acc, key) => {
                acc[key] = notTouchedUnique[key];
                return acc;
            }, {} as ErrorSchema<{}>),
        };
    } else {
        mergedErrors = {
            ...ajvExtraErrorsOnlyTouched,
            ...ajvExtraUniqueErrorsOnlyTouched,
        };
    }

    return (
        <JSONSchemaForm
            id="json-schema"
            schema={schema}
            uiSchema={mapValues(schema.properties, (propertySchema): UiSchema => {
                if (propertySchema.serialCurrent !== undefined) {
                    return {
                        'ui:options': {
                            inputType: 'text',
                            disabled: true,
                            hardCodedValue: isEditMode ? undefined : i18next.t('wizard.entity.serialNumberAutoGenerated'),
                        },
                    };
                }
                if (propertySchema.type === 'array' && propertySchema.items!.enum) {
                    return {
                        'ui:widget': 'SelectWidget',
                        'ui:options': { enumOptions: propertySchema.items!.enum.map((option) => ({ label: option, value: option })) },
                    };
                }
                return {};
            })}
            onChange={({ formData }) => {
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
            noValidate
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
            }}
        >
            <div />
        </JSONSchemaForm>
    );
};
