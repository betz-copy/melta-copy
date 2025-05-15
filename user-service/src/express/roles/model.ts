import { Schema, model } from 'mongoose';
import { IRole } from '@microservices/shared';
import config from '../../config';

const { rolesCollectionName } = config.mongo;

const RoleSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
    },
    { timestamps: true, versionKey: false },
);

RoleSchema.index({ name: 1, workspaceId: 1, type: 1 }, { unique: true });

const RolesModel = model<IRole>(rolesCollectionName, RoleSchema);

export default RolesModel;
