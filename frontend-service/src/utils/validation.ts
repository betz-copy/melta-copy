import i18next from 'i18next';
import * as Yup from 'yup';
import { EntityTemplateFormInputProperties } from '../common/wizards/entityTemplate';
import { ProcessTemplateFormInputProperties } from '../common/wizards/processTemplate';

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
    errors.push(context.createError({ message, path }));
};
const testFields = (
    properties1: EntityTemplateFormInputProperties[] | ProcessTemplateFormInputProperties[],
    properties1Type: PropertiesType,
    properties1Path: string,
    properties2: EntityTemplateFormInputProperties[] | ProcessTemplateFormInputProperties[],
    properties2Type: PropertiesType,
    properties2Path: string,
    context: Yup.TestContext,
    errors: Yup.ValidationError[],
) => {
    properties1.forEach((field1, index1) => {
        properties2.forEach((field2, index2) => {
            if (field1.id === field2.id) return;

            if (field1.name === field2.name) {
                addDuplicateFieldsError(`${properties1Path}[${index1}]`, properties2Type, 'name', context, errors);
                addDuplicateFieldsError(`${properties2Path}[${index2}]`, properties1Type, 'name', context, errors);
            }
            if (field1.title === field2.title) {
                addDuplicateFieldsError(`${properties1Path}[${index1}]`, properties2Type, 'title', context, errors);
                addDuplicateFieldsError(`${properties2Path}[${index2}]`, properties1Type, 'title', context, errors);
            }
        });
    });
};

export const entityTemplateUniqueProperties = (value, context: Yup.TestContext) => {
    if (!value) return true;
    const { properties, attachmentProperties } = value;

    const errors: Yup.ValidationError[] = [];

    testFields(properties, 'normal', 'properties', properties, 'normal', 'properties', context, errors);
    testFields(
        attachmentProperties,
        'attachment',
        'attachmentProperties',
        attachmentProperties,
        'attachment',
        'attachmentProperties',
        context,
        errors,
    );
    testFields(properties, 'normal', 'properties', attachmentProperties, 'attachment', 'attachmentProperties', context, errors);

    if (errors.length) {
        return new Yup.ValidationError(errors);
    }

    return true;
};

export const processTemplateUniquePropertiesDetails = (value, context: Yup.TestContext) => {
    if (!value) return true;
    const { detailsProperties, detailsAttachmentProperties } = value;
    const errors: Yup.ValidationError[] = [];

    testFields(detailsProperties, 'normal', 'detailsProperties', detailsProperties, 'normal', 'detailsProperties', context, errors);
    testFields(
        detailsAttachmentProperties,
        'attachment',
        'detailsAttachmentProperties',
        detailsAttachmentProperties,
        'attachment',
        'detailsAttachmentProperties',
        context,
        errors,
    );
    testFields(
        detailsProperties,
        'normal',
        'detailsProperties',
        detailsAttachmentProperties,
        'attachment',
        'detailsAttachmentProperties',
        context,
        errors,
    );

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
        testFields(step.properties, 'normal', `steps[${index}].properties`, step.properties, 'normal', `steps[${index}].properties`, context, errors);
        testFields(
            step.attachmentProperties,
            'attachment',
            `steps[${index}].attachmentProperties`,
            step.attachmentProperties,
            'attachment',
            `steps[${index}].attachmentProperties`,
            context,
            errors,
        );
        testFields(
            step.properties,
            'normal',
            `steps[${index}].properties`,
            step.attachmentProperties,
            'attachment',
            `steps[${index}].attachmentProperties`,
            context,
            errors,
        );
    });

    if (errors.length) {
        return new Yup.ValidationError(errors);
    }

    return true;
};
