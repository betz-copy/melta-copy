import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const RelationshipTemplateSchema = z.object({
    name: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
    displayName: z.string().min(1),
    sourceEntityId: z.string().regex(/^[0-9a-fA-F]{24}$/),
    destinationEntityId: z.string().regex(/^[0-9a-fA-F]{24}$/),
    isProperty: z.boolean().default(false),
});

export class CreateRelationshipTemplateDto extends createZodDto(RelationshipTemplateSchema) {}

export class UpdateRelationshipTemplateDto extends createZodDto(RelationshipTemplateSchema.partial()) {}

export const SearchRelationshipSchema = z.object({
    search: z.string().optional(),
    sourceEntityId: z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .optional(),
    destinationEntityId: z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .optional(),
});

export class SearchRelationshipDto extends createZodDto(SearchRelationshipSchema) {}
