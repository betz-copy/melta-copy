import { Box } from '@mui/material';
import React from 'react';
import i18next from 'i18next';
import { pickProcessFieldsPropertiesSchema } from '../../../../utils/pickFieldsPropertiesSchema';
import { BlueTitle } from '../../../BlueTitle';
import { JSONSchemaFormik } from '../../../inputs/JSONSchemaFormik';
import { renderHTML } from '../../../../utils/HtmlTagsStringValue';
import { TextAreaProperty } from '../ProcessSteps/processStep';

export const SchemaForm = ({ viewMode, values, errors, touched, setFieldValue, setFieldTouched, toPrint }) => {
    const schema = pickProcessFieldsPropertiesSchema(values.template.details);
    const textAreaSchema = Object.entries(schema.properties)
        .filter(([_key, property]) => property.format === 'text-area')
        .map(([key, property]) => ({
            key,
            title: property.title,
        }));

    const textAreaValues = textAreaSchema.flatMap((property) => {
        if (values.details[property.key]) {
            const value = renderHTML(values.details[property.key]);
            return [{ ...property, value }];
        }
        return [{ ...property }];
    });

    return (
        <Box paddingTop={0.5} paddingLeft={1}>
            <BlueTitle
                title={i18next.t('wizard.entityTemplate.properties')}
                style={{ marginTop: toPrint ? '30px' : undefined }}
                component="h6"
                variant="h6"
            />
            <JSONSchemaFormik
                schema={schema}
                values={{ ...values, properties: values.details }}
                setValues={(propertiesValues) => setFieldValue('details', propertiesValues)}
                errors={errors.details ?? {}}
                touched={touched.details ?? {}}
                setFieldTouched={(field) => setFieldTouched(`details.${field}`)}
                readonly={viewMode}
                toPrint={toPrint}
            />
            {toPrint && textAreaValues.length > 0 && textAreaValues.map((textArea) => <TextAreaProperty key={textArea.key} textArea={textArea} />)}
        </Box>
    );
};
