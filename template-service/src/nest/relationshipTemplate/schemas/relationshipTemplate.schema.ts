import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { HydratedDocument } from 'mongoose';
import { Types } from 'mongoose';

export type RelationshipTemplateDocument = HydratedDocument<RelationshipTemplate>;

@Schema({ timestamps: true, versionKey: false })
export class RelationshipTemplate {
    @ApiProperty({ example: 'manager' })
    @Prop({ required: true })
    name: string;

    @ApiProperty({ example: 'Manager' })
    @Prop({ required: true })
    displayName: string;

    @ApiProperty({ example: '507f1f77bcf86cd799439011' })
    @Prop({ type: Types.ObjectId, required: true })
    sourceEntityId: Types.ObjectId;

    @ApiProperty({ example: '507f1f77bcf86cd799439012' })
    @Prop({ type: Types.ObjectId, required: true })
    destinationEntityId: Types.ObjectId;

    @ApiProperty({ example: false })
    @Prop({ default: false })
    isProperty: boolean;
}

export const RelationshipTemplateSchema = SchemaFactory.createForClass(RelationshipTemplate);

RelationshipTemplateSchema.index({ name: 1, sourceEntityId: 1, destinationEntityId: 1 }, { unique: true });
RelationshipTemplateSchema.index({ displayName: 1, sourceEntityId: 1, destinationEntityId: 1 }, { unique: true });
RelationshipTemplateSchema.index({ sourceEntityId: 1 });
RelationshipTemplateSchema.index({ destinationEntityId: 1 });
