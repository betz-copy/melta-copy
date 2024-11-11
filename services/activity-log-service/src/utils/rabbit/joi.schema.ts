import * as Joi from 'joi';

export const MongoIdSchema = Joi.string().regex(/^[0-9a-fA-F]{24}$/, 'valid MongoId');

const activityLogSchema = Joi.object({
    timestamp: Joi.date().required(),
    entityId: Joi.string().required(),
    userId: Joi.string().required(),
    action: Joi.string()
        .valid(
            'DELETE_RELATIONSHIP',
            'CREATE_RELATIONSHIP',
            'UPDATE_ENTITY',
            'CREATE_ENTITY',
            'DUPLICATE_ENTITY',
            'DISABLE_ENTITY',
            'ACTIVATE_ENTITY',
            'VIEW_ENTITY',
        )
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
                is: Joi.valid('DUPLICATE_ENTITY'),
                then: Joi.object({
                    entityIdDuplicatedFrom: Joi.string().required(),
                }).required(),
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
});

// DELETE_RELATIONSHIP  metadata: { relationshipId:string,relationshipTemplateId:string, entityId:string }
// CREATE_RELATIONSHIP  metadata: { relationshipId:string,relationshipTemplateId:string, entityId:string }
// UPDATE_ENTITY        metadata: { updatedFields:[{FieldName:string, oldValue:any, newValue:any}]}
// CREATE_ENTITY        metadata: {}
// DISABLE_ENTITY       metadata: {}
// ACTIVATE_ENTITY      metadata: {}

export default activityLogSchema;
