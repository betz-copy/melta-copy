import mongoose from 'mongoose';
import { config } from '../../config';
import { ServiceError } from '../error';
import { Colors, IMetadata, IWorkspace } from './interface';
import { AllowedEmptyString } from '../../utils/mongoose';

const MetadataSchema = new mongoose.Schema<IMetadata>(
    {
        shouldDisplayProcesses: { type: Boolean, required: true },
        agGrid: {
            rowCount: { type: Number, required: true },
            defaultExpandedRowCount: { type: Number, required: true },
            defaultRowHeight: { type: Number, required: true },
            defaultFontSize: { type: Number, required: true },
            cacheBlockSize: { type: Number, required: true },
            infiniteInitialRowCount: { type: Number, required: true },
        },
        mainFontSizes: {
            headlineTitleFontSize: { type: String, required: true },
            headlineSubTitleFontSize: { type: String, required: true },
        },
        smallPreviewHeight: {
            number: { type: String, required: true },
            unit: { type: String, required: true },
        },
        iconSize: {
            width: { type: String, required: true },
            height: { type: String, required: true },
        },
    },
    { _id: false },
);

const ColorsSchema = new mongoose.Schema<IWorkspace['colors']>(
    Object.values(Colors).reduce((acc, color) => ({ ...acc, [color]: { type: String, required: true } }), {}),
    { _id: false, versionKey: false },
);

const WorkspacesSchema = new mongoose.Schema<IWorkspace>(
    {
        name: {
            type: String,
            required: true,
        },
        displayName: {
            type: String,
            required: true,
        },
        // Materialized paths pattern
        path: {
            type: String,
            required: true,
            index: true,
        },
        type: {
            type: AllowedEmptyString,
            required: true,
            index: true,
        },
        colors: ColorsSchema,
        iconFileId: {
            type: String,
        },
        logoFileId: {
            type: String,
        },
        metadata: {
            type: MetadataSchema,
            default: {},
            _id: false,
        },
    },
    { timestamps: true, versionKey: false },
);

const handleMongooseDuplicateKeyError = (error: any, _doc: mongoose.Document, next: any) => {
    if (error.name === 'MongoServerError' && error.code === 11000) {
        next(new ServiceError(400, 'workspace with the same name already exists in this path'));
    } else {
        next(error);
    }
};

WorkspacesSchema.post('save', handleMongooseDuplicateKeyError);
WorkspacesSchema.post('findOneAndUpdate', handleMongooseDuplicateKeyError);

WorkspacesSchema.index({ name: 1, path: 1, type: 1 }, { unique: true });

export const WorkspacesModel = mongoose.model<IWorkspace>(config.mongo.workspacesCollectionName, WorkspacesSchema);
