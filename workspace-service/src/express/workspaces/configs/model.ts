import { Schema, model } from 'mongoose';
import { config } from '../../../config';
import { IConfigs } from './interface';

const { configsCollectionName } = config.mongo;

const ConfigsSchema = new Schema(
    {
        workspaceId: {
            type: String,
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            index: true,
        },
        value: {
            type: Schema.Types.Mixed,
            required: true,
            index: true,
        },
        type: {
            type: String,
            required: true,
            index: true,
        },
        isAlive: {
            type: Boolean,
            required: true,
            index: true,
        },
    },
    { timestamps: true, versionKey: false },
);

ConfigsSchema.index({ workspaceId: 1, name: 1, type: 1 }, { unique: true });

export const ConfigsModel = model<IConfigs>(configsCollectionName, ConfigsSchema);
