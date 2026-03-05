import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { HydratedDocument } from 'mongoose';
import { Types } from 'mongoose';

export type EntityTemplateDocument = HydratedDocument<EntityTemplate>;

@Schema({ _id: false })
export class FieldGroup {
    @ApiProperty({ example: 'Basic Info' })
    @Prop({ required: true })
    name: string;

    @ApiProperty({ example: 'Basic Information' })
    @Prop({ required: true })
    displayName: string;

    @ApiProperty({ type: [String] })
    @Prop({ type: [String], required: true })
    fields: string[];
}

@Schema({ _id: false })
export class WalletTransfer {
    @ApiProperty({ example: 'account1' })
    @Prop({ required: true })
    from: string;

    @ApiProperty({ example: 'account2' })
    @Prop({ required: true })
    to: string;

    @ApiProperty({ example: 'Payment' })
    @Prop({ required: true })
    description: string;

    @ApiProperty({ example: '100' })
    @Prop({ required: true })
    amount: string;
}

@Schema({ timestamps: true, versionKey: false, minimize: false })
export class EntityTemplate {
    @ApiProperty({ example: 'person' })
    @Prop({ required: true, unique: true })
    name: string;

    @ApiProperty({ example: 'Person' })
    @Prop({ required: true, unique: true })
    displayName: string;

    @ApiProperty({ example: '507f1f77bcf86cd799439011' })
    @Prop({ type: Types.ObjectId, ref: 'Category', required: true, index: true })
    category: Types.ObjectId;

    @ApiProperty()
    @Prop({ type: Object, required: true })
    properties: Record<string, any>;

    @ApiProperty({ type: [String] })
    @Prop({ type: [String], required: true })
    propertiesOrder: string[];

    @ApiProperty({ type: [String] })
    @Prop({ type: [String], required: true })
    propertiesTypeOrder: string[];

    @ApiProperty({ type: [String] })
    @Prop({ type: [String], required: true })
    propertiesPreview: string[];

    @ApiProperty()
    @Prop({ type: Object })
    enumPropertiesColors?: Record<string, any>;

    @ApiProperty({ example: false })
    @Prop({ required: true, index: true, default: false })
    disabled: boolean;

    @ApiProperty({ example: '507f1f77bcf86cd799439012', nullable: true })
    @Prop({ type: String })
    iconFileId?: string;

    @ApiProperty({ nullable: true })
    @Prop({ type: String })
    actions?: string;

    @ApiProperty({ type: [String] })
    @Prop({ type: [String], default: [] })
    documentTemplatesIds: string[];

    @ApiProperty({ type: [String] })
    @Prop({ type: [String], default: [] })
    mapSearchProperties: string[];

    @ApiProperty({ type: [FieldGroup] })
    @Prop({ type: [FieldGroup], default: [] })
    fieldGroups: FieldGroup[];

    @ApiProperty()
    @Prop({ type: WalletTransfer })
    walletTransfer?: WalletTransfer;
}

export const EntityTemplateSchema = SchemaFactory.createForClass(EntityTemplate);

EntityTemplateSchema.index({ displayName: 'text' });
EntityTemplateSchema.index({ 'fieldGroups.name': 1, name: 1 }, { unique: true });
EntityTemplateSchema.index({ 'fieldGroups.displayName': 1, name: 1 }, { unique: true });
