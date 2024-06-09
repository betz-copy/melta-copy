import { SchemaDefinition, SchemaOptions } from 'mongoose';

export const ruleBreachSchemaDefinition: SchemaDefinition = {
    originUserId: {
        type: String,
        required: true,
    },
    brokenRules: {
        type: [
            {
                ruleId: String,
                relationshipIds: [String],
            },
        ],
        required: true,
        _id: false,
    },
    actions: {
        type: [
            {
                actionType: {
                    type: String,
                    required: true,
                },
                actionMetadata: {
                    type: Object,
                    required: true,
                },
            },
        ],
        required: true,
        _id: false,
    },
};

export const defaultSchemaOptions: SchemaOptions = { timestamps: true, versionKey: false };
