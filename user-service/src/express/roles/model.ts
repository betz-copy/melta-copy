import { IRole } from '@packages/role';
import { model, Schema } from 'mongoose';
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
