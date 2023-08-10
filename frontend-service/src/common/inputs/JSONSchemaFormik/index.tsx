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
import { ErrorSchema } from '@rjsf/utils';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { RjfsDateWidget, RjfsDateTimeWidget } from './RjfsDatesWidgets';
import RjfsSelectWidget from './RjfsSelectWidget';
import RjsfTextWidget from './RjsfStringWidget';

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
    touched: FormikTouched<any>;
    setFieldTouched: FormikHelpers<any>['setFieldTouched'];
    readonly?: boolean;
}

export const JSONSchemaFormik: React.FC<JSONSchemaFormFormikProps> = ({ readonly, schema, values, setValues, errors, touched, setFieldTouched }) => {
    const rjsfExtraErrors = formikErrorsToRjsfExtraErrors(errors as Record<string, string>);
    const ajvExtraErrorsOnlyTouched: ErrorSchema<{}> = pickBy(rjsfExtraErrors, (_value, key) => touched[key]);
    return (
        <JSONSchemaForm
            schema={schema}
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
            noValidate
            validator={validator}
            extraErrors={ajvExtraErrorsOnlyTouched}
            tagName="div"
            readonly={readonly}
            widgets={{
                SelectWidget: RjfsSelectWidget,
                DateWidget: RjfsDateWidget,
                DateTimeWidget: RjfsDateTimeWidget,
                TextWidget: RjsfTextWidget,
            }}
        >
            <div /> {/* remove the built in submit button */}
        </JSONSchemaForm>
    );
};
