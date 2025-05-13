import i18next from 'i18next';
import * as Yup from 'yup';
import { EntityTemplateFormInputProperties } from '../common/wizards/entityTemplate';
import { ProcessTemplateFormInputProperties } from '../common/wizards/processTemplate';
import { extractProperties } from '../services/templates/enitityTemplatesService';

export const regexSchema = Yup.string().test('is-regex', (value, context) => {
    if (!value) return true;
    try {
        // eslint-disable-next-line no-new
        new RegExp(value);
        return true;
    } catch (error) {
        return context.createError({ message: (error as Error).message });
    }
});

export const variableNameValidation = /^[a-zA-Z][a-zA-Z_$0-9]*$/;
export const variableUrlValidation =
    /^((ftp|http|https):\/\/)?(www.)?(?!.*(ftp|http|https|www.))[a-zA-Z0-9_-]+(\.[a-zA-Z]+)+((\/)[\w#]+)*(\/\w+\?[a-zA-Z0-9_]+=\w+(&[a-zA-Z0-9_]+=\w+)*)?$/gm;

export const workspaceNameValidation = /^[a-zA-Z0-9_-]+$/;

type PropertiesType = 'normal' | 'attachment';

const addDuplicateFieldsError = (
    fieldPath: string,
    duplicateFieldType: PropertiesType,
    inputType: 'name' | 'title',
    context: Yup.TestContext,
    errors: Yup.ValidationError[],
) => {
    const message = i18next.t(
        `validation.${duplicateFieldType === 'normal' ? 'field' : 'attachmentField'}${inputType === 'name' ? 'Name' : 'Title'}Exists`,
    );
    const path = `${fieldPath}.${inputType}`;
    console.log({ message, path });

    errors.push(context.createError({ message, path }));
};
const testFields = (
    properties1: EntityTemplateFormInputProperties[] | ProcessTemplateFormInputProperties[],
    properties1Type: PropertiesType,
    properties1Path: any,
    properties2: EntityTemplateFormInputProperties[] | ProcessTemplateFormInputProperties[],
    properties2Type: PropertiesType,
    properties2Path: any,
    context: Yup.TestContext,
    errors: Yup.ValidationError[],
) => {
    properties1.forEach((field1) => {
        properties2.forEach((field2) => {
            if (field1.id === field2.id) return;
            if (
                !('deleted' in field1 || 'deleted' in field2) ||
                ('deleted' in field1 && !field1.deleted) ||
                ('deleted' in field2 && !field2.deleted)
            ) {
                if (field1.name === field2.name) {
                    addDuplicateFieldsError(properties1Path[field1.id], properties2Type, 'name', context, errors);
                    addDuplicateFieldsError(properties2Path[field2.id], properties1Type, 'name', context, errors);
                }
                if (field1.title === field2.title) {
                    addDuplicateFieldsError(properties1Path[field1.id], properties2Type, 'title', context, errors);
                    addDuplicateFieldsError(properties2Path[field2.id], properties1Type, 'title', context, errors);
                }
            }
        });
    });
};

// const testGroupsName = (group1, )
const validateProperties = (properties, context, errors) => {
    const relatedUserFieldsOfkartoffelFields: { value: string; index: number }[] = [];
    const userFields: string[] = [];
    properties.forEach((value, index) => {
        if (value.type && value.type === 'user') {
            userFields.push(value.name);
        }
        if (value?.type === 'kartoffelUserField') {
            relatedUserFieldsOfkartoffelFields.push({ value: value.expandedUserField?.relatedUserField || '', index });
        }
    });

    relatedUserFieldsOfkartoffelFields.forEach((userField) => {
        if (!userFields.includes(userField.value))
            errors.push(
                context.createError({
                    message: 'wizard.entityTemplate.userFieldNotFound',
                    path: `properties[${userField.index}].expandedUserField.relatedUserField`,
                }),
            );
    });
};

export const entityTemplateUniqueProperties = (value, context: Yup.TestContext) => {
    if (!value) return true;

    const errors: Yup.ValidationError[] = [];
    const { properties, propertiesPath } = extractProperties(value.properties, 'properties');
    const { properties: attachmentProperties, propertiesPath: attachmentPath } = extractProperties(
        value.attachmentProperties,
        'attachmentProperties',
    );

    validateProperties(properties, context, errors);

    testFields(properties, 'normal', propertiesPath, properties, 'normal', propertiesPath, context, errors);
    testFields(attachmentProperties, 'attachment', attachmentPath, attachmentProperties, 'attachment', attachmentPath, context, errors);
    testFields(properties, 'normal', propertiesPath, attachmentProperties, 'attachment', attachmentPath, context, errors);

    if (errors.length) {
        return new Yup.ValidationError(errors);
    }

    return true;
};

export const processTemplateUniquePropertiesDetails = (value, context: Yup.TestContext) => {
    console.log({ value });
    if (!value) return true;
    const errors: Yup.ValidationError[] = [];
    const { properties: detailsProperties, propertiesPath: detailsPropertiesPath } = extractProperties(value.detailsProperties, 'detailsProperties');
    const { properties: attachmentProperties, propertiesPath: attachmentPropertiesPath } = extractProperties(
        value.detailsAttachmentProperties,
        'detailsAttachmentProperties',
    );

    testFields(detailsProperties, 'normal', detailsPropertiesPath, detailsProperties, 'normal', detailsPropertiesPath, context, errors);
    testFields(
        attachmentProperties,
        'attachment',
        attachmentPropertiesPath,
        attachmentProperties,
        'attachment',
        attachmentPropertiesPath,
        context,
        errors,
    );
    testFields(detailsProperties, 'normal', detailsPropertiesPath, attachmentProperties, 'attachment', attachmentPropertiesPath, context, errors);

    if (errors.length) {
        return new Yup.ValidationError(errors);
    }
    return true;
};

export const processTemplateUniquePropertiesSteps = (value, context: Yup.TestContext) => {
    if (!value) return true;
    const { steps } = value;
    const errors: Yup.ValidationError[] = [];
    steps.forEach((step, index) => {
        const { properties, propertiesPath } = extractProperties(step.properties, `steps[${index}].properties`);
        const { properties: attachmentProperties, propertiesPath: attachmentPath } = extractProperties(
            step.attachmentProperties,
            `steps[${index}].attachmentProperties`,
        );
        testFields(properties, 'normal', propertiesPath, properties, 'normal', propertiesPath, context, errors);
        testFields(attachmentProperties, 'attachment', attachmentPath, attachmentProperties, 'attachment', attachmentPath, context, errors);
        testFields(properties, 'normal', propertiesPath, attachmentProperties, 'attachment', attachmentPath, context, errors);
    });

    if (errors.length) {
        return new Yup.ValidationError(errors);
    }

    return true;
};
