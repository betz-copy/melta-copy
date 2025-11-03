import { BadRequestError, Colors, IMetadata, IWorkspace } from '@microservices/shared';
import mongoose from 'mongoose';
import config from '../../config';
import { AllowedEmptyString } from '../../utils/mongoose';

const MetadataSchema = new mongoose.Schema<IMetadata>(
    {
        shouldNavigateToEntityPage: { type: Boolean },
        isDrawerOpen: { type: Boolean },
        flowCube: { type: Boolean },
        isDashboardHomePage: { type: Boolean },
        agGrid: {
            rowCount: { type: Number },
            defaultExpandedRowCount: { type: Number },
            defaultRowHeight: { type: Number },
            defaultFontSize: { type: Number },
            defaultExpandedTableHeight: { type: Number },
        },
        mainFontSizes: {
            headlineTitleFontSize: { type: String },
            entityTemplateTitleFontSize: { type: String },
            headlineSubTitleFontSize: { type: String },
        },
        iconSize: {
            width: { type: String },
            height: { type: String },
        },
        excel: {
            entitiesFileLimit: { type: Number },
            filesLimit: { type: Number },
        },
        searchLimits: {
            bulk: { type: Number },
        },
        unitFieldSplitDepth: { type: Number },
        clientSide: {
            usersInfoChildTemplateId: { type: String },
            numOfPropsToShow: { type: Number },
            clientSideWorkspaceName: { type: String },
            fullNameField: { type: String },
        },
        mapPage: {
            showMapPage: { type: Boolean },
            sourceTemplateId: { type: String },
            destTemplateId: { type: String },
            sourceFieldForColor: { type: String },
        },
        unitsArray: { type: [String] },
        numOfRelationshipFieldsToShow: { type: Number },
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
        metadata: MetadataSchema,
    },
    { timestamps: true, versionKey: false },
);

const handleMongooseDuplicateKeyError = (error: any, _doc: mongoose.Document, next: any) => {
    if (error.name === 'MongoServerError' && error.code === 11000) {
        next(new BadRequestError('workspace with the same name already exists in this path'));
    } else {
        next(error);
    }
};

WorkspacesSchema.post('save', handleMongooseDuplicateKeyError);
WorkspacesSchema.post('findOneAndUpdate', handleMongooseDuplicateKeyError);

WorkspacesSchema.index({ name: 1, path: 1, type: 1 }, { unique: true });

const WorkspacesModel = mongoose.model<IWorkspace>(config.mongo.workspacesCollectionName, WorkspacesSchema);

export default WorkspacesModel;
