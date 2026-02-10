import { IPermission, PermissionTypeOptions } from '@packages/permission';
import { model, Schema } from 'mongoose';
import config from '../../config';

const { permissionsCollectionName } = config.mongo;

export const PermissionSchema = new Schema(
    {
        relatedId: {
            type: String,
            required: true,
            index: true,
        },
        workspaceId: {
            type: String,
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: PermissionTypeOptions,
            required: true,
            index: true,
        },
        metadata: {
            type: Object,
            required: true,
        },
    },
    { timestamps: true, versionKey: false },
);

PermissionSchema.index({ relatedId: 1, workspaceId: 1, type: 1 }, { unique: true });

const PermissionsModel = model<IPermission>(permissionsCollectionName, PermissionSchema);

export default PermissionsModel;
