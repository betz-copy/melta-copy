import { Schema, model } from 'mongoose';
import { config } from '../../config';
import { PermissionTypeOptions } from './interface';
import { IPermission } from './interface/permissions';

const { permissionsCollectionName } = config.mongo;

const PermissionSchema = new Schema(
    {
        userId: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: PermissionTypeOptions,
            required: true,
        },
        metadata: {
            type: Object,
            required: true,
        },
    },
    { timestamps: true, versionKey: false },
);

PermissionSchema.index({ userId: 1, type: 1 }, { unique: true });

export const PermissionsModel = model<IPermission>(permissionsCollectionName, PermissionSchema);
