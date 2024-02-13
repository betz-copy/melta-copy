import * as mongoose from 'mongoose';
import { IBaseUser } from './interface';
import config from '../../config';

const UserSchema = new mongoose.Schema(
    {
        externalId: {
            type: String,
            required: true,
            unique: true,
        },
        fullName: {
            type: String,
            required: true,
        },
        jobTitle: {
            type: String,
            required: true,
        },
        preferences: {
            darkMode: {
                type: Boolean,
            },
        },
    },
    { timestamps: true, versionKey: false },
);

export const UsersModel = mongoose.model<IBaseUser>(config.mongo.usersCollectionName, UserSchema);
