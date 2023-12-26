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
    actionType: {
        type: String,
        required: true,
    },
    actionMetadata: {
        type: Object,
        required: true,
    },
};

export const defaultSchemaOptions: SchemaOptions = { timestamps: true, versionKey: false };
