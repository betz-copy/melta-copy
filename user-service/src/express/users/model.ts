import * as mongoose from 'mongoose';
import { IBaseUser } from './interface';
import { config } from '../../config';

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
        preferences: {
            darkMode: {
                type: Boolean,
            },
            mailsNotificationsTypes: {
                type: [],
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

export const UsersModel = mongoose.model<IBaseUser>(config.mongo.usersCollectionName, UserSchema);
