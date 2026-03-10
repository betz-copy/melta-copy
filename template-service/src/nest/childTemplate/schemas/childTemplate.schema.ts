import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ViewType } from '@packages/child-template';
import { ApiProperty } from '@nestjs/swagger';
import { HydratedDocument } from 'mongoose';
import { Types } from 'mongoose';

export type ChildTemplateDocument = HydratedDocument<ChildTemplate>;

@Schema({ timestamps: true, versionKey: false })
export class ChildTemplate {
    @ApiProperty({ example: 'person_child' })
    @Prop({ required: true, unique: true })
    name: string;

    @ApiProperty({ example: 'Person Child' })
    @Prop({ required: true, unique: true })
    displayName: string;

    @ApiProperty({ example: 'Child template for persons' })
    @Prop({})
    description?: string;

    @ApiProperty({ example: '507f1f77bcf86cd799439011' })
    @Prop({ type: Types.ObjectId, ref: 'EntityTemplate', required: true })
    parentTemplateId: Types.ObjectId;

    @ApiProperty({ example: '507f1f77bcf86cd799439012' })
    @Prop({ type: Types.ObjectId, ref: 'Category', required: true, index: true })
    category: Types.ObjectId;

    @ApiProperty()
    @Prop({ type: Object, required: true })
    properties: Record<string, any>;

    @ApiProperty({ example: false })
    @Prop({ required: true, index: true, default: false })
    disabled: boolean;

    @ApiProperty({ nullable: true })
    @Prop({ type: String })
    actions?: string;

    @ApiProperty({ enum: [ViewType.categoryPage, ViewType.userPage] })
    @Prop({ type: String, enum: [ViewType.categoryPage, ViewType.userPage], required: true })
    viewType: ViewType;

    @ApiProperty({ example: false })
    @Prop({ default: false })
    isFilterByCurrentUser: boolean;
}

export const ChildTemplateSchema = SchemaFactory.createForClass(ChildTemplate);
ChildTemplateSchema.index({ parentTemplateId: 1 });
ChildTemplateSchema.index({ category: 1 });
