import Joi from 'joi';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { IEntityTemplate, IEnumPropertiesColors, IProperties, ColorSchema, variableNameValidation, searchFilterSchema } from '@microservices/shared';
import config from '../../config';

const { notifications, ajvCustomFormats } = config;

const ajv = new Ajv();
ajv.addFormat('fileId', /.*/);
ajv.addFormat('signature', /.*/);
ajv.addFormat('comment', /.*/);
ajv.addFormat('kartoffelUserField', /.*/);
ajv.addFormat('unitField', /.*/);
ajv.addFormat('user', {
    type: 'string',
    validate: (user) => {
        const userObj = JSON.parse(user);
        return userObj._id && userObj.fullName && userObj.jobTitle && userObj.hierarchy && userObj.mail;
    },
});
ajv.addFormat('text-area', /.*/);
ajv.addFormat('relationshipReference', /.*/);
ajv.addFormat('location', ajvCustomFormats.locationFieldRegex);
addFormats(ajv);
ajv.addVocabulary(['patternCustomErrorMessage', 'hide']);
ajv.addKeyword({
    keyword: 'dateNotification',
    type: 'string',
});
ajv.addKeyword({
    keyword: 'relationshipReference',
    type: 'string',
});
ajv.addKeyword({
    keyword: 'serialStarter',
    type: 'number',
});
ajv.addKeyword({
    keyword: 'serialCurrent',
    type: 'number',
});
ajv.addKeyword({ keyword: 'user', type: 'string' });
ajv.addKeyword({ keyword: 'expandedUserField', type: 'string' });
ajv.addKeyword({ keyword: 'calculateTime', type: 'boolean' });
ajv.addKeyword({ keyword: 'isDailyAlert', type: 'boolean' });
ajv.addKeyword({ keyword: 'isDatePastAlert', type: 'boolean' });
ajv.addKeyword({ keyword: 'archive', type: 'boolean' });
ajv.addKeyword({ keyword: 'identifier', type: 'boolean' });
ajv.addKeyword({ keyword: 'hideFromDetailsPage', type: 'boolean' });
ajv.addKeyword({ keyword: 'comment', type: 'string' });
ajv.addKeyword({ keyword: 'color', type: 'string' });

export const stringFormats = [
    'date',
    'date-time',
    'email',
    'fileId',
    'text-area',
    'relationshipReference',
    'location',
    'user',
    'signature',
    'comment',
    'kartoffelUserField',
    'unitField',
];
const allowedJSONSchemaTypes = ['string', 'number', 'boolean', 'array'];

const propertiesArraySchema = Joi.array()
    .items(
        Joi.object({
            title: Joi.string().invalid('תאריך יצירה', 'תאריך עדכון', 'מושבת').required(),
            type: Joi.string()
                .valid(...allowedJSONSchemaTypes)
                .required(),
            format: Joi.string()
                .valid(...stringFormats)
                .when('type', { not: 'string', then: Joi.forbidden() })
                .when('pattern', { is: Joi.exist(), then: Joi.forbidden() }),
            enum: Joi.array().items(Joi.string()).when('type', { not: 'string', then: Joi.forbidden() }),
            readOnly: Joi.valid(true),
            identifier: Joi.valid(true),
            archive: Joi.boolean().optional(),
            pattern: Joi.string().when('type', { not: 'string', then: Joi.forbidden() }),
            patternCustomErrorMessage: Joi.string().when('pattern', { is: Joi.exist(), then: Joi.required(), otherwise: Joi.forbidden() }),
            items: Joi.object({
                type: Joi.string().valid('string').required(),
                format: Joi.string().valid('fileId', 'user'),
                enum: Joi.when('format', {
                    is: 'fileId',
                    then: Joi.forbidden(), // If format is fileId, enum is not allowed
                    otherwise: Joi.array().items(Joi.string()).min(1), // If format is not fileId, enum must have minimum length of 1
                }),
            }),
            minItems: Joi.valid(1).when('type', {
                is: 'array',
                then: Joi.required(),
                otherwise: Joi.forbidden(),
            }),
            uniqueItems: Joi.when(Joi.ref('items.format'), {
                is: 'fileId',
                then: Joi.forbidden(),
                otherwise: Joi.valid(true).when('type', {
                    is: 'array',
                    then: Joi.required(),
                    otherwise: Joi.forbidden(),
                }),
            }),
            dateNotification: Joi.number()
                .valid(...notifications.dateAlertOptions)
                .when('format', { not: Joi.valid('date', 'date-time'), then: Joi.forbidden() })
                .when('type', { not: 'string', then: Joi.forbidden() }),
            isDailyAlert: Joi.boolean()
                .when('format', { not: Joi.valid('date', 'date-time'), then: Joi.forbidden() })
                .when('type', { not: 'string', then: Joi.forbidden() }),
            isDatePastAlert: Joi.boolean()
                .when('format', { not: Joi.valid('date', 'date-time'), then: Joi.forbidden() })
                .when('type', { not: 'string', then: Joi.forbidden() }),
            relationshipReference: Joi.object({
                relationshipTemplateId: Joi.string(),
                relationshipTemplateDirection: Joi.string().valid('outgoing', 'incoming').required(),
                relatedTemplateId: Joi.string().required(),
                relatedTemplateField: Joi.string().required(),
                filters: searchFilterSchema.custom((value) => {
                    // todo: upgrade mongo version up to 5 and then delete that convert
                    if (value) return JSON.stringify(value);
                    return value;
                }),
            }).when('format', { is: 'relationshipReference', then: Joi.required(), otherwise: Joi.forbidden() }),
            expandedUserField: Joi.object({
                relatedUserField: Joi.string().required(),
                kartoffelField: Joi.string().required(),
            }).when('format', { is: 'kartoffelUserField', then: Joi.required(), otherwise: Joi.forbidden() }),
            calculateTime: Joi.boolean().when('format', { not: Joi.valid('date', 'date-time'), then: Joi.forbidden() }),
            serialStarter: Joi.number().when('type', { not: 'number', then: Joi.forbidden() }),
            serialCurrent: Joi.number().when('type', { not: 'number', then: Joi.forbidden() }),
            comment: Joi.string().when('format', { not: 'comment', then: Joi.forbidden() }),
            color: Joi.string().when('format', { not: 'comment', then: Joi.forbidden() }),
            hideFromDetailsPage: Joi.boolean().when('format', { not: 'comment', then: Joi.forbidden() }),
        }).nand('pattern', 'enum'),
    )
    .unique((a, b) => a.title === b.title);

