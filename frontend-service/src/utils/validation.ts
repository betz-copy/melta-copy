import i18next from 'i18next';
import * as Yup from 'yup';
import { EntityTemplateFormInputProperties } from '../common/wizards/entityTemplate';
import { GroupProperty } from '../common/wizards/entityTemplate/commonInterfaces';
import { ProcessTemplateFormInputProperties } from '../common/wizards/processTemplate';
import { extractGroups, extractProperties } from '../services/templates/entityTemplatesService';

export const regexSchema = Yup.string()
    .test('is-regex', (value, context) => {
        if (!value) return true;
        try {
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
    inputType: 'name' | 'title' | 'displayName',
    context: Yup.TestContext,
    errors: Yup.ValidationError[],
    groupTest: boolean = false,
) => {
    const message = i18next.t(
        `validation.${duplicateFieldType === 'normal' ? (groupTest ? 'group' : 'field') : 'attachmentField'}${
            inputType === 'name' ? 'Name' : 'Title'
        }Exists`,
    );
    const path = `${fieldPath}.${inputType}`;

    errors.push(context.createError({ message, path }));
};
const testFields = (
    properties1: EntityTemplateFormInputProperties[] | ProcessTemplateFormInputProperties[] | (GroupProperty & { index: number })[],
    properties1Type: PropertiesType,
    properties1Path: Record<string, string>,
    properties2: EntityTemplateFormInputProperties[] | ProcessTemplateFormInputProperties[] | (GroupProperty & { index: number })[],
    properties2Type: PropertiesType,
    properties2Path: Record<string, string>,
    context: Yup.TestContext,
    errors: Yup.ValidationError[],
    groupTest = false,
) => {
    properties1.forEach((field1) => {
        properties2.forEach((field2) => {
            if (field1.id === field2.id) return;

            const isDeleted = (field) => field.deleted === true;

            const shouldCompare = groupTest || (!isDeleted(field1) && !isDeleted(field2));

            if (!shouldCompare) return;

            const compareAndAddError = (key: 'name' | 'title' | 'displayName', condition: boolean) => {
                if (condition) {
                    addDuplicateFieldsError(properties1Path[field1.id], properties2Type, key, context, errors, groupTest);
                    addDuplicateFieldsError(properties2Path[field2.id], properties1Type, key, context, errors, groupTest);
                }
            };

            compareAndAddError('name', field1.name === field2.name);
            compareAndAddError(
                groupTest ? 'displayName' : 'title',
                field1[groupTest ? 'displayName' : 'title'] === field2[groupTest ? 'displayName' : 'title'],
            );
        });
    });
};

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
    const { properties, propertiesPath } = extractProperties<EntityTemplateFormInputProperties>(value.properties, 'properties');
    const { properties: attachmentProperties, propertiesPath: attachmentPath } = extractProperties<EntityTemplateFormInputProperties>(
        value.attachmentProperties,
        'attachmentProperties',
    );

    const { groupsProperties, groupsPath } = extractGroups(value.properties);
    validateProperties(properties, context, errors);

    testFields(properties, 'normal', propertiesPath, properties, 'normal', propertiesPath, context, errors);
    testFields(attachmentProperties, 'attachment', attachmentPath, attachmentProperties, 'attachment', attachmentPath, context, errors);
    testFields(properties, 'normal', propertiesPath, attachmentProperties, 'attachment', attachmentPath, context, errors);
    testFields(groupsProperties, 'normal', groupsPath, groupsProperties, 'normal', groupsPath, context, errors, true);

    if (errors.length) {
        return new Yup.ValidationError(errors);
    }

    return true;
};

export const processTemplateUniquePropertiesDetails = (value, context: Yup.TestContext) => {
    if (!value) return true;
    const errors: Yup.ValidationError[] = [];
    const { properties: detailsProperties, propertiesPath: detailsPropertiesPath } = extractProperties<ProcessTemplateFormInputProperties>(
        value.detailsProperties,
        'detailsProperties',
    );
    const { properties: attachmentProperties, propertiesPath: attachmentPropertiesPath } = extractProperties<ProcessTemplateFormInputProperties>(
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
        const { properties, propertiesPath } = extractProperties<ProcessTemplateFormInputProperties>(step.properties, `steps[${index}].properties`);
        const { properties: attachmentProperties, propertiesPath: attachmentPath } = extractProperties<ProcessTemplateFormInputProperties>(
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
