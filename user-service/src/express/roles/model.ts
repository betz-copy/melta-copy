import { Schema, model } from 'mongoose';
import { config } from '../../config';
import { PermissionTypeOptions } from '../permissions/interface';
import { IRole } from './interface/permissions';

const { rolesCollectionName } = config.mongo;

const RoleSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
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

RoleSchema.index({ name: 1, workspaceId: 1, type: 1 }, { unique: true });

export const RolesModel = model<IRole>(rolesCollectionName, RoleSchema);
