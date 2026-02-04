import { Box } from '@mui/material';
import i18next from 'i18next';
import { renderHTML } from '../../../../utils/HtmlTagsStringValue';
import { pickProcessFieldsPropertiesSchema } from '../../../../utils/pickFieldsPropertiesSchema';
import { JSONSchemaFormik } from '../../../inputs/JSONSchemaFormik';
import BlueTitle from '../../../MeltaDesigns/BlueTitle';
import { TextAreaProperty } from '../ProcessSteps/processStep';

export const SchemaForm = ({ viewMode, values, errors, touched, setFieldValue, setFieldTouched, toPrint }) => {
    const schema = pickProcessFieldsPropertiesSchema(values.template.details);
    const textAreaValues = Object.entries(schema.properties)
        .filter(([_key, property]) => property.format === 'text-area')
        .map(([key, property]) => ({
            key,
            title: property.title,
            value: values.details[key] ? renderHTML(values.details[key]) : undefined,
        }));

    return (
        <Box paddingTop={0.5} paddingLeft={1} width="100%" className="process-instance-view">
            {!viewMode && (
                <BlueTitle
                    title={i18next.t('wizard.entityTemplate.properties')}
                    style={{ marginTop: toPrint ? '30px' : undefined, fontSize: '16px' }}
                    component="h6"
                    variant="h6"
                />
            )}
            <JSONSchemaFormik
                schema={schema}
                values={{ ...values, properties: values.details }}
                setValues={(propertiesValues) => setFieldValue('details', propertiesValues)}
                errors={errors.details ?? {}}
                touched={touched.details ?? {}}
                setFieldTouched={(field) => setFieldTouched(`details.${field}`)}
                readonly={viewMode}
                viewMode={viewMode ? 'clean' : undefined}
                toPrint={toPrint}
            />
            {toPrint && textAreaValues.length > 0 && textAreaValues.map((textArea) => <TextAreaProperty key={textArea.key} textArea={textArea} />)}
        </Box>
    );
};
