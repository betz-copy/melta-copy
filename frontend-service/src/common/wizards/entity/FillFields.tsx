import React from 'react';
import { FormikProps } from 'formik';
import Form from '@rjsf/core';

import * as Yup from 'yup';

import { EntityWizardValues } from './index';

const fillFieldsSchema = {
    properties: Yup.object().required('חובה'),
};

const FillFields: React.FC<FormikProps<EntityWizardValues>> = ({ values, setFieldValue }) => {
    return (
        <Form
            tagName="div"
            schema={values.template.properties}
            onChange={({ formData }) => setFieldValue('properties', formData)}
            formData={values.properties}
        >
            <div />
        </Form>
    );
};

export { FillFields, fillFieldsSchema };
