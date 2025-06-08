import { Schema, model } from 'mongoose';
import { IRole } from '@microservices/shared';
import config from '../../config';

const { rolesCollectionName } = config.mongo;

const RoleSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            index: true,
        },
    },
    { timestamps: true, versionKey: false },
);

const RolesModel = model<IRole>(rolesCollectionName, RoleSchema);

export default RolesModel;
