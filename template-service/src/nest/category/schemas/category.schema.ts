import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { HydratedDocument } from 'mongoose';

export type CategoryDocument = HydratedDocument<Category>;

@Schema({ timestamps: true, versionKey: false })
export class Category {
    @ApiProperty({ example: 'person' })
    @Prop({ required: true, unique: true })
    name: string;

    @ApiProperty({ example: 'Person' })
    @Prop({ required: true, unique: true })
    displayName: string;

    @ApiProperty({ example: '507f1f77bcf86cd799439011', nullable: true })
    @Prop({ type: String, default: null })
    iconFileId: string | null;

    @ApiProperty({ example: '#FF5733' })
    @Prop({ type: String })
    color: string;

    @ApiProperty({ type: [String], example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'] })
    @Prop({ type: [String], default: [] })
    templatesOrder: string[];
}

export const CategorySchema = SchemaFactory.createForClass(Category);

CategorySchema.index({ displayName: 'text' });