const propertiesKeysArraySchema = Joi.array().items(variableNameValidation.invalid('createdAt', 'updatedAt', 'disable'));

const validatePropertiesArrayInProperties = (propertiesArray: string[], properties: IProperties['properties']) => {
    const propertiesKeys = Object.keys(properties);
    const doesEveryPropertyInPropertiesKeys = propertiesArray.every((item) => propertiesKeys.includes(item));

    if (!doesEveryPropertyInPropertiesKeys) {
        throw new Error('not all items are properties');
    }

    return propertiesArray;
};

const validateHideArrayNotInPropertiesPreview = (hide: string[], propertiesPreview: string[]) => {
    const isHideArrayNotInPreview = hide.every((item) => !propertiesPreview.includes(item));

    if (!isHideArrayNotInPreview) {
        throw new Error('item in hide array cannot be in preview array');
    }

    return hide;
};

const customHideValidation: Joi.CustomValidator = (hide: string[], helpers) => {
    validatePropertiesArrayInProperties(hide, helpers.state.ancestors[0].properties);

    return validateHideArrayNotInPropertiesPreview(hide, helpers.state.ancestors[1].propertiesPreview);
};

export const innerPropertiesSchema = Joi.object()
    .keys({
        type: Joi.string().valid('object').required(),
        properties: Joi.object()
            .custom((value) => {
                const { error: propertiesError } = propertiesArraySchema.validate(Object.values(value), { convert: false }); // titles are unique
                const { error: keyError } = propertiesKeysArraySchema.validate(Object.keys(value), { convert: false });

                if (propertiesError) {
                    throw propertiesError;
                }

                if (keyError) {
                    throw keyError;
                }

                return value;
            })
            .unknown(true)
            .required(),
        hide: Joi.array().unique().items(Joi.string()).custom(customHideValidation),
    })
    .custom((value) => {
        ajv.compile(value); // throws an error if JSONSchema is invalid

        return value;
    });

export const innerFieldGroupsSchema = Joi.array().items(
    Joi.object({
        name: Joi.string().required(),
        displayName: Joi.string().required(),
        fields: Joi.array().items(Joi.string()).unique().required(),
    }),
);
const customOrderPropertiesValidation: Joi.CustomValidator = (propertiesOrder: string[], helpers) => {
    const { properties } = helpers.state.ancestors[0].properties;
    const propertiesKeys = Object.keys(properties);

    if (propertiesKeys.length !== propertiesOrder.length) {
        throw new Error('not all fields are ordered');
    }

    return validatePropertiesArrayInProperties(propertiesOrder, properties);
};
export const orderPropertiesSchema = Joi.array().unique().items(Joi.string()).custom(customOrderPropertiesValidation);

export const orderPropertiesTypeSchema = Joi.array().unique().items(Joi.valid('properties', 'attachmentProperties'));

const customPreviewPropertiesValidation: Joi.CustomValidator = (propertiesPreview: string[], helpers) => {
    return validatePropertiesArrayInProperties(propertiesPreview, helpers.state.ancestors[0].properties.properties);
};
export const previewPropertiesSchema = Joi.array().unique().items(Joi.string()).custom(customPreviewPropertiesValidation);

const customEnumPropertiesColorsSchemaValidation: Joi.CustomValidator = (enumPropertiesColors: IEnumPropertiesColors, helpers) => {
    const { properties }: IEntityTemplate['properties'] = helpers.state.ancestors[0].properties;
    Object.entries(enumPropertiesColors).forEach(([key, value]) => {
        const property = properties[key];

        if (!property) throw new Error(`field ${key} does not exist`);
        if (!property.enum && !property.items?.enum) throw new Error(`field ${key} is not an enum or array enum`);

        Object.keys(value).forEach((enumOption) => {
            if (!property.enum?.includes(enumOption) && !property.items?.enum?.includes(enumOption))
                throw new Error(`enum option ${enumOption} does not exist in field ${key}`);
        });
    });

    return enumPropertiesColors;
};

export const enumPropertiesColorsSchema = Joi.object()
    .pattern(Joi.string(), Joi.object().pattern(Joi.string(), ColorSchema))
    .custom(customEnumPropertiesColorsSchemaValidation);
