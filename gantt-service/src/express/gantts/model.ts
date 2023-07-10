import * as mongoose from 'mongoose';

import { IGanttDocument } from './interface';
import config from '../../config';
import { ServiceError } from '../error';

const EntityTemplateSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
        },
        startDateField: {
            type: String,
            required: true,
        },
        endDateField: {
            type: String,
            required: true,
        },
        fieldsToShow: {
            type: [String],
            required: true,
        },
    },
    { _id: false },
);

const ConnectedEntityTemplateSchema = new mongoose.Schema(
    {
        relationshipTemplateId: {
            type: String,
            required: true,
        },
        fieldsToShow: {
            type: [String],
            required: true,
        },
    },
    { _id: false },
);

const GanttItem = new mongoose.Schema(
    {
        entityTemplate: {
            type: EntityTemplateSchema,
            required: true,
        },
        connectedEntityTemplate: {
            type: ConnectedEntityTemplateSchema,
            required: false,
        },
    },
    { _id: false },
);

const GanttSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
        },
        items: {
            type: [GanttItem],
            required: true,
        },
    },
    { timestamps: true, versionKey: false },
);

const handleMongooseDuplicateKeyError = (error: any, _doc: mongoose.Document, next: mongoose.HookNextFunction) => {
    if (error.name === 'MongoError' && error.code === 11000) {
        next(new ServiceError(400, 'gantt with the same name already exists'));
    } else {
        next(error);
    }
};

GanttSchema.post('save', handleMongooseDuplicateKeyError);
GanttSchema.post('findOneAndUpdate', handleMongooseDuplicateKeyError);

const GanttModel = mongoose.model<IGanttDocument>(config.mongo.ganttsCollectionName, GanttSchema);

export default GanttModel;
