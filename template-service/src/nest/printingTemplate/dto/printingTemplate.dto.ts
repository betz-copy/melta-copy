import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const printSectionSchema = z.object({
    categoryId: z.string(),
    entityTemplateId: z.string(),
    selectedColumns: z.array(z.string()),
});

export const PrintingTemplateSchema = z.object({
    name: z.string().min(1),
    sections: z.array(printSectionSchema),
    compactView: z.boolean().default(false),
    addEntityCheckbox: z.boolean().default(true),
    appendSignatureField: z.boolean().default(false),
});

export class CreatePrintingTemplateDto extends createZodDto(PrintingTemplateSchema) {}
export class UpdatePrintingTemplateDto extends createZodDto(PrintingTemplateSchema.partial()) {}
