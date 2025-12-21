import { IBaseUser } from '@packages/user';
import * as mongoose from 'mongoose';
import config from '../../config';

const UserSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
            index: true,
        },
        jobTitle: {
            type: String,
            required: true,
            index: true,
        },
        hierarchy: {
            type: String,
            required: true,
            index: true,
        },
        mail: {
            type: String,
            required: true,
            index: true,
        },
        profile: {
            type: String,
        },
        roleIds: { type: [String], index: true },
        preferences: {
            darkMode: {
                type: Boolean,
                default: false,
            },
            mailsNotificationsTypes: {
                type: [String],
                default: [],
            },
            profilePath: {
                type: String,
            },
        },
        kartoffelId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        units: {
            type: Map,
            of: [String],
        },
    },
    { timestamps: true, versionKey: false },
);

const UsersModel = mongoose.model<IBaseUser>(config.mongo.usersCollectionName, UserSchema);

export default UsersModel;
