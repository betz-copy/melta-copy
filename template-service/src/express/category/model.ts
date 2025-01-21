import mongoose from 'mongoose';

export const CategorySchema = new mongoose.Schema(
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

const Category = mongoose.model('categories', CategorySchema);

export default Category;
