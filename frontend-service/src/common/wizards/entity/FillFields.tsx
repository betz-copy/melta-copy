import React from 'react';
import { MuiForm5 as Form } from '@rjsf/material-ui';
import * as Yup from 'yup';
import i18next from 'i18next';
import { EntityWizardValues } from './index';
import { StepComponentProps } from '../index';

const fillFieldsSchema = {
    properties: Yup.object().required(i18next.t('validation.required')),
};

const FillFields: React.FC<StepComponentProps<EntityWizardValues>> = ({ values, setFieldValue }) => {
    return (
        <Form
            tagName="div"
            schema={values.template.properties}
            onChange={({ formData }) => setFieldValue('properties', formData)}
            formData={values.properties}
        >
            <div /> {/* remove the built in submit button */}
        </Form>
    );
};

export { FillFields, fillFieldsSchema };
