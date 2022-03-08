import * as mongoose from 'mongoose';
import { ICategory } from './interface';
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
    },
    {
        timestamps: true,
    },
);

CategorySchema.index({ displayName: 'text' });

const CategoryModel = mongoose.model<ICategory & mongoose.Document>(config.mongo.categoryCollectionName, CategorySchema);

export default CategoryModel;
