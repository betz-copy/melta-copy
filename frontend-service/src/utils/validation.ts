import i18next from 'i18next';
import * as Yup from 'yup';
import { EntityTemplateFormInputProperties } from '../common/wizards/entityTemplate';

export const variableNameValidation = /^[a-zA-Z][a-zA-Z_$0-9]*$/;

type PropertiesType = 'normal' | 'attachment';

export const entityTemplateUniqueProperties = (value, context: Yup.TestContext) => {
    if (!value) return true;
    const { properties, attachmentProperties } = value;

    const errors: Yup.ValidationError[] = [];

    const addDuplicateFieldsError = (fieldType: PropertiesType, duplicateFieldType: PropertiesType, inputType: 'name' | 'title', index: number) => {
        const message = i18next.t(
            `validation.${duplicateFieldType === 'normal' ? 'field' : 'attachmentField'}${inputType === 'name' ? 'Name' : 'Title'}Exists`,
        );
        const path = `${fieldType === 'normal' ? 'properties' : 'attachmentProperties'}[${index}].${inputType}`;

        errors.push(context.createError({ message, path }));
    };

    const testFields = (
        properties1: EntityTemplateFormInputProperties[],
        properties1Type: PropertiesType,
        properties2: EntityTemplateFormInputProperties[],
        properties2Type: PropertiesType,
    ) => {
        properties1.forEach((field1, index1) => {
            properties2.forEach((field2, index2) => {
                if (field1.id === field2.id) return;

                if (field1.name === field2.name) {
                    addDuplicateFieldsError(properties1Type, properties2Type, 'name', index1);
                    addDuplicateFieldsError(properties2Type, properties1Type, 'name', index2);
                }
                if (field1.title === field2.title) {
                    addDuplicateFieldsError(properties1Type, properties2Type, 'title', index1);
                    addDuplicateFieldsError(properties2Type, properties1Type, 'title', index2);
                }
            });
        });
    };

    testFields(properties, 'normal', properties, 'normal');
    testFields(attachmentProperties, 'attachment', attachmentProperties, 'attachment');
    testFields(properties, 'normal', attachmentProperties, 'attachment');

    if (errors.length) {
        return new Yup.ValidationError(errors);
    }

    return true;
};
