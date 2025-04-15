import mongoose from 'mongoose';
// import { IMongoBaseConfig, IMongoOrderConfig } from './interface';

export const ConfigSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true },
        type: { type: String, required: true },
    },

    {
        discriminatorKey: 'type',
    },
);

ConfigSchema.index({ name: 'text' });

// const BaseConfig = mongoose.model<IMongoBaseConfig>('BaseConfig', ConfigSchema);

export const orderConfigSchema = new mongoose.Schema({
    order: {
        type: [String],
        default: [],
        required: true,
    },
});

// export const CategoryOrderConfig = BaseConfig.discriminator<IMongoOrderConfig>('order', orderSchema);
