import mongoose from 'mongoose';
import config from '../../config';
import { IMongoCategory } from './interface';

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
