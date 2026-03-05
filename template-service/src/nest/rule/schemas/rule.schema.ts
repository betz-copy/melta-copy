import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ActionOnFail } from '@packages/rule';
import { ApiProperty } from '@nestjs/swagger';
import { HydratedDocument } from 'mongoose';

export type RuleDocument = HydratedDocument<Rule>;

@Schema({ timestamps: true, versionKey: false })
export class Rule {
    @ApiProperty({ example: 'rule_name' })
    @Prop({ required: true, unique: true })
    name: string;

    @ApiProperty({ example: 'Rule description' })
    @Prop({ required: true })
    description: string;

    @ApiProperty({ example: ActionOnFail.WARNING })
    @Prop({ type: String, enum: ActionOnFail, required: true })
    actionOnFail: ActionOnFail;

    @ApiProperty({ example: '507f1f77bcf86cd799439011' })
    @Prop({ required: true })
    entityTemplateId: string;

    @ApiProperty()
    @Prop({ type: Object, required: true })
    formula: Record<string, any>;

    @ApiProperty({ example: false })
    @Prop({ required: true, default: false })
    disabled: boolean;

    @ApiProperty()
    @Prop({ type: Object })
    fieldColor?: Record<string, any>;

    @ApiProperty()
    @Prop({ type: Object })
    mail?: Record<string, any>;

    @ApiProperty({ example: false })
    @Prop({ required: true, default: false })
    doesFormulaHaveTodayFunc: boolean;
}

export const RuleSchema = SchemaFactory.createForClass(Rule);
RuleSchema.index({ entityTemplateId: 1 });
RuleSchema.index({ name: 1 }, { unique: true });
