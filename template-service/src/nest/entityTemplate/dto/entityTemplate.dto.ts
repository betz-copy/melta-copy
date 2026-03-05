import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// Entity Template Create Schema - simplified for better TS compatibility
export const CreateEntityTemplateSchema = z.object({
    name: z.string(),
    displayName: z.string(),
    category: z.string(),
    properties: z.any(),
    propertiesOrder: z.array(z.string()),
    propertiesTypeOrder: z.array(z.string()),
    propertiesPreview: z.array(z.string()),
    enumPropertiesColors: z.any().optional(),
    disabled: z.boolean().default(false),
    iconFileId: z.string().optional(),
    actions: z.string().optional(),
    documentTemplatesIds: z.array(z.string()).optional().default([]),
    mapSearchProperties: z.array(z.string()).optional().default([]),
    fieldGroups: z.any().optional().default([]),
    walletTransfer: z.any().optional(),
});

export class CreateEntityTemplateDto extends createZodDto(CreateEntityTemplateSchema) {}

export const UpdateEntityTemplateSchema = CreateEntityTemplateSchema.partial();
export class UpdateEntityTemplateDto extends createZodDto(UpdateEntityTemplateSchema) {}

export const SearchEntityTemplateSchema = z.object({
    search: z.string().optional(),
    ids: z.array(z.string()).optional(),
    categoryIds: z.array(z.string()).optional(),
    limit: z.coerce.number().default(10),
    skip: z.coerce.number().default(0),
});
export class SearchEntityTemplateDto extends createZodDto(SearchEntityTemplateSchema) {}

export const SearchByFormatSchema = z.object({ format: z.string() });
export class SearchByFormatDto extends createZodDto(SearchByFormatSchema) {}

export const UpdateStatusSchema = z.object({ disabled: z.boolean() });
export class UpdateStatusDto extends createZodDto(UpdateStatusSchema) {}

export const UpdateActionSchema = z.object({ actions: z.string().optional() });
export class UpdateActionDto extends createZodDto(UpdateActionSchema) {}
