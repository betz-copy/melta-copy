import { IUnit } from '@packages/unit';
import * as mongoose from 'mongoose';
import config from '../../config';

const UnitSchema = new mongoose.Schema<IUnit>(
    {
        name: {
            type: String,
            required: true,
        },
        parentId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
            index: true,
        },
        // TODO move to a separate service and remove workspaceId
        workspaceId: {
            type: String,
            required: true,
            index: true,
        },
        disabled: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true, versionKey: false },
);

UnitSchema.index({ name: 1, workspaceId: 1 }, { unique: true });

const UnitsModel = mongoose.model<IUnit>(config.mongo.unitsCollectionName, UnitSchema);

export default UnitsModel;
