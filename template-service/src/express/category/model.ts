import * as mongoose from 'mongoose';
import { IMongoCategory } from './interface';
import config from '../../config';

const CategorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
        },
        displayName: {
            type: String,
            required: true,
            unique: true,
        },
        iconFileId: {
            type: String,
        },
        color: {
            type: String,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

CategorySchema.index({ displayName: 'text' });

const CategoryModel = mongoose.model<IMongoCategory>(config.mongo.categoriesCollectionName, CategorySchema);

export default CategoryModel;
