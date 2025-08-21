import * as mongoose from 'mongoose';
import { IBaseUser } from '@microservices/shared';
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
        units: { type: [String] },
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
        externalMetadata: {
            kartoffelId: {
                type: String,
                required: true,
                unique: true,
                index: true,
            },
            digitalIdentitySource: {
                type: String,
                required: true,
                index: true,
            },
        },
    },
    { timestamps: true, versionKey: false },
);

const UsersModel = mongoose.model<IBaseUser>(config.mongo.usersCollectionName, UserSchema);

export default UsersModel;
