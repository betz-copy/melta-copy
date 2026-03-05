import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { ConfigTypes } from '@packages/workspace';
import { HydratedDocument } from 'mongoose';

export type ConfigDocument = HydratedDocument<Config>;

@Schema({ discriminatorKey: 'type' })
export class Config {
    @ApiProperty({ enum: ConfigTypes })
    @Prop({ type: String, required: true, unique: true })
    type: ConfigTypes;
}

export const ConfigSchema = SchemaFactory.createForClass(Config);
ConfigSchema.index({ name: 'text' });

// Category Order Config Schema
@Schema()
export class CategoryOrderConfig extends Config {
    @ApiProperty({ type: [String] })
    @Prop({ type: [String], default: [], required: true })
    order: string[];
}

export const CategoryOrderConfigSchema = SchemaFactory.createForClass(CategoryOrderConfig);
