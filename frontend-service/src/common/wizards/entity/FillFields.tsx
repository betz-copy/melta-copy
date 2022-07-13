import React from 'react';
import { EntityWizardValues } from './index';
import { StepComponentProps, StepsType } from '../index';
import { JSONSchemaFormik, ajvValidate } from '../../inputs/JSONSchemaFormik';
import { filterAttachmentsPropertiesFromSchema } from '../../../utils/filterAttachmentsFromSchema';

const fillFieldsValidate: StepsType<EntityWizardValues>[number]['validate'] = (values) => {
    const schema = filterAttachmentsPropertiesFromSchema(values.template.properties);
    const propertiesErrors = ajvValidate(schema, values.properties);
    if (Object.keys(propertiesErrors).length === 0) {
        return {};
    }
    return { properties: propertiesErrors };
};

const FillFields: React.FC<StepComponentProps<EntityWizardValues>> = ({ values, setFieldValue, touched, setFieldTouched, errors }) => {
    return (
        <JSONSchemaFormik
            schema={filterAttachmentsPropertiesFromSchema(values.template.properties)}
            values={values}
            setValues={(propertiesValues) => setFieldValue('properties', propertiesValues)}
            errors={errors.properties ?? {}}
            touched={touched.properties ?? {}}
            setFieldTouched={(field) => setFieldTouched(`properties.${field}`)}
        />
    );
};

export { FillFields, fillFieldsValidate };
