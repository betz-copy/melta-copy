import * as Joi from 'joi';

// GET /api/activityLog/:entityId
// eslint-disable-next-line import/prefer-default-export
export const getActivitySchema = Joi.object({
    query: {
        limit: Joi.number().integer().min(0).default(0),
        skip: Joi.number().integer().min(0).default(0),
        actions: Joi.array().items(Joi.string()).default([]),
    },
    body: {},
    params: {
        entityId: Joi.string().required(),
    },
});

// DELETE_RELATIONSHIP  metadata: { relationshipId:string,relationshipTemplateId:string, entityId:string }
// CREATE_RELATIONSHIP  metadata: { relationshipId:string,relationshipTemplateId:string, entityId:string }
// UPDATE_ENTITY        metadata: { updatedFields:[{FieldName:string, oldValue:any, newValue:any}]}
// CREATE_ENTITY        metadata: {}
// DISABLE_ENTITY       metadata: {}
// ACTIVATE_ENTITY      metadata: {}
