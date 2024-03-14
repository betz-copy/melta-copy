import mongoose from 'mongoose';

import { IPermission, resourceTypeOptions, scopeOptions } from './interface';
import config from '../../config';
import { handleMongooseDuplicateKeyError } from '../../utils/mongoose';

const PermissionSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
        },
        resourceType: {
            type: String,
            enum: resourceTypeOptions,
            required: true,
        },
        category: {
            type: String,
            required: true,
        },
        scopes: {
            type: [String],
            enum: scopeOptions,
            required: true,
        },
    },
    {
        timestamps: true,
        id: true,
        versionKey: false,
        toObject: {
            virtuals: true,
        },
        toJSON: {
            virtuals: true,
        },
    },
);

// will throw an exception if trying to create permission with the same trio of (resourceType, userId, category)
PermissionSchema.index({ resourceType: 1, userId: 1, category: 1 }, { unique: true });

PermissionSchema.post('save', handleMongooseDuplicateKeyError);
PermissionSchema.post('findOneAndUpdate', handleMongooseDuplicateKeyError);

const PermissionModel = mongoose.model<IPermission & mongoose.Document>(config.mongo.permissionsCollectionName, PermissionSchema);

export default PermissionModel;
