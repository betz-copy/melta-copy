import * as Joi from 'joi';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv();
addFormats(ajv);

const MongoIdSchema = Joi.string().regex(/^[0-9a-fA-F]{24}$/, 'valid MongoId');
const stringFormats = ['date', 'time', 'date-time', 'email', 'hostname', 'ipv4', 'ipv6', 'uri'];
const allowedJSONSchemaTypes = ['string', 'number', 'boolean'];

const propertiesArraySchema = Joi.array()
    .items(
        Joi.object({
            title: Joi.string().required(),
            type: Joi.string()
                .valid(...allowedJSONSchemaTypes)
                .required(),
            format: Joi.string().valid(...stringFormats),
        }),
    )
    .unique((a, b) => a.title === b.title);

const innerPropertiesSchema = Joi.object()
    .keys({
        type: Joi.string().valid('object').required(),
        properties: Joi.object()
            .custom((value) => {
                const { error } = propertiesArraySchema.validate(Object.values(value)); // titles are unique

                if (error) {
                    throw error;
                }

                return value;
            })
            .required(),
        required: Joi.array()
            .items(Joi.string())
            .custom((value, helpers) => {
                const propertiesKeys = Object.keys(helpers.state.ancestors[0].properties);
                const isRequiredValid = value.every((item) => propertiesKeys.includes(item));

                if (!isRequiredValid) {
                    throw new Error('Unknown required property');
                }

                return value;
            }),
    })
    .custom((value) => {
        ajv.compile(value); // throws an error if JSONSchema is invalid

        return value;
    });

// GET /api/entities/templates?search=name&limit=0&skip=0&category=
export const getEntityTemplatesSchema = Joi.object({
    query: {
        search: Joi.string(),
        categoryId: MongoIdSchema,
        limit: Joi.number().integer().min(0).default(0),
        skip: Joi.number().integer().min(0).default(0),
    },
    body: {},
    params: {},
});

// GET /api/entities/templates/:templateId
export const getEntityTemplateByIdSchema = Joi.object({
    query: {},
    body: {},
    params: { templateId: MongoIdSchema.required() },
});

// DELETE /api/entities/templates/:templateId
export const deleteEntityTemplateSchema = Joi.object({
    body: {},
    query: {},
    params: { templateId: MongoIdSchema.required() },
});

// POST api/entities/templates
export const createEntityTemplateSchema = Joi.object({
    body: {
        name: Joi.string().required(),
        displayName: Joi.string().required(),
        category: Joi.string().required(),
        disabled: Joi.boolean().default(false),
        properties: innerPropertiesSchema.required(),
    },
    query: {},
    params: {},
});

// PUT /api/entities/templates/:templateId
export const updateEntityTemplateSchema = Joi.object({
    body: {
        name: Joi.string(),
        displayName: Joi.string(),
        category: Joi.string(),
        disabled: Joi.boolean(),
        properties: innerPropertiesSchema,
    },
    query: {},
    params: {
        templateId: MongoIdSchema.required(),
    },
});
