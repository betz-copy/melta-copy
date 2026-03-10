import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { ViewType } from '@packages/child-template';

export const ChildTemplateSchema = z.object({
    name: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
    displayName: z.string().min(1),
    description: z.string().optional(),
    parentTemplateId: z.string().regex(/^[0-9a-fA-F]{24}$/),
    category: z.string().regex(/^[0-9a-fA-F]{24}$/),
    properties: z.object({}).passthrough(),
    disabled: z.boolean().default(false),
    actions: z.string().optional(),
    viewType: z.enum([ViewType.categoryPage, ViewType.userPage]),
    isFilterByCurrentUser: z.boolean().default(false),
});

export class CreateChildTemplateDto extends createZodDto(ChildTemplateSchema) {}
export class UpdateChildTemplateDto extends createZodDto(ChildTemplateSchema.partial()) {}
