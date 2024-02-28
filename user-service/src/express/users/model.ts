import * as mongoose from 'mongoose';
import { IBaseUser } from './interface';
import config from '../../config';

const UserSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
        },
        jobTitle: {
            type: String,
            required: true,
        },
        hierarchy: {
            type: String,
            required: true,
        },
        mail: {
            type: String,
            required: true,
        },
        preferences: {
            darkMode: {
                type: Boolean,
            },
        },
        externalMetadata: {
            kartoffelId: {
                type: String,
                required: true,
                unique: true,
            },
            digitalIdentitySource: {
                type: String,
                required: true,
            },
        },
    },
    { timestamps: true, versionKey: false },
);

export const UsersModel = mongoose.model<IBaseUser>(config.mongo.usersCollectionName, UserSchema);
