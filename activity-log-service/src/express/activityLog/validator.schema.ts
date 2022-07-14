import * as Joi from 'joi';

// GET /api/activityLog/:entityId
export const getActivitySchema = Joi.object({
    query: {
        limit: Joi.number().integer().min(0).default(0),
        skip: Joi.number().integer().min(0).default(0),
    },
    body: {},
    params: {
        entityId: Joi.string(),
    },
});

// POST /api/activityLog/
export const createActivityRequestSchema = Joi.object({
    body: {
        timestamp: Joi.date().required(),
        entityId: Joi.string().required(),
        userId: Joi.string().required(),
        action: Joi.string()
            .valid('DELETE_RELATIONSHIP', 'CREATE_RELATIONSHIP', 'UPDATE_ENTITY', 'CREATE_ENTITY', 'DISABLE_ENTITY', 'ACTIVATE_ENTITY')
            .required(),
        metadata: Joi.when('action', {
            switch: [
                {
                    is: Joi.valid('DELETE_RELATIONSHIP', 'CREATE_RELATIONSHIP'),
                    then: Joi.object({
                        relationshipId: Joi.string().required(),
                        entityId: Joi.string().required(),
                        relationshipTemplateId: Joi.string().required(),
                    }),
                },
                {
                    is: Joi.valid('UPDATE_ENTITY'),
                    then: Joi.object({
                        updatedFields: Joi.array()
                            .items(
                                Joi.object({
                                    fieldName: Joi.string().required(),
                                    oldValue: Joi.any().required(),
                                    newValue: Joi.any().required(),
                                }),
                            )
                            .required()
                            .min(1),
                    }).required(),
                },
            ],
            otherwise: Joi.valid({}),
        }),
    },
    query: {},
    params: {},
});

// DELETE_RELATIONSHIP  metadata: { relationshipId:string,relationshipTemplateId:string, entityId:string }
// CREATE_RELATIONSHIP  metadata: { relationshipId:string,relationshipTemplateId:string, entityId:string }
// UPDATE_ENTITY        metadata: { updatedFields:[{FieldName:string, oldValue:any, newValue:any}]}
// CREATE_ENTITY        metadata: {}
// DISABLE_ENTITY       metadata: {}
// ACTIVATE_ENTITY      metadata: {}
