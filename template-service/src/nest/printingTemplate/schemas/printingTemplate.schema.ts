import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { HydratedDocument } from 'mongoose';

export type PrintingTemplateDocument = HydratedDocument<PrintingTemplate>;

@Schema({ _id: false })
export class PrintSection {
    @ApiProperty({ example: 'category1' })
    @Prop({ required: true })
    categoryId: string;

    @ApiProperty({ example: 'entity1' })
    @Prop({ required: true })
    entityTemplateId: string;

    @ApiProperty({ type: [String] })
    @Prop({ type: [String], required: true })
    selectedColumns: string[];
}

@Schema({ timestamps: true, versionKey: false })
export class PrintingTemplate {
    @ApiProperty({ example: 'report_2024' })
    @Prop({ required: true, unique: true })
    name: string;

    @ApiProperty({ type: [PrintSection] })
    @Prop({ type: [PrintSection], required: true })
    sections: PrintSection[];

    @ApiProperty({ example: false })
    @Prop({ required: true, default: false })
    compactView: boolean;

    @ApiProperty({ example: true })
    @Prop({ required: true, default: true })
    addEntityCheckbox: boolean;

    @ApiProperty({ example: false })
    @Prop({ required: true, default: false })
    appendSignatureField: boolean;
}

export const PrintingTemplateSchema = SchemaFactory.createForClass(PrintingTemplate);
PrintingTemplateSchema.index({ name: 1 }, { unique: true });
