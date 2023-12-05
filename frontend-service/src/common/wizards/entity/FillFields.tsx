import React, { useEffect } from 'react';
import { EntityWizardValues } from './index';
import { StepComponentProps, StepsType } from '../index';
import { JSONSchemaFormik, ajvValidate } from '../../inputs/JSONSchemaFormik';
import { filterAttachmentsAndEntitiesRefFromPropertiesSchema } from '../../../utils/pickFieldsPropertiesSchema';

const fillFieldsValidate: StepsType<EntityWizardValues>[number]['validate'] = (values) => {
    const schema = filterAttachmentsAndEntitiesRefFromPropertiesSchema(values.template.properties);
    const propertiesErrors = ajvValidate(schema, values.properties);

    if (Object.keys(propertiesErrors).length === 0) {
        return {};
    }
    return { properties: propertiesErrors };
};

const FillFields: React.FC<StepComponentProps<EntityWizardValues>> = ({ values, setFieldValue, touched, setFieldTouched, errors }) => {
    const schema = filterAttachmentsAndEntitiesRefFromPropertiesSchema(values.template.properties);
    useEffect(() => {
        Object.entries<object>(schema.properties).forEach(([propertyName, propertyValues]) => {
            if (propertyValues.hasOwnProperty('serialCurrent')) {
                setFieldValue(`properties.${propertyName}`, propertyValues['serialCurrent']);
            }
        });
    }, []);
    return (
        <JSONSchemaFormik
            schema={schema}
            values={values}
            setValues={(propertiesValues) => setFieldValue('properties', propertiesValues)}
            errors={errors.properties ?? {}}
            touched={touched.properties ?? {}}
            setFieldTouched={(field) => setFieldTouched(`properties.${field}`)}
        />
    );
};

export { FillFields, fillFieldsValidate };
