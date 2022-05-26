import React from 'react';
import { MuiForm5 as JSONSchemaForm } from '@rjsf/material-ui';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';

export const EntityPropertiesInput: React.FC<{
    setFieldValue: (field: string, value: File | null) => void;
    values: any;
    schema: IMongoEntityTemplatePopulated['properties'];
}> = ({ schema, setFieldValue, values }) => {
    return (
        <JSONSchemaForm schema={schema} onChange={({ formData }) => setFieldValue('properties', formData)} formData={values.properties} tagName="div">
            <div /> {/* remove the built in submit button */}
        </JSONSchemaForm>
    );
};
