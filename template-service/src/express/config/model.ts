import mongoose from 'mongoose';

export const ConfigSchema = new mongoose.Schema(
    {
        // name: { type: String, required: true, unique: true },
        type: { type: String, required: true, unique: true },
    },

    {
        discriminatorKey: 'type',
    },
);

ConfigSchema.index({ name: 'text' });

export const orderConfigSchema = new mongoose.Schema({
    order: {
        type: [String],
        default: [],
        required: true,
    },
});
